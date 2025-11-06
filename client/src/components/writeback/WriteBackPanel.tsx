/**
 * WriteBackPanel Component
 *
 * Posts MeasureReports and ViewDefinitions back to FHIR server
 */

import { useState } from 'react';
import { MedplumClient } from '@medplum/core';
import {
  CloudUpload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Eye,
  ExternalLink,
  List,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';

type ResourceType = 'cql-measure-report' | 'sql-measure-report' | 'view-definition';

export function WriteBackPanel() {
  const {
    fhirServer,
    cqlMeasureReport,
    sqlMeasureReport,
    viewDefinitions,
    addPostedResource,
    postedResources,
    markStepComplete,
  } = useAppStore();

  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [previewJson, setPreviewJson] = useState<string>('');

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // ============================================================================
  // Resource Selection & Preview
  // ============================================================================

  const handleSelectResource = (type: ResourceType) => {
    setSelectedResource(type);
    setStatus({ type: 'idle', message: '' });

    let resource: any = null;

    switch (type) {
      case 'cql-measure-report':
        resource = cqlMeasureReport;
        break;
      case 'sql-measure-report':
        resource = sqlMeasureReport;
        break;
      case 'view-definition':
        // Use first view definition if available
        resource = viewDefinitions.length > 0 ? viewDefinitions[0] : null;
        break;
    }

    if (resource) {
      setPreviewJson(JSON.stringify(resource, null, 2));
    } else {
      setPreviewJson('');
    }
  };

  // ============================================================================
  // Post to FHIR Server
  // ============================================================================

  const handlePostToFhir = async () => {
    if (!fhirServer.isConnected) {
      setStatus({
        type: 'error',
        message: 'Please connect to FHIR server first (Step 1)',
      });
      return;
    }

    if (!selectedResource) {
      setStatus({
        type: 'error',
        message: 'Please select a resource to post',
      });
      return;
    }

    setIsPosting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const client = new MedplumClient({
        baseUrl: fhirServer.baseUrl,
      });

      if (fhirServer.accessToken) {
        client.setAccessToken(fhirServer.accessToken);
      }

      let resource: any = null;
      let resourceType = '';

      switch (selectedResource) {
        case 'cql-measure-report':
          resource = { ...cqlMeasureReport };
          resourceType = 'MeasureReport';
          // Remove id to let server assign one
          delete resource.id;
          break;
        case 'sql-measure-report':
          resource = { ...sqlMeasureReport };
          resourceType = 'MeasureReport';
          // Remove id to let server assign one
          delete resource.id;
          break;
        case 'view-definition':
          resource = viewDefinitions.length > 0 ? { ...viewDefinitions[0] } : null;
          resourceType = 'ViewDefinition';
          if (resource) {
            delete resource.id;
          }
          break;
      }

      if (!resource) {
        throw new Error('No resource available to post');
      }

      // Post to FHIR server
      const response = await client.createResource(resource);

      // Track posted resource
      const resourceId = response.id || 'unknown';
      const resourceUrl = `${fhirServer.baseUrl}/fhir/R4/${resourceType}/${resourceId}`;

      addPostedResource({
        resourceType,
        id: resourceId,
        url: resourceUrl,
      });

      // Mark step complete
      markStepComplete('writeback');

      setStatus({
        type: 'success',
        message: `Successfully posted ${resourceType} to FHIR server (ID: ${resourceId})`,
      });

      // Clear selection
      setSelectedResource(null);
      setPreviewJson('');
    } catch (error) {
      console.error('Failed to post resource:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to post resource to FHIR server',
      });
    } finally {
      setIsPosting(false);
    }
  };

  // ============================================================================
  // Resource Availability Check
  // ============================================================================

  const hasAvailableResources = cqlMeasureReport || sqlMeasureReport || viewDefinitions.length > 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          Write Back to FHIR Server
        </CardTitle>
        <CardDescription>
          Post measure reports and view definitions back to FHIR server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Messages */}
        {!fhirServer.isConnected && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <XCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Not connected to FHIR server. Please complete Step 1 first.
            </AlertDescription>
          </Alert>
        )}

        {status.type !== 'idle' && (
          <Alert
            className={
              status.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}
            >
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select & Post</TabsTrigger>
            <TabsTrigger value="posted">Posted Resources</TabsTrigger>
          </TabsList>

          {/* Select & Post Tab */}
          <TabsContent value="select" className="space-y-4">
            {!hasAvailableResources ? (
              <Alert>
                <AlertDescription>
                  No resources available to post. Please complete previous steps to generate
                  MeasureReports or ViewDefinitions.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Resource Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Available Resources</h3>

                  {/* CQL MeasureReport */}
                  {cqlMeasureReport && (
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResource === 'cql-measure-report'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectResource('cql-measure-report')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">CQL MeasureReport</p>
                            <p className="text-xs text-muted-foreground">
                              Generated from direct CQL execution
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">CQL Path</Badge>
                          {selectedResource === 'cql-measure-report' && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SQL MeasureReport */}
                  {sqlMeasureReport && (
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResource === 'sql-measure-report'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectResource('sql-measure-report')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">SQL MeasureReport</p>
                            <p className="text-xs text-muted-foreground">
                              Generated from SQL on FHIR execution
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">SQL Path</Badge>
                          {selectedResource === 'sql-measure-report' && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ViewDefinition */}
                  {viewDefinitions.length > 0 && (
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResource === 'view-definition'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectResource('view-definition')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">ViewDefinition</p>
                            <p className="text-xs text-muted-foreground">
                              {viewDefinitions[0].name || 'SQL on FHIR view'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">View</Badge>
                          {selectedResource === 'view-definition' && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {previewJson && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Resource Preview</h3>
                    <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
                      <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                        {previewJson}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {/* Post Button */}
                <Button
                  onClick={handlePostToFhir}
                  disabled={isPosting || !selectedResource || !fhirServer.isConnected}
                  className="w-full"
                  size="lg"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Posting to FHIR Server...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="mr-2 h-5 w-5" />
                      Post to FHIR Server
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Posted Resources Tab */}
          <TabsContent value="posted" className="space-y-4">
            {postedResources.length === 0 ? (
              <Alert>
                <List className="h-4 w-4" />
                <AlertDescription>
                  No resources have been posted yet. Select a resource from the "Select & Post"
                  tab to post it to the FHIR server.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Posted Resources ({postedResources.length})
                </h3>
                <div className="space-y-2">
                  {postedResources.map((resource, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="font-medium">{resource.resourceType}</p>
                            <Badge variant="outline" className="text-xs">
                              {resource.id}
                            </Badge>
                          </div>
                          {resource.url && (
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {resource.url}
                            </p>
                          )}
                        </div>
                        {resource.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Posted resources will be stored in the connected FHIR server
            and can be viewed in the Medplum console. Resource IDs are generated by the server.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

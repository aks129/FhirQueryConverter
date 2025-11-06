/**
 * ViewManagement Component
 *
 * Manages SQL on FHIR ViewDefinitions - the final step in the workflow
 */

import { useState } from 'react';
import { MedplumClient } from '@medplum/core';
import { Bundle } from '@medplum/fhirtypes';
import {
  Eye,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  FileJson,
  PartyPopper,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, ViewDefinition } from '@/store/app-store';

export function ViewManagement() {
  const {
    fhirServer,
    viewDefinitions,
    addViewDefinition,
    removeViewDefinition,
    markStepComplete,
    workflow,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedView, setSelectedView] = useState<ViewDefinition | null>(null);

  const [newView, setNewView] = useState({
    name: '',
    resource: 'Patient',
    description: '',
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // Check if workflow is complete
  const isWorkflowComplete = workflow.completedSteps.size >= 7;

  // ============================================================================
  // Browse ViewDefinitions from FHIR Server
  // ============================================================================

  const handleBrowseViews = async () => {
    if (!fhirServer.isConnected) {
      setStatus({
        type: 'error',
        message: 'Please connect to FHIR server first (Step 1)',
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const client = new MedplumClient({
        baseUrl: fhirServer.baseUrl,
      });

      if (fhirServer.accessToken) {
        client.setAccessToken(fhirServer.accessToken);
      }

      // Search for ViewDefinition resources
      // Note: ViewDefinition may not be in standard FHIR R4, using type assertion
      const bundle: Bundle = await client.search('ViewDefinition' as any, {
        _count: '50',
      });

      const count = bundle.entry?.length || 0;

      if (count === 0) {
        setStatus({
          type: 'error',
          message: 'No ViewDefinitions found on FHIR server',
        });
      } else {
        // Add views to store if not already present
        let addedCount = 0;
        bundle.entry?.forEach((entry) => {
          const view = entry.resource as any;
          if (view && !viewDefinitions.find((v) => v.id === view.id)) {
            addViewDefinition(view);
            addedCount++;
          }
        });

        setStatus({
          type: 'success',
          message: `Found ${count} ViewDefinitions, added ${addedCount} new ones`,
        });
      }
    } catch (error) {
      console.error('Failed to browse views:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to browse ViewDefinitions',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Create ViewDefinition
  // ============================================================================

  const handleCreateView = () => {
    if (!newView.name || !newView.resource) {
      setStatus({
        type: 'error',
        message: 'Please provide a name and resource type',
      });
      return;
    }

    // Create a simple ViewDefinition
    const viewDef: ViewDefinition = {
      resourceType: 'ViewDefinition',
      id: `view-${Date.now()}`,
      url: `http://example.org/fhir/ViewDefinition/${newView.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: newView.name,
      status: 'active',
      resource: newView.resource,
      select: [
        {
          column: [
            { path: 'id', name: `${newView.resource.toLowerCase()}_id` },
          ],
        },
      ],
    };

    addViewDefinition(viewDef);
    markStepComplete('view-management');

    setStatus({
      type: 'success',
      message: `Created ViewDefinition: ${newView.name}`,
    });

    // Reset form
    setNewView({ name: '', resource: 'Patient', description: '' });
    setShowCreateForm(false);
  };

  // ============================================================================
  // Delete ViewDefinition
  // ============================================================================

  const handleDeleteView = (id: string) => {
    removeViewDefinition(id);
    setStatus({
      type: 'success',
      message: 'ViewDefinition deleted',
    });
    if (selectedView?.id === id) {
      setSelectedView(null);
    }
  };

  // ============================================================================
  // Export ViewDefinition
  // ============================================================================

  const handleExportView = (view: ViewDefinition) => {
    const json = JSON.stringify(view, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view.name || 'view'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus({
      type: 'success',
      message: 'ViewDefinition exported',
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Manage View Definitions
        </CardTitle>
        <CardDescription>
          Create and manage SQL on FHIR view definitions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Completion Banner */}
        {isWorkflowComplete && (
          <Alert className="border-green-200 bg-green-50">
            <PartyPopper className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Congratulations!</strong> You've completed the entire FHIR Query Converter
              workflow. All 8 steps are done!
            </AlertDescription>
          </Alert>
        )}

        {/* Status Messages */}
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

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">View Definitions</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="browse">Browse FHIR</TabsTrigger>
          </TabsList>

          {/* View Definitions List */}
          <TabsContent value="list" className="space-y-4">
            {viewDefinitions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No ViewDefinitions created yet. Use the "Create New" tab to create your first
                  view definition, or browse existing ones from the FHIR server.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    ViewDefinitions ({viewDefinitions.length})
                  </h3>
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {viewDefinitions.map((view) => (
                      <div
                        key={view.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          selectedView?.id === view.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-4 w-4 text-primary" />
                              <p className="font-medium">{view.name}</p>
                              <Badge variant={view.status === 'active' ? 'default' : 'outline'}>
                                {view.status}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex gap-2">
                                <span className="text-muted-foreground">Resource:</span>
                                <span className="font-medium">{view.resource}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-muted-foreground">Columns:</span>
                                <span className="font-medium">
                                  {view.select?.[0]?.column?.length || 0}
                                </span>
                              </div>
                              {view.url && (
                                <div className="text-xs text-muted-foreground font-mono break-all">
                                  {view.url}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedView(view)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportView(view)}
                              title="Export JSON"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteView(view.id!)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Selected View Details */}
                {selectedView && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">View Definition JSON</h4>
                    <ScrollArea className="h-[200px] rounded-md border bg-muted/30">
                      <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedView, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Create New ViewDefinition */}
          <TabsContent value="create" className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start gap-3 mb-4">
                <Plus className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Create ViewDefinition</h3>
                  <p className="text-sm text-muted-foreground">
                    Define a SQL on FHIR view to flatten FHIR resources into relational tables
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="viewName">View Name</Label>
                <Input
                  id="viewName"
                  placeholder="PatientDemographics"
                  value={newView.name}
                  onChange={(e) => setNewView({ ...newView, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceType">FHIR Resource Type</Label>
                <select
                  id="resourceType"
                  className="w-full p-2 border rounded-md"
                  value={newView.resource}
                  onChange={(e) => setNewView({ ...newView, resource: e.target.value })}
                >
                  <option value="Patient">Patient</option>
                  <option value="Observation">Observation</option>
                  <option value="Condition">Condition</option>
                  <option value="Procedure">Procedure</option>
                  <option value="MedicationRequest">MedicationRequest</option>
                  <option value="Encounter">Encounter</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this view..."
                  value={newView.description}
                  onChange={(e) => setNewView({ ...newView, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateView} className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create ViewDefinition
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This creates a basic ViewDefinition with an ID column. In production, you would
                define specific columns using the select/column structure from SQL on FHIR spec.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Browse FHIR Server */}
          <TabsContent value="browse" className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start gap-3 mb-4">
                <Database className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Browse FHIR Server</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for existing ViewDefinition resources on the connected FHIR server
                  </p>
                </div>
              </div>
            </div>

            {!fhirServer.isConnected ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <XCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Not connected to FHIR server. Please complete Step 1 first.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={handleBrowseViews}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Browse ViewDefinitions
                  </>
                )}
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {/* Workflow Summary */}
        {isWorkflowComplete && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Workflow Complete
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'FHIR Server', step: 'fhir-connection' },
                { label: 'CQL Libraries', step: 'library-loading' },
                { label: 'Terminology', step: 'terminology-connection' },
                { label: 'CQL Execution', step: 'execution' },
                { label: 'SQL Translation', step: 'sql-translation' },
                { label: 'Database', step: 'database-connection' },
                { label: 'Write-Back', step: 'writeback' },
                { label: 'Views', step: 'view-management' },
              ].map(({ label, step }) => (
                <div
                  key={step}
                  className="p-3 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{label}</span>
                  </div>
                </div>
              ))}
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                All workflow steps are complete! You've successfully set up the FHIR Query
                Converter from FHIR connection through to view management. The application is
                ready for production use.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

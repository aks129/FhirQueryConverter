/**
 * LibraryManager Component
 *
 * Allows users to browse CQL libraries from Medplum FHIR server
 * and upload local .cql files
 */

import { useState, useCallback } from 'react';
import { MedplumClient } from '@medplum/core';
import { Library as FhirLibrary, Bundle } from '@medplum/fhirtypes';
import {
  FileCode,
  Upload,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Eye,
  Download,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, CqlLibrary } from '@/store/app-store';

export function LibraryManager() {
  const {
    fhirServer,
    libraries,
    selectedLibrary,
    addLibrary,
    removeLibrary,
    selectLibrary,
    markStepComplete,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // ============================================================================
  // FHIR Server Library Browsing
  // ============================================================================

  const handleBrowseFhirServer = async () => {
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

      // Set access token if available
      if (fhirServer.accessToken) {
        client.setAccessToken(fhirServer.accessToken);
      }

      // Search for Library resources
      const bundle: Bundle = await client.search('Library', {
        _count: '50',
        _sort: '-_lastUpdated',
      });

      if (!bundle.entry || bundle.entry.length === 0) {
        setStatus({
          type: 'error',
          message: 'No libraries found on FHIR server',
        });
        setIsLoading(false);
        return;
      }

      // Process libraries
      let loadedCount = 0;
      for (const entry of bundle.entry) {
        const fhirLibrary = entry.resource as FhirLibrary;
        if (fhirLibrary && fhirLibrary.content) {
          // Extract CQL content from Library resource
          const cqlContent = fhirLibrary.content.find(
            (c) => c.contentType === 'text/cql'
          );

          if (cqlContent && cqlContent.data) {
            // Decode base64 content
            const decodedContent = atob(cqlContent.data);

            const library: CqlLibrary = {
              id: fhirLibrary.id || `library-${Date.now()}-${loadedCount}`,
              name: fhirLibrary.name || 'Unnamed Library',
              version: fhirLibrary.version,
              content: decodedContent,
              url: fhirLibrary.url,
              status: (fhirLibrary.status as 'active' | 'draft' | 'retired') || 'active',
              metadata: {
                title: fhirLibrary.title,
                description: fhirLibrary.description,
              },
            };

            // Check if library already exists
            const exists = libraries.some((lib) => lib.id === library.id);
            if (!exists) {
              addLibrary(library);
              loadedCount++;
            }
          }
        }
      }

      setStatus({
        type: 'success',
        message: `Loaded ${loadedCount} CQL libraries from FHIR server`,
      });
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch libraries from FHIR server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Local File Upload
  // ============================================================================

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setStatus({ type: 'idle', message: '' });

      try {
        // Read file content
        const content = await file.text();

        // Basic validation
        if (!content.trim()) {
          throw new Error('File is empty');
        }

        // Extract library name from content or filename
        const nameMatch = content.match(/library\s+([A-Za-z0-9_]+)/);
        const libraryName =
          nameMatch?.[1] || file.name.replace('.cql', '').replace(/[^A-Za-z0-9_]/g, '');

        // Extract version if present
        const versionMatch = content.match(/version\s+['"]([^'"]+)['"]/);
        const version = versionMatch?.[1];

        const library: CqlLibrary = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: libraryName,
          version,
          content,
          status: 'draft',
          metadata: {
            title: libraryName,
            description: `Uploaded from ${file.name}`,
          },
        };

        // Check for duplicates by name
        const existingLibrary = libraries.find(
          (lib) => lib.name === library.name && lib.version === library.version
        );

        if (existingLibrary) {
          setStatus({
            type: 'error',
            message: `Library "${library.name}" version ${library.version || 'unspecified'} already exists`,
          });
          setIsLoading(false);
          return;
        }

        addLibrary(library);
        setStatus({
          type: 'success',
          message: `Successfully uploaded library "${library.name}"`,
        });
      } catch (error) {
        console.error('Failed to upload file:', error);
        setStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to upload file',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [libraries, addLibrary]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const cqlFile = files.find((f) => f.name.endsWith('.cql'));

      if (cqlFile) {
        handleFileUpload(cqlFile);
      } else {
        setStatus({
          type: 'error',
          message: 'Please upload a .cql file',
        });
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // ============================================================================
  // Library Actions
  // ============================================================================

  const handleSelectLibrary = (id: string) => {
    selectLibrary(id);
    setStatus({
      type: 'success',
      message: 'Library selected for execution',
    });
    // Mark step as complete when library is selected
    markStepComplete('library-loading');
  };

  const handleRemoveLibrary = (id: string) => {
    removeLibrary(id);
    setStatus({
      type: 'success',
      message: 'Library removed',
    });
  };

  const handlePreviewLibrary = (library: CqlLibrary) => {
    // For now, just select it to show preview
    selectLibrary(library.id);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Load CQL Libraries
        </CardTitle>
        <CardDescription>
          Browse libraries from FHIR server or upload local .cql files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="gap-2">
              <Database className="h-4 w-4" />
              Browse FHIR Server
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          {/* Browse FHIR Server Tab */}
          <TabsContent value="browse" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Search for CQL Library resources on the connected FHIR server
              </p>
              <Button
                onClick={handleBrowseFhirServer}
                disabled={isLoading || !fhirServer.isConnected}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Fetch Libraries
                  </>
                )}
              </Button>
            </div>

            {!fhirServer.isConnected && (
              <Alert>
                <AlertDescription>
                  Please connect to a FHIR server in Step 1 first
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drag & drop a .cql file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports Clinical Quality Language (.cql) files
              </p>
              <input
                id="file-input"
                type="file"
                accept=".cql"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Library List */}
        {libraries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Loaded Libraries ({libraries.length})
              </h3>
              {selectedLibrary && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedLibrary.name} selected
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-3">
                {libraries.map((library) => (
                  <div
                    key={library.id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      selectedLibrary?.id === library.id
                        ? 'border-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{library.name}</h4>
                          {library.version && (
                            <Badge variant="secondary" className="text-xs">
                              v{library.version}
                            </Badge>
                          )}
                          <Badge
                            variant={library.status === 'active' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {library.status}
                          </Badge>
                        </div>
                        {library.metadata?.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {library.metadata.description}
                          </p>
                        )}
                        {library.url && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {library.url}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewLibrary(library)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            selectedLibrary?.id === library.id ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => handleSelectLibrary(library.id)}
                        >
                          {selectedLibrary?.id === library.id ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Selected
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveLibrary(library.id)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Selected Library Preview */}
        {selectedLibrary && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">CQL Preview</h3>
            <ScrollArea className="h-[200px] rounded-md border bg-muted/30">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {selectedLibrary.content.substring(0, 500)}
                {selectedLibrary.content.length > 500 && '...'}
              </pre>
            </ScrollArea>
            <p className="text-xs text-muted-foreground text-right">
              {selectedLibrary.content.length} characters
            </p>
          </div>
        )}

        {/* Empty State */}
        {libraries.length === 0 && (
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">No libraries loaded yet</p>
            <p className="text-xs text-muted-foreground">
              Browse the FHIR server or upload a local .cql file to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

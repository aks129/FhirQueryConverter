/**
 * DatabaseConnect Component
 *
 * Allows connection to SQL databases for FHIR data analytics
 * Supports DuckDB (embedded) and Databricks (cloud)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  HardDrive,
  Cloud,
  Info,
  Table,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';

// Validation schemas
const databricksSchema = z.object({
  serverHostname: z.string().min(1, 'Server hostname is required'),
  httpPath: z.string().min(1, 'HTTP path is required'),
  token: z.string().min(1, 'Access token is required'),
});

type DatabricksForm = z.infer<typeof databricksSchema>;

export function DatabaseConnect() {
  const {
    database,
    connectToDatabase,
    disconnectDatabase,
    markStepComplete,
  } = useAppStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  const databricksForm = useForm<DatabricksForm>({
    resolver: zodResolver(databricksSchema),
    defaultValues: {
      serverHostname: '',
      httpPath: '',
      token: '',
    },
  });

  // ============================================================================
  // DuckDB Connection
  // ============================================================================

  const handleConnectDuckDB = async () => {
    setIsConnecting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // Simulate connection to embedded DuckDB
      // Note: In production, this would initialize DuckDB WASM
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For this demo, we're using SQL.js which is already integrated
      // DuckDB WASM would be initialized here in a production system
      connectToDatabase('duckdb', {
        dbPath: ':memory:',
      });

      setStatus({
        type: 'success',
        message: 'Connected to DuckDB embedded database (in-memory)',
      });

      markStepComplete('database-connection');
    } catch (error) {
      console.error('DuckDB connection failed:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to DuckDB',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // ============================================================================
  // Databricks Connection
  // ============================================================================

  const handleConnectDatabricks = async (data: DatabricksForm) => {
    setIsConnecting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // Test connection to Databricks
      // Note: This would make a real API call in production
      const response = await fetch(
        `https://${data.serverHostname}/api/2.0/sql/warehouses`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to connect to Databricks - check credentials');
      }

      connectToDatabase('databricks', {
        serverHostname: data.serverHostname,
        httpPath: data.httpPath,
        token: data.token,
      });

      setStatus({
        type: 'success',
        message: `Connected to Databricks at ${data.serverHostname}`,
      });

      markStepComplete('database-connection');
    } catch (error) {
      console.error('Databricks connection failed:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to Databricks',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // ============================================================================
  // Disconnect
  // ============================================================================

  const handleDisconnect = () => {
    disconnectDatabase();
    setStatus({ type: 'idle', message: '' });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Connect to Database
        </CardTitle>
        <CardDescription>
          Connect to DuckDB (embedded) or Databricks (cloud) for SQL execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {database.isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Connected to {database.type === 'duckdb' ? 'DuckDB (embedded)' : 'Databricks (cloud)'}
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

        {/* Database Selection */}
        {!database.isConnected ? (
          <Tabs defaultValue="duckdb" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="duckdb" className="gap-2">
                <HardDrive className="h-4 w-4" />
                DuckDB (Embedded)
              </TabsTrigger>
              <TabsTrigger value="databricks" className="gap-2">
                <Cloud className="h-4 w-4" />
                Databricks (Cloud)
              </TabsTrigger>
            </TabsList>

            {/* DuckDB Tab */}
            <TabsContent value="duckdb" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start gap-3">
                  <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">DuckDB Embedded Database</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Fast, in-process analytical database that runs entirely in the browser.
                      Perfect for local development and testing.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• No server required</li>
                      <li>• In-memory or file-based storage</li>
                      <li>• Full SQL support</li>
                      <li>• Fast analytics queries</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Note: For this demo, SQL.js is used for SQL execution (configured in Step 5).
                  DuckDB WASM can be added for production use with larger datasets.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnectDuckDB}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-5 w-5" />
                    Connect to DuckDB
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Databricks Tab */}
            <TabsContent value="databricks" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Databricks SQL Warehouse</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cloud-based data warehouse for large-scale FHIR analytics.
                      Connects to your Databricks workspace.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Scalable compute resources</li>
                      <li>• Delta Lake tables</li>
                      <li>• Enterprise security</li>
                      <li>• SQL endpoints via REST API</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={databricksForm.handleSubmit(handleConnectDatabricks)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serverHostname">Server Hostname</Label>
                  <Input
                    id="serverHostname"
                    placeholder="adb-1234567890123456.7.azuredatabricks.net"
                    {...databricksForm.register('serverHostname')}
                    disabled={isConnecting}
                  />
                  {databricksForm.formState.errors.serverHostname && (
                    <p className="text-sm text-red-600">
                      {databricksForm.formState.errors.serverHostname.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Find in Databricks workspace: Compute → SQL Warehouses → Connection Details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="httpPath">HTTP Path</Label>
                  <Input
                    id="httpPath"
                    placeholder="/sql/1.0/warehouses/abc123def456"
                    {...databricksForm.register('httpPath')}
                    disabled={isConnecting}
                  />
                  {databricksForm.formState.errors.httpPath && (
                    <p className="text-sm text-red-600">
                      {databricksForm.formState.errors.httpPath.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="dapi********************************"
                    {...databricksForm.register('token')}
                    disabled={isConnecting}
                  />
                  {databricksForm.formState.errors.token && (
                    <p className="text-sm text-red-600">
                      {databricksForm.formState.errors.token.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Generate in User Settings → Access Tokens
                  </p>
                </div>

                <Button type="submit" disabled={isConnecting} className="w-full" size="lg">
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-5 w-5" />
                      Connect to Databricks
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          // Connected State
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-3">
                {database.type === 'duckdb' ? (
                  <HardDrive className="h-5 w-5 text-primary" />
                ) : (
                  <Cloud className="h-5 w-5 text-primary" />
                )}
                <h3 className="font-medium">
                  {database.type === 'duckdb' ? 'DuckDB Embedded' : 'Databricks Cloud'}
                </h3>
                <Badge variant="default" className="ml-auto">Connected</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">
                    {database.type === 'duckdb' ? 'In-Memory (Embedded)' : 'Cloud Warehouse'}
                  </span>
                </div>
                {database.type === 'duckdb' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium">{database.config?.dbPath || 'memory'}</span>
                  </div>
                )}
                {database.type === 'databricks' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Server:</span>
                      <span className="font-medium font-mono text-xs">
                        {database.config?.serverHostname}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HTTP Path:</span>
                      <span className="font-medium font-mono text-xs">
                        {database.config?.httpPath}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* Available Tables */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Table className="h-4 w-4" />
                <h4 className="font-medium text-sm">Available Tables</h4>
              </div>
              <div className="space-y-2">
                {['Patient', 'Observation', 'Condition', 'Procedure', 'MedicationRequest', 'Encounter'].map(
                  (table) => (
                    <div key={table} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-sm font-mono">{table}</span>
                      <Badge variant="outline" className="text-xs">Table</Badge>
                    </div>
                  )
                )}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Database is ready for SQL query execution. Generated SQL from Step 5 can be
                executed against these tables.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isConnecting}
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}

        {/* Additional Info */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> SQL execution in this workflow uses the database configured
            here for running generated SQL on FHIR queries against flattened FHIR data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

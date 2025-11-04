/**
 * FhirServerConnect Component
 *
 * Handles authentication and connection to Medplum FHIR server
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MedplumClient } from '@medplum/core';
import { Loader2, Server, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';

// Validation schema
const fhirConnectionSchema = z.object({
  baseUrl: z.string().url('Must be a valid URL').default('https://api.medplum.com'),
  projectId: z.string().min(1, 'Project ID is required').default('ad4dd83d-398c-4356-899f-c875901ceb0a'),
  email: z.string().email('Must be a valid email').default('gene@fhiriq.com'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FhirConnectionForm = z.infer<typeof fhirConnectionSchema>;

export function FhirServerConnect() {
  const {
    fhirServer,
    connectToFhirServer,
    disconnectFhirServer,
    setFhirAccessToken,
  } = useAppStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FhirConnectionForm>({
    resolver: zodResolver(fhirConnectionSchema),
    defaultValues: {
      baseUrl: fhirServer.baseUrl || 'https://api.medplum.com',
      projectId: fhirServer.projectId || 'ad4dd83d-398c-4356-899f-c875901ceb0a',
      email: 'gene@fhiriq.com',
      password: '',
    },
  });

  const onSubmit = async (data: FhirConnectionForm) => {
    setIsConnecting(true);
    setConnectionStatus({ type: 'idle', message: '' });

    try {
      // Initialize Medplum client
      const client = new MedplumClient({
        baseUrl: data.baseUrl,
      });

      // Authenticate using email/password
      const loginResponse = await client.startLogin({
        email: data.email,
        password: data.password,
        projectId: data.projectId,
      });

      // Complete login flow
      const profile = await client.processCode(loginResponse.code || '');

      // Store connection details
      connectToFhirServer(data.baseUrl, data.projectId);
      setFhirAccessToken(client.getAccessToken() || '', {
        email: data.email,
        name: profile.resourceType === 'Patient' ? profile.name?.[0]?.text : undefined,
      });

      setConnectionStatus({
        type: 'success',
        message: `Connected successfully! User: ${data.email}`,
      });
    } catch (error) {
      console.error('FHIR connection error:', error);
      setConnectionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to FHIR server',
      });
      disconnectFhirServer();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFhirServer();
    setConnectionStatus({ type: 'idle', message: '' });
  };

  const handleTestConnection = async () => {
    if (!fhirServer.isConnected) {
      setConnectionStatus({
        type: 'error',
        message: 'Please connect first',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const client = new MedplumClient({
        baseUrl: fhirServer.baseUrl,
      });

      // Test with a simple metadata query
      await client.get('metadata');

      setConnectionStatus({
        type: 'success',
        message: 'Connection test successful!',
      });
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus({
        type: 'error',
        message: 'Connection test failed',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Connect to FHIR Server
        </CardTitle>
        <CardDescription>
          Connect to Medplum FHIR server to load libraries and execute queries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {fhirServer.isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Connected to {fhirServer.baseUrl}
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus.type !== 'idle' && (
          <Alert
            className={
              connectionStatus.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            {connectionStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                connectionStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }
            >
              {connectionStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Form */}
        {!fhirServer.isConnected ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="baseUrl">FHIR Server URL</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://api.medplum.com"
                {...register('baseUrl')}
                disabled={isConnecting}
              />
              {errors.baseUrl && (
                <p className="text-sm text-red-600">{errors.baseUrl.message}</p>
              )}
            </div>

            {/* Project ID */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                placeholder="ad4dd83d-398c-4356-899f-c875901ceb0a"
                {...register('projectId')}
                disabled={isConnecting}
              />
              {errors.projectId && (
                <p className="text-sm text-red-600">{errors.projectId.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="gene@fhiriq.com"
                {...register('email')}
                disabled={isConnecting}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                disabled={isConnecting}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Connect Button */}
            <Button type="submit" className="w-full" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Medplum'
              )}
            </Button>
          </form>
        ) : (
          // Connected Actions
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Server:</span>
                <span className="font-medium">{fhirServer.baseUrl}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project ID:</span>
                <span className="font-mono text-xs">{fhirServer.projectId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Your credentials are used only for authentication and are not
            stored. The access token is kept in memory for the duration of your session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

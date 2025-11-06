/**
 * TerminologyConnect Component
 *
 * Handles connection to FHIR terminology servers and value set expansion
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Database,
  Download,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTerminologyServer } from '@/hooks/useTerminologyServer';
import { useAppStore } from '@/store/app-store';

// Validation schema
const terminologyConnectionSchema = z.object({
  baseUrl: z
    .string()
    .url('Must be a valid URL')
    .default('https://tx.fhir.org/r4'),
});

const valueSetExpandSchema = z.object({
  url: z.string().url('Must be a valid canonical URL'),
  filter: z.string().optional(),
  count: z.number().min(1).max(1000).optional(),
});

type TerminologyConnectionForm = z.infer<typeof terminologyConnectionSchema>;
type ValueSetExpandForm = z.infer<typeof valueSetExpandSchema>;

// Common value set URLs for quick testing
const COMMON_VALUE_SETS = [
  {
    url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
    name: 'Administrative Gender',
    description: 'Gender codes for administrative purposes',
  },
  {
    url: 'http://hl7.org/fhir/ValueSet/marital-status',
    name: 'Marital Status',
    description: 'Marital status codes',
  },
  {
    url: 'http://hl7.org/fhir/ValueSet/observation-status',
    name: 'Observation Status',
    description: 'Codes identifying the lifecycle stage of an observation',
  },
  {
    url: 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001',
    name: 'Diabetes',
    description: 'Diabetes diagnosis codes',
  },
];

export function TerminologyConnect() {
  const {
    isConnected,
    baseUrl,
    expandedValueSets,
    isLoading,
    error,
    connect,
    disconnect,
    expandValueSet,
    clearCache,
  } = useTerminologyServer();

  const { markStepComplete } = useAppStore();

  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  const [expandStatus, setExpandStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  const [selectedValueSetUrl, setSelectedValueSetUrl] = useState<string | null>(null);

  // Connection form
  const connectionForm = useForm<TerminologyConnectionForm>({
    resolver: zodResolver(terminologyConnectionSchema),
    defaultValues: {
      baseUrl: baseUrl || 'https://tx.fhir.org/r4',
    },
  });

  // Expand form
  const expandForm = useForm<ValueSetExpandForm>({
    resolver: zodResolver(valueSetExpandSchema),
    defaultValues: {
      url: '',
      filter: '',
      count: 100,
    },
  });

  // ============================================================================
  // Connection Handlers
  // ============================================================================

  const handleConnect = async (data: TerminologyConnectionForm) => {
    setConnectionStatus({ type: 'idle', message: '' });

    const success = await connect(data.baseUrl);

    if (success) {
      setConnectionStatus({
        type: 'success',
        message: `Connected to ${data.baseUrl}`,
      });
      markStepComplete('terminology-connection');
    } else {
      setConnectionStatus({
        type: 'error',
        message: error || 'Failed to connect to terminology server',
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectionStatus({ type: 'idle', message: '' });
    setExpandStatus({ type: 'idle', message: '' });
  };

  // ============================================================================
  // Value Set Expansion Handlers
  // ============================================================================

  const handleExpandValueSet = async (data: ValueSetExpandForm) => {
    setExpandStatus({ type: 'idle', message: '' });

    const result = await expandValueSet({
      url: data.url,
      filter: data.filter,
      count: data.count,
    });

    if (result) {
      setExpandStatus({
        type: 'success',
        message: `Expanded ${result.count} codes from value set`,
      });
      setSelectedValueSetUrl(data.url);
      expandForm.reset();
    } else {
      setExpandStatus({
        type: 'error',
        message: error || 'Failed to expand value set',
      });
    }
  };

  const handleExpandCommonValueSet = async (url: string) => {
    setExpandStatus({ type: 'idle', message: '' });

    const result = await expandValueSet({ url, count: 100 });

    if (result) {
      setExpandStatus({
        type: 'success',
        message: `Expanded ${result.count} codes`,
      });
      setSelectedValueSetUrl(url);
    } else {
      setExpandStatus({
        type: 'error',
        message: error || 'Failed to expand value set',
      });
    }
  };

  const handleViewExpansion = (url: string) => {
    setSelectedValueSetUrl(url);
  };

  const handleClearCache = async () => {
    await clearCache();
    setExpandStatus({
      type: 'success',
      message: 'Cache cleared successfully',
    });
  };

  // Get selected expansion for preview
  const selectedExpansion = selectedValueSetUrl
    ? expandedValueSets.get(selectedValueSetUrl)
    : null;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Connect to Terminology Server
        </CardTitle>
        <CardDescription>
          Connect to TX.FHIR.ORG or custom terminology server for value set expansion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Connected to {baseUrl}
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
        {!isConnected ? (
          <form onSubmit={connectionForm.handleSubmit(handleConnect)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Terminology Server URL</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://tx.fhir.org/r4"
                {...connectionForm.register('baseUrl')}
                disabled={isLoading}
              />
              {connectionForm.formState.errors.baseUrl && (
                <p className="text-sm text-red-600">
                  {connectionForm.formState.errors.baseUrl.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Default: TX.FHIR.ORG (public terminology server)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Connect to Server
                </>
              )}
            </Button>
          </form>
        ) : (
          // Connected Actions
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Server:</span>
                <span className="font-medium">{baseUrl}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expanded Value Sets:</span>
                <span className="font-medium">{expandedValueSets.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearCache}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Cache
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Value Set Expansion Section */}
        {isConnected && (
          <>
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-4">Expand Value Sets</h3>

              {expandStatus.type !== 'idle' && (
                <Alert
                  className={
                    expandStatus.type === 'success'
                      ? 'border-green-200 bg-green-50 mb-4'
                      : 'border-red-200 bg-red-50 mb-4'
                  }
                >
                  {expandStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription
                    className={
                      expandStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }
                  >
                    {expandStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="quick" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quick">Quick Expand</TabsTrigger>
                  <TabsTrigger value="custom">Custom URL</TabsTrigger>
                </TabsList>

                {/* Quick Expand Tab */}
                <TabsContent value="quick" className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Common value sets for testing
                  </p>
                  {COMMON_VALUE_SETS.map((vs) => (
                    <div
                      key={vs.url}
                      className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{vs.name}</p>
                        <p className="text-xs text-muted-foreground">{vs.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExpandCommonValueSet(vs.url)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Expand
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                {/* Custom URL Tab */}
                <TabsContent value="custom">
                  <form
                    onSubmit={expandForm.handleSubmit(handleExpandValueSet)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="valueSetUrl">Value Set Canonical URL</Label>
                      <Input
                        id="valueSetUrl"
                        type="url"
                        placeholder="http://hl7.org/fhir/ValueSet/..."
                        {...expandForm.register('url')}
                        disabled={isLoading}
                      />
                      {expandForm.formState.errors.url && (
                        <p className="text-sm text-red-600">
                          {expandForm.formState.errors.url.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="filter">Filter (optional)</Label>
                        <Input
                          id="filter"
                          placeholder="Filter codes..."
                          {...expandForm.register('filter')}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="count">Max Count</Label>
                        <Input
                          id="count"
                          type="number"
                          defaultValue={100}
                          {...expandForm.register('count', { valueAsNumber: true })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Expanding...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Expand Value Set
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>

            {/* Expanded Value Sets List */}
            {expandedValueSets.size > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    Expanded Value Sets ({expandedValueSets.size})
                  </h3>
                </div>

                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {Array.from(expandedValueSets.entries()).map(([url, expansion]) => (
                      <div
                        key={url}
                        className={`p-3 border rounded-lg flex items-center justify-between ${
                          selectedValueSetUrl === url ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{url}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {expansion.count} codes
                            </Badge>
                            {expansion.version && (
                              <Badge variant="outline" className="text-xs">
                                v{expansion.version}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewExpansion(url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Selected Expansion Preview */}
            {selectedExpansion && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3">
                  Expansion Preview ({selectedExpansion.count} codes)
                </h3>
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr>
                          <th className="text-left p-2 font-medium">Code</th>
                          <th className="text-left p-2 font-medium">System</th>
                          <th className="text-left p-2 font-medium">Display</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExpansion.contains.slice(0, 100).map((code, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-mono text-xs">{code.code}</td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {code.system}
                            </td>
                            <td className="p-2">{code.display || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedExpansion.count > 100 && (
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Showing first 100 of {selectedExpansion.count} codes
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

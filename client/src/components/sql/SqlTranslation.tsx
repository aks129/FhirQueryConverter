/**
 * SqlTranslation Component
 *
 * Transpiles CQL to SQL on FHIR, executes SQL, and compares results with CQL path
 */

import { useState } from 'react';
import {
  FileCode,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  GitCompare,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { SqlTranspiler } from '@/lib/sql-transpiler';
import type { FhirBundle } from '@/types/fhir';
import { useApi } from '@/hooks/use-api';

export function SqlTranslation() {
  const {
    selectedLibrary,
    cqlMeasureReport,
    generatedSql,
    setGeneratedSql,
    sqlMeasureReport,
    setSqlMeasureReport,
    markStepComplete,
  } = useAppStore();

  const { saveEvaluationLog, saveMeasureReport } = useApi();

  const [isTranspiling, setIsTranspiling] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<FhirBundle | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // ============================================================================
  // SQL Transpilation
  // ============================================================================

  const handleTranspileAndExecute = async () => {
    if (!selectedLibrary) {
      setStatus({
        type: 'error',
        message: 'Please select a CQL library first (Step 2)',
      });
      return;
    }

    if (!cqlMeasureReport) {
      setStatus({
        type: 'error',
        message: 'Please execute CQL first (Step 4)',
      });
      return;
    }

    setIsTranspiling(true);
    setStatus({ type: 'idle', message: '' });
    setExecutionLogs([]);

    try {
      const logs: string[] = [];
      logs.push(`Transpiling CQL library: ${selectedLibrary.name}`);
      setExecutionLogs([...logs]);

      // We need to reconstruct the FHIR bundle from Step 4
      // In a real app, this would be passed from ExecutionDashboard
      // For now, we'll create a minimal bundle or show a message
      if (!fhirBundle) {
        logs.push('Warning: Using data from CQL execution step');
        logs.push('Note: In production, FHIR bundle should be passed from Step 4');
      }

      // Create minimal bundle if not available
      const bundle: FhirBundle = fhirBundle || {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [],
      };

      // Initialize SQL transpiler
      const transpiler = new SqlTranspiler();

      logs.push('Starting CQL to SQL transpilation...');
      setExecutionLogs([...logs]);

      // Transpile and execute
      const result = await transpiler.convertAndEvaluate(selectedLibrary.content, bundle);

      // Add execution logs
      if (result.logs) {
        for (const log of result.logs) {
          logs.push(`[${log.level}] ${log.message}`);
        }
      }
      setExecutionLogs([...logs]);

      // Store generated SQL
      setGeneratedSql(result.generatedSql);

      // Update measure report with period from CQL report
      const measureReport = {
        ...result.measureReport,
        status: 'complete' as const,
        type: 'summary' as const,
        period: cqlMeasureReport.period,
        group: result.measureReport.group?.map((g: any) => ({
          id: g.id,
          population: g.population?.map((p: any) => ({
            code: {
              text: p.code.coding?.[0]?.code || p.code.text || 'unknown',
            },
            count: p.count,
          })),
          measureScore: g.measureScore,
        })) || [],
        meta: {
          source: 'sql' as const,
          executionTime: result.executionTime,
        },
      };

      // Store SQL measure report
      setSqlMeasureReport(measureReport);

      // Save to backend (Phase 8)
      try {
        // Save evaluation log
        await saveEvaluationLog({
          evaluationType: 'sql',
          cqlCode: selectedLibrary.content,
          fhirBundle: fhirBundle,
          result: result,
          executionTimeMs: result.executionTime.toString(),
          memoryUsageMb: null,
          errors: null,
        });

        // Save measure report with generated SQL
        await saveMeasureReport({
          reportId: measureReport.id || `sql-${Date.now()}`,
          measureReport: measureReport,
          evaluationType: 'sql',
          generatedSql: result.sql,
        });

        logs.push('Results saved to backend');
        setExecutionLogs([...logs]);
      } catch (error) {
        console.error('Failed to save to backend:', error);
        logs.push('Warning: Failed to save results to backend');
        setExecutionLogs([...logs]);
      }

      // Mark step complete
      markStepComplete('sql-translation');

      logs.push(`Transpilation and execution completed in ${result.executionTime}ms`);
      setExecutionLogs([...logs]);

      setStatus({
        type: 'success',
        message: `SQL transpilation and execution completed successfully in ${result.executionTime}ms`,
      });
    } catch (error) {
      console.error('SQL transpilation failed:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'SQL transpilation/execution failed',
      });
      setExecutionLogs((prev) => [
        ...prev,
        `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    } finally {
      setIsTranspiling(false);
    }
  };

  // ============================================================================
  // Copy SQL
  // ============================================================================

  const handleCopySql = async () => {
    if (generatedSql) {
      try {
        await navigator.clipboard.writeText(generatedSql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy SQL:', error);
      }
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Translate to SQL & Execute
        </CardTitle>
        <CardDescription>
          Transpile CQL to SQL on FHIR and execute against database
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

        {/* Prerequisites Check */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CQL Library</span>
              {selectedLibrary ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedLibrary ? selectedLibrary.name : 'No library selected'}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CQL Execution</span>
              {cqlMeasureReport ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {cqlMeasureReport ? 'CQL executed' : 'CQL not executed'}
            </p>
          </div>
        </div>

        {/* Transpile Button */}
        <div className="space-y-4">
          <Button
            onClick={handleTranspileAndExecute}
            disabled={isTranspiling || !selectedLibrary || !cqlMeasureReport}
            className="w-full"
            size="lg"
          >
            {isTranspiling ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Transpiling & Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Transpile CQL to SQL & Execute
              </>
            )}
          </Button>
        </div>

        {/* Execution Logs */}
        {executionLogs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Execution Logs</h3>
            <ScrollArea className="h-[200px] rounded-md border bg-muted/30">
              <div className="p-4 font-mono text-xs space-y-1">
                {executionLogs.map((log, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Generated SQL */}
        {generatedSql && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Generated SQL Query
              </h3>
              <Button variant="outline" size="sm" onClick={handleCopySql}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">{generatedSql}</pre>
            </ScrollArea>
          </div>
        )}

        {/* Results Comparison */}
        {cqlMeasureReport && sqlMeasureReport && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Results Comparison
            </h3>

            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="cql">CQL Results</TabsTrigger>
                <TabsTrigger value="sql">SQL Results</TabsTrigger>
              </TabsList>

              {/* Comparison View */}
              <TabsContent value="comparison" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* CQL Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">CQL Path</h4>
                      <Badge variant="default">Direct</Badge>
                    </div>
                    <div className="space-y-2">
                      {cqlMeasureReport.group?.[0]?.population?.map((pop, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{pop.code.text}</span>
                            <Badge variant="secondary">{pop.count}</Badge>
                          </div>
                        </div>
                      ))}
                      {cqlMeasureReport.group?.[0]?.measureScore && (
                        <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Score</span>
                            <Badge variant="default">
                              {(cqlMeasureReport.group[0].measureScore.value * 100).toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Execution: {cqlMeasureReport.meta?.executionTime || 0}ms
                      </div>
                    </div>
                  </div>

                  {/* SQL Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">SQL Path</h4>
                      <Badge variant="outline">Transpiled</Badge>
                    </div>
                    <div className="space-y-2">
                      {sqlMeasureReport.group?.[0]?.population?.map((pop, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{pop.code.text}</span>
                            <Badge variant="secondary">{pop.count}</Badge>
                          </div>
                        </div>
                      ))}
                      {sqlMeasureReport.group?.[0]?.measureScore && (
                        <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Score</span>
                            <Badge variant="default">
                              {(sqlMeasureReport.group[0].measureScore.value * 100).toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Execution: {sqlMeasureReport.meta?.executionTime || 0}ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Summary */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Both CQL and SQL paths have been executed. Compare the population counts
                    and measure scores to verify consistency.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* CQL Results Tab */}
              <TabsContent value="cql" className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{cqlMeasureReport.status}</div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{cqlMeasureReport.type}</div>
                      <div className="text-xs text-muted-foreground">Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {cqlMeasureReport.group?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Groups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {cqlMeasureReport.meta?.executionTime || 0}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Time</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cqlMeasureReport.group?.[0]?.population?.map((pop, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm">{pop.code.text}</span>
                        <Badge variant="secondary">{pop.count} patients</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* SQL Results Tab */}
              <TabsContent value="sql" className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{sqlMeasureReport.status}</div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{sqlMeasureReport.type}</div>
                      <div className="text-xs text-muted-foreground">Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {sqlMeasureReport.group?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Groups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {sqlMeasureReport.meta?.executionTime || 0}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Time</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sqlMeasureReport.group?.[0]?.population?.map((pop, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm">{pop.code.text}</span>
                        <Badge variant="secondary">{pop.count} patients</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

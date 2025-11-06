/**
 * ExecutionDashboard Component
 *
 * Executes CQL libraries against FHIR data and generates MeasureReports
 */

import { useState, useCallback } from 'react';
import { MedplumClient } from '@medplum/core';
import { Bundle } from '@medplum/fhirtypes';
import {
  Play,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app-store';
import { CqlEngine } from '@/lib/cql-engine';
import type { FhirBundle } from '@/types/fhir';
import { useApi } from '@/hooks/use-api';

export function ExecutionDashboard() {
  const {
    fhirServer,
    selectedLibrary,
    measurementPeriod,
    setMeasurementPeriod,
    cqlMeasureReport,
    setCqlMeasureReport,
    markStepComplete,
  } = useAppStore();

  const { saveEvaluationLog, saveMeasureReport } = useApi();

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [fhirBundle, setFhirBundle] = useState<FhirBundle | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // ============================================================================
  // Patient Loading
  // ============================================================================

  const handleLoadPatients = async () => {
    if (!fhirServer.isConnected) {
      setStatus({
        type: 'error',
        message: 'Please connect to FHIR server first (Step 1)',
      });
      return;
    }

    setIsLoadingPatients(true);
    setStatus({ type: 'idle', message: '' });
    setExecutionLogs([]);

    try {
      const client = new MedplumClient({
        baseUrl: fhirServer.baseUrl,
      });

      if (fhirServer.accessToken) {
        client.setAccessToken(fhirServer.accessToken);
      }

      const logs: string[] = [];
      logs.push('Fetching patients from FHIR server...');
      setExecutionLogs([...logs]);

      // Search for patients
      const patientBundle: Bundle = await client.search('Patient', {
        _count: '100',
        _sort: '-_lastUpdated',
      });

      const patientCount = patientBundle.entry?.length || 0;
      logs.push(`Loaded ${patientCount} patients`);

      if (patientCount === 0) {
        throw new Error('No patients found on FHIR server');
      }

      // Fetch related resources for each patient
      logs.push('Fetching related resources (Conditions, Observations, Medications)...');
      setExecutionLogs([...logs]);

      const allEntries: any[] = patientBundle.entry || [];

      // Fetch Conditions
      const conditionsBundle: Bundle = await client.search('Condition', {
        _count: '500',
      });
      if (conditionsBundle.entry) {
        allEntries.push(...conditionsBundle.entry);
        logs.push(`Loaded ${conditionsBundle.entry.length} conditions`);
      }

      // Fetch Observations
      const observationsBundle: Bundle = await client.search('Observation', {
        _count: '500',
      });
      if (observationsBundle.entry) {
        allEntries.push(...observationsBundle.entry);
        logs.push(`Loaded ${observationsBundle.entry.length} observations`);
      }

      // Create FHIR Bundle
      const bundle: FhirBundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: allEntries.map((e) => ({ resource: e.resource })),
      };

      setFhirBundle(bundle);
      setPatientCount(patientCount);
      logs.push(`Total resources: ${bundle.entry?.length || 0}`);
      setExecutionLogs([...logs]);

      setStatus({
        type: 'success',
        message: `Loaded ${patientCount} patients with ${bundle.entry?.length || 0} total resources`,
      });
    } catch (error) {
      console.error('Failed to load patients:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load patients from FHIR server',
      });
      setExecutionLogs((prev) => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // ============================================================================
  // CQL Execution
  // ============================================================================

  const handleExecuteCql = async () => {
    if (!selectedLibrary) {
      setStatus({
        type: 'error',
        message: 'Please select a CQL library first (Step 2)',
      });
      return;
    }

    if (!fhirBundle) {
      setStatus({
        type: 'error',
        message: 'Please load patients first',
      });
      return;
    }

    setIsExecuting(true);
    setStatus({ type: 'idle', message: '' });
    setExecutionLogs([]);

    try {
      const logs: string[] = [];
      logs.push(`Executing CQL library: ${selectedLibrary.name}`);
      logs.push(`Measurement period: ${measurementPeriod.start} to ${measurementPeriod.end}`);
      logs.push(`Patient count: ${patientCount}`);
      logs.push(`Total resources: ${fhirBundle.entry?.length || 0}`);
      setExecutionLogs([...logs]);

      // Initialize CQL engine
      const engine = new CqlEngine();

      // Execute CQL
      logs.push('Executing CQL defines...');
      setExecutionLogs([...logs]);

      const result = await engine.evaluateCql(selectedLibrary.content, fhirBundle);

      // Add execution logs
      if (result.logs) {
        for (const log of result.logs) {
          logs.push(`[${log.level}] ${log.message}`);
        }
      }
      setExecutionLogs([...logs]);

      // Update measure report with period
      const measureReport = {
        ...result.measureReport,
        status: 'complete' as const,
        type: 'summary' as const,
        period: {
          start: measurementPeriod.start,
          end: measurementPeriod.end,
        },
        group: result.measureReport.group?.map((g: any) => ({
          id: g.id,
          population: g.population?.map((p: any) => ({
            code: {
              text: p.code.coding?.[0]?.code || 'unknown',
            },
            count: p.count,
          })),
        })) || [],
        meta: {
          source: 'cql' as const,
          executionTime: result.executionTime,
        },
      };

      // Store in Zustand
      setCqlMeasureReport(measureReport);

      // Save to backend (Phase 8)
      try {
        // Save evaluation log
        await saveEvaluationLog({
          evaluationType: 'cql',
          cqlCode: selectedLibrary.content,
          fhirBundle: fhirBundle,
          result: result,
          executionTimeMs: result.executionTime.toString(),
          memoryUsageMb: result.memoryUsage?.toString(),
          errors: null,
        });

        // Save measure report
        await saveMeasureReport({
          reportId: measureReport.id || `cql-${Date.now()}`,
          measureReport: measureReport,
          evaluationType: 'cql',
          generatedSql: null,
        });

        logs.push('Results saved to backend');
        setExecutionLogs([...logs]);
      } catch (error) {
        console.error('Failed to save to backend:', error);
        logs.push('Warning: Failed to save results to backend');
        setExecutionLogs([...logs]);
      }

      // Mark step complete
      markStepComplete('execution');

      logs.push(`Execution completed in ${result.executionTime}ms`);
      setExecutionLogs([...logs]);

      setStatus({
        type: 'success',
        message: `CQL execution completed successfully in ${result.executionTime}ms`,
      });
    } catch (error) {
      console.error('CQL execution failed:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'CQL execution failed',
      });
      setExecutionLogs((prev) => [
        ...prev,
        `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Execute CQL & Generate Measure Reports
        </CardTitle>
        <CardDescription>
          Run CQL queries against FHIR data and generate measure reports
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">FHIR Server</span>
              {fhirServer.isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {fhirServer.isConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>

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
              <span className="text-sm font-medium">Patient Data</span>
              {fhirBundle ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {fhirBundle ? `${patientCount} patients loaded` : 'No data loaded'}
            </p>
          </div>
        </div>

        {/* Measurement Period */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Measurement Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Start Date</Label>
              <Input
                id="periodStart"
                type="date"
                value={measurementPeriod.start.split('T')[0]}
                onChange={(e) =>
                  setMeasurementPeriod({
                    ...measurementPeriod,
                    start: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">End Date</Label>
              <Input
                id="periodEnd"
                type="date"
                value={measurementPeriod.end.split('T')[0]}
                onChange={(e) =>
                  setMeasurementPeriod({
                    ...measurementPeriod,
                    end: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Patient Loading */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Patient Cohort
          </h3>
          <Button
            onClick={handleLoadPatients}
            disabled={isLoadingPatients || !fhirServer.isConnected}
            className="w-full"
          >
            {isLoadingPatients ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Patients...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Load Patients from FHIR Server
              </>
            )}
          </Button>
        </div>

        {/* CQL Execution */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Play className="h-4 w-4" />
            Execute CQL
          </h3>
          <Button
            onClick={handleExecuteCql}
            disabled={isExecuting || !selectedLibrary || !fhirBundle}
            className="w-full"
            size="lg"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Executing CQL...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Execute CQL Library
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

        {/* MeasureReport Results */}
        {cqlMeasureReport && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Measure Report
              </h3>
              <Badge variant="default">CQL Path</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{cqlMeasureReport.status}</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{cqlMeasureReport.type}</div>
                <div className="text-xs text-muted-foreground">Type</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">
                  {cqlMeasureReport.group?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Groups</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">
                  {cqlMeasureReport.meta?.executionTime || 0}ms
                </div>
                <div className="text-xs text-muted-foreground">Execution Time</div>
              </div>
            </div>

            {/* Population Counts */}
            {cqlMeasureReport.group && cqlMeasureReport.group.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Population Counts</h4>
                {cqlMeasureReport.group.map((group, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    {group.id && (
                      <div className="font-medium mb-2">Group: {group.id}</div>
                    )}
                    <div className="space-y-2">
                      {group.population?.map((pop, popIdx) => (
                        <div
                          key={popIdx}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded"
                        >
                          <span className="text-sm">{pop.code.text}</span>
                          <Badge variant="secondary">{pop.count} patients</Badge>
                        </div>
                      ))}
                      {group.measureScore && (
                        <div className="flex items-center justify-between p-2 bg-primary/10 rounded border-primary/20 border">
                          <span className="text-sm font-medium">Measure Score</span>
                          <Badge variant="default">
                            {(group.measureScore.value * 100).toFixed(2)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Message */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Measure report generated successfully. You can now proceed to SQL translation
                (Step 5) to compare results.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

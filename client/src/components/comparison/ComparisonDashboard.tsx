/**
 * Phase 8: Results Comparison Dashboard
 *
 * Provides side-by-side comparison of CQL and SQL evaluation results,
 * performance metrics, and data export capabilities.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  XCircle,
  ArrowRight,
  Zap,
  Database
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { ScaleVisualizer } from "@/components/showcase/ScaleVisualizer";

interface ComparisonData {
  cql: {
    measureReport: any;
    executionTime: number;
    timestamp: Date;
    populationCount?: number;
  } | null;
  sql: {
    measureReport: any;
    executionTime: number;
    generatedSql?: string;
    timestamp: Date;
    populationCount?: number;
  } | null;
  stats: {
    totalEvaluations: number;
    cqlEvaluations: number;
    sqlEvaluations: number;
    averageCqlExecutionMs: number;
    averageSqlExecutionMs: number;
    performanceRatio: number | null;
  } | null;
}

export function ComparisonDashboard() {
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    cql: null,
    sql: null,
    stats: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get data from store for real-time updates
  const cqlMeasureReport = useAppStore((state) => state.cqlMeasureReport);
  const sqlMeasureReport = useAppStore((state) => state.sqlMeasureReport);
  const generatedSql = useAppStore((state) => state.generatedSql);

  // Fetch comparison data from backend
  const fetchComparisonData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch latest logs for comparison
      const logsResponse = await fetch('/api/evaluation-logs/latest');
      if (!logsResponse.ok) throw new Error('Failed to fetch evaluation logs');
      const logs = await logsResponse.json();

      // Fetch statistics
      const statsResponse = await fetch('/api/evaluation-logs/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
      const stats = await statsResponse.json();

      // Fetch measure reports
      const reportsResponse = await fetch('/api/measure-reports/latest/comparison');
      if (!reportsResponse.ok) throw new Error('Failed to fetch measure reports');
      const reports = await reportsResponse.json();

      // Combine data from backend and store
      setComparisonData({
        cql: logs.cql ? {
          measureReport: reports.cql?.measureReport || cqlMeasureReport,
          executionTime: parseFloat(logs.cql.executionTimeMs || '0'),
          timestamp: new Date(logs.cql.createdAt),
          populationCount: extractPopulationCount(reports.cql?.measureReport || cqlMeasureReport),
        } : (cqlMeasureReport ? {
          measureReport: cqlMeasureReport,
          executionTime: cqlMeasureReport.meta?.executionTime || 0,
          timestamp: new Date(),
          populationCount: extractPopulationCount(cqlMeasureReport),
        } : null),
        sql: logs.sql ? {
          measureReport: reports.sql?.measureReport || sqlMeasureReport,
          executionTime: parseFloat(logs.sql.executionTimeMs || '0'),
          generatedSql: reports.sql?.generatedSql || generatedSql,
          timestamp: new Date(logs.sql.createdAt),
          populationCount: extractPopulationCount(reports.sql?.measureReport || sqlMeasureReport),
        } : (sqlMeasureReport ? {
          measureReport: sqlMeasureReport,
          executionTime: sqlMeasureReport.meta?.executionTime || 0,
          generatedSql: generatedSql,
          timestamp: new Date(),
          populationCount: extractPopulationCount(sqlMeasureReport),
        } : null),
        stats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison data');
      console.error('Comparison fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [cqlMeasureReport, sqlMeasureReport]);

  // Extract population count from MeasureReport
  const extractPopulationCount = (measureReport: any): number | undefined => {
    if (!measureReport?.group?.[0]?.population) return undefined;
    const initialPopulation = measureReport.group[0].population.find(
      (p: any) => p.code?.text === 'initial-population'
    );
    return initialPopulation?.count;
  };

  // Export results as JSON
  const exportAsJson = () => {
    const exportData = {
      comparison: comparisonData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-analytics-comparison-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export results as CSV
  const exportAsCsv = () => {
    const { cql, sql, stats } = comparisonData;

    const rows = [
      ['Metric', 'CQL', 'SQL', 'Difference'],
      ['Execution Time (ms)',
        cql?.executionTime?.toFixed(2) || 'N/A',
        sql?.executionTime?.toFixed(2) || 'N/A',
        cql && sql ? `${((sql.executionTime - cql.executionTime) / cql.executionTime * 100).toFixed(2)}%` : 'N/A'
      ],
      ['Population Count',
        cql?.populationCount?.toString() || 'N/A',
        sql?.populationCount?.toString() || 'N/A',
        cql?.populationCount === sql?.populationCount ? 'Match' : 'Mismatch'
      ],
      ['Total Evaluations', stats?.cqlEvaluations?.toString() || '0', stats?.sqlEvaluations?.toString() || '0', ''],
      ['Average Execution (ms)',
        stats?.averageCqlExecutionMs?.toFixed(2) || 'N/A',
        stats?.averageSqlExecutionMs?.toFixed(2) || 'N/A',
        ''
      ],
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-analytics-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { cql, sql, stats } = comparisonData;
  const hasData = cql || sql;
  const hasBothResults = cql && sql;
  const resultsMatch = cql?.populationCount === sql?.populationCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Results Comparison</h2>
          <p className="text-muted-foreground">
            Compare CQL and SQL on FHIR evaluation results
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComparisonData}
            disabled={isLoading}
          >
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {hasData && (
            <>
              <Button variant="outline" size="sm" onClick={exportAsCsv}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportAsJson}>
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scale Visualizer (Keynote Feature) */}
      <div className="mb-8">
        <ScaleVisualizer />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading comparison data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && !hasData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Comparison Data Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Execute both CQL (Step 4) and SQL (Step 5) evaluations to see comparison results here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {!isLoading && hasData && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Results Match Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Results Match</CardTitle>
                {hasBothResults && (
                  resultsMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )
                )}
              </CardHeader>
              <CardContent>
                {hasBothResults ? (
                  <>
                    <div className="text-2xl font-bold">
                      {resultsMatch ? 'Yes' : 'No'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CQL: {cql?.populationCount || 0} | SQL: {sql?.populationCount || 0}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Need both evaluations
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Zap className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                {hasBothResults ? (
                  <>
                    <div className="text-2xl font-bold">
                      {sql.executionTime < cql.executionTime ? 'SQL Faster' : 'CQL Faster'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(((sql.executionTime - cql.executionTime) / cql.executionTime * 100)).toFixed(1)}% difference
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Need both evaluations
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Evaluations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEvaluations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  CQL: {stats?.cqlEvaluations || 0} | SQL: {stats?.sqlEvaluations || 0}
                </p>
              </CardContent>
            </Card>

            {/* Average Execution Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Execution</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {stats && (stats.averageCqlExecutionMs > 0 || stats.averageSqlExecutionMs > 0) ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Math.min(stats.averageCqlExecutionMs, stats.averageSqlExecutionMs).toFixed(0)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best average time
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="execution">Execution Details</TabsTrigger>
              <TabsTrigger value="measurereports">MeasureReports</TabsTrigger>
              <TabsTrigger value="sql">Generated SQL</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* CQL Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">CQL</Badge>
                      Direct Evaluation
                    </CardTitle>
                    <CardDescription>Clinical Quality Language execution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cql ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Population Count</span>
                            <span className="font-mono font-semibold">{cql.populationCount || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Execution Time</span>
                            <span className="font-mono font-semibold">{cql.executionTime.toFixed(2)} ms</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Timestamp</span>
                            <span className="font-mono text-xs">{cql.timestamp.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No CQL evaluation data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SQL Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">SQL</Badge>
                      SQL on FHIR
                    </CardTitle>
                    <CardDescription>Transpiled SQL query execution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sql ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Population Count</span>
                            <span className="font-mono font-semibold">{sql.populationCount || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Execution Time</span>
                            <span className="font-mono font-semibold">{sql.executionTime.toFixed(2)} ms</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Timestamp</span>
                            <span className="font-mono text-xs">{sql.timestamp.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No SQL evaluation data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Metrics */}
              {hasBothResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Metrics</CardTitle>
                    <CardDescription>Side-by-side analysis of both evaluation methods</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Result Accuracy */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {resultsMatch ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-semibold">Result Accuracy</div>
                            <div className="text-sm text-muted-foreground">
                              {resultsMatch ? 'Population counts match exactly' : 'Population counts differ'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={resultsMatch ? "default" : "destructive"}>
                          {resultsMatch ? '100%' : 'Mismatch'}
                        </Badge>
                      </div>

                      {/* Execution Time Comparison */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Execution Time Comparison</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>CQL</span>
                              <span className="font-mono">{cql.executionTime.toFixed(2)} ms</span>
                            </div>
                            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{
                                  width: `${(cql.executionTime / Math.max(cql.executionTime, sql.executionTime)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>SQL</span>
                              <span className="font-mono">{sql.executionTime.toFixed(2)} ms</span>
                            </div>
                            <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{
                                  width: `${(sql.executionTime / Math.max(cql.executionTime, sql.executionTime)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {sql.executionTime < cql.executionTime ? (
                            <>SQL is {((1 - sql.executionTime / cql.executionTime) * 100).toFixed(1)}% faster</>
                          ) : (
                            <>CQL is {((1 - cql.executionTime / sql.executionTime) * 100).toFixed(1)}% faster</>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Execution Details Tab */}
            <TabsContent value="execution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>Detailed execution information from both evaluation methods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {cql && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Badge variant="secondary">CQL</Badge>
                          Execution Log
                        </h4>
                        <div className="bg-muted p-4 rounded-md space-y-2 font-mono text-sm">
                          <div>Timestamp: {cql.timestamp.toISOString()}</div>
                          <div>Execution Time: {cql.executionTime.toFixed(2)} ms</div>
                          <div>Population Count: {cql.populationCount || 0}</div>
                          <div>Status: ✓ Complete</div>
                        </div>
                      </div>
                    )}
                    {sql && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Badge variant="secondary">SQL</Badge>
                          Execution Log
                        </h4>
                        <div className="bg-muted p-4 rounded-md space-y-2 font-mono text-sm">
                          <div>Timestamp: {sql.timestamp.toISOString()}</div>
                          <div>Execution Time: {sql.executionTime.toFixed(2)} ms</div>
                          <div>Population Count: {sql.populationCount || 0}</div>
                          <div>Status: ✓ Complete</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MeasureReports Tab */}
            <TabsContent value="measurereports" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {cql?.measureReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary">CQL</Badge>
                        MeasureReport
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                        {JSON.stringify(cql.measureReport, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
                {sql?.measureReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary">SQL</Badge>
                        MeasureReport
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                        {JSON.stringify(sql.measureReport, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* SQL Tab */}
            <TabsContent value="sql" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generated SQL Query</CardTitle>
                  <CardDescription>SQL on FHIR query transpiled from CQL</CardDescription>
                </CardHeader>
                <CardContent>
                  {sql?.generatedSql ? (
                    <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                      {sql.generatedSql}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No SQL query available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

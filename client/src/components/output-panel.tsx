import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "./json-viewer";
import { SqlViewer } from "./sql-viewer";
import { TransformationView } from "./transformation-view";
import { SchemaViewer } from "./schema-viewer";
import { ExecutionResult, SqlExecutionResult, LogEntry } from "@/types/fhir";
import { CheckCircle, Database, Download, Trash2, Workflow, Code, Table, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutputPanelProps {
  cqlResult: ExecutionResult | null;
  sqlResult: SqlExecutionResult | null;
  cqlLoading: boolean;
  sqlLoading: boolean;
  cqlCode?: string;
}

export function OutputPanel({ cqlResult, sqlResult, cqlLoading, sqlLoading, cqlCode = '' }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState("cql-output");
  const { toast } = useToast();

  const exportMeasureReport = (result: ExecutionResult, type: string) => {
    const blob = new Blob([JSON.stringify(result.measureReport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-measure-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "MeasureReport has been downloaded",
    });
  };

  const exportSQL = (sql: string) => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-query-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "SQL Exported",
      description: "Generated SQL query has been downloaded",
    });
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatLogs = (logs: LogEntry[]) => {
    return logs.map((log, index) => (
      <div key={index} className="flex items-start space-x-2 text-xs">
        <span className="text-gray-500 font-mono">{log.timestamp}</span>
        <Badge 
          variant={log.level === 'ERROR' ? 'destructive' : log.level === 'SUCCESS' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {log.level}
        </Badge>
        <span className="text-gray-800">{log.message}</span>
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 rounded-t-xl p-1">
          <TabsTrigger value="cql-output" className="flex items-center space-x-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            <Code className="w-3.5 h-3.5" />
            <span>CQL Output</span>
          </TabsTrigger>
          <TabsTrigger value="sql-output" className="flex items-center space-x-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            <Database className="w-3.5 h-3.5" />
            <span>SQL Output</span>
          </TabsTrigger>
          <TabsTrigger value="transformation" className="flex items-center space-x-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            <Workflow className="w-3.5 h-3.5" />
            <span>Transform</span>
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center space-x-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            <Table className="w-3.5 h-3.5" />
            <span>Schema</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            <FileText className="w-3.5 h-3.5" />
            <span>Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* CQL Output Tab */}
        <TabsContent value="cql-output" className="flex-1 p-5 space-y-4 overflow-auto">
          {cqlLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 text-sm">Evaluating CQL...</p>
              </div>
            </div>
          ) : cqlResult ? (
            <>
              <Card className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">CQL Evaluation Completed</p>
                      <p className="text-xs text-slate-600">
                        Execution time: {cqlResult.executionTime}ms
                        {cqlResult.memoryUsage && ` | Memory: ${cqlResult.memoryUsage}MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMeasureReport(cqlResult, 'cql')}
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </Card>

              <JsonViewer
                title="FHIR MeasureReport"
                data={cqlResult.measureReport}
                className="flex-1"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
                  <Code className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-700 font-medium">No CQL Results Yet</p>
                <p className="text-sm text-slate-500 mt-1">Run CQL evaluation to see results here</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* SQL on FHIR Output Tab */}
        <TabsContent value="sql-output" className="flex-1 p-5 space-y-4 overflow-auto">
          {sqlLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 text-sm">Converting CQL to SQL...</p>
              </div>
            </div>
          ) : sqlResult ? (
            <>
              <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        SQL Conversion Complete
                      </p>
                      <p className="text-xs text-slate-600">
                        Execution time: {sqlResult.executionTime}ms
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportSQL(sqlResult.generatedSql)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export SQL
                  </Button>
                </div>
              </Card>

              {/* Generated SQL Query with Syntax Highlighting */}
              <SqlViewer
                sql={sqlResult.generatedSql}
                title="Generated SQL Query"
                showExport={true}
                maxHeight="300px"
              />

              <JsonViewer
                title="SQL-Generated MeasureReport"
                data={sqlResult.measureReport}
                className="flex-1"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
                  <Database className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-700 font-medium">No SQL Results Yet</p>
                <p className="text-sm text-slate-500 mt-1">Run CQL to SQL conversion to see results here</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Transformation View Tab */}
        <TabsContent value="transformation" className="flex-1 p-5 overflow-auto">
          {sqlResult && cqlCode ? (
            <TransformationView
              cqlCode={cqlCode}
              generatedSql={sqlResult.generatedSql}
              logs={sqlResult.logs.map(log => log.message)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
                  <Workflow className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-700 font-medium">No Transformation Data</p>
                <p className="text-sm text-slate-500 mt-1">Run SQL conversion to see transformation steps</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Database Schema Tab */}
        <TabsContent value="schema" className="flex-1 p-5 overflow-auto">
          <SchemaViewer />
        </TabsContent>

        {/* Logs & Status Tab */}
        <TabsContent value="logs" className="flex-1 p-5 space-y-4 overflow-auto">
          {/* Performance Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-700 mb-3">CQL Evaluation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Execution Time:</span>
                  <span className="font-mono text-slate-800">{cqlResult?.executionTime || 0}ms</span>
                </div>
                {cqlResult?.memoryUsage && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Memory Usage:</span>
                    <span className="font-mono text-slate-800">{cqlResult.memoryUsage}MB</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className={cqlResult ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {cqlResult ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="text-sm font-semibold text-emerald-700 mb-3">SQL on FHIR</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Time:</span>
                  <span className="font-mono text-slate-800">{sqlResult?.executionTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className={sqlResult ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {sqlResult ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Execution Log */}
          <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">Execution Log</h3>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-700 h-7"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-700 h-7"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            <div className="p-4 bg-white overflow-auto font-mono text-xs space-y-1" style={{ maxHeight: "300px" }}>
              {[...(cqlResult?.logs || []), ...(sqlResult?.logs || [])].length > 0 ? (
                <div className="space-y-1">
                  {cqlResult?.logs && formatLogs(cqlResult.logs)}
                  {sqlResult?.logs && (
                    <>
                      {cqlResult?.logs && cqlResult.logs.length > 0 && (
                        <div className="border-t border-slate-200 my-2 pt-2" />
                      )}
                      {formatLogs(sqlResult.logs)}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No Logs Yet</p>
                  <p className="text-xs mt-1">Logs will appear when you run evaluations</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

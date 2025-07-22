import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "./json-viewer";
import { ExecutionResult, SqlExecutionResult, LogEntry } from "@/types/fhir";
import { CheckCircle, Clock, MemoryStick, Database, Download, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutputPanelProps {
  cqlResult: ExecutionResult | null;
  sqlResult: SqlExecutionResult | null;
  cqlLoading: boolean;
  sqlLoading: boolean;
}

export function OutputPanel({ cqlResult, sqlResult, cqlLoading, sqlLoading }: OutputPanelProps) {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cql-output" className="flex items-center space-x-2">
            <i className="fas fa-code"></i>
            <span>CQL Output</span>
          </TabsTrigger>
          <TabsTrigger value="sql-output" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>SQL on FHIR Output</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <i className="fas fa-list-alt"></i>
            <span>Logs & Status</span>
          </TabsTrigger>
        </TabsList>

        {/* CQL Output Tab */}
        <TabsContent value="cql-output" className="flex-1 p-6 space-y-6">
          {cqlLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Evaluating CQL...</p>
              </div>
            </div>
          ) : cqlResult ? (
            <>
              <Card className="p-4 bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-600">CQL Evaluation Completed</p>
                      <p className="text-xs text-gray-600">
                        Execution time: {cqlResult.executionTime}ms
                        {cqlResult.memoryUsage && ` | Memory usage: ${cqlResult.memoryUsage}MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMeasureReport(cqlResult, 'cql')}
                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
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
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <i className="fas fa-code text-4xl mb-4"></i>
                <p>No CQL evaluation results yet</p>
                <p className="text-sm">Click "Evaluate with CQL" to see results here</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* SQL on FHIR Output Tab */}
        <TabsContent value="sql-output" className="flex-1 p-6 space-y-6">
          {sqlLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Converting CQL to SQL and executing...</p>
              </div>
            </div>
          ) : sqlResult ? (
            <>
              <Card className="p-4 bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        CQL to SQL Conversion & Execution Completed
                      </p>
                      <p className="text-xs text-gray-600">
                        Total execution time: {sqlResult.executionTime}ms
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportSQL(sqlResult.generatedSql)}
                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export SQL
                  </Button>
                </div>
              </Card>

              {/* Generated SQL Query */}
              <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '45%' }}>
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">Generated SQL Query</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(sqlResult.generatedSql, "SQL query copied to clipboard")}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-white overflow-auto font-mono text-sm h-full">
                  <pre className="text-gray-800 whitespace-pre-wrap">
                    {sqlResult.generatedSql}
                  </pre>
                </div>
              </div>

              <JsonViewer
                title="SQL-Generated MeasureReport"
                data={sqlResult.measureReport}
                className="flex-1"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Database className="w-16 h-16 mx-auto mb-4" />
                <p>No SQL conversion results yet</p>
                <p className="text-sm">Click "Convert and Evaluate with SQL on FHIR" to see results here</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Logs & Status Tab */}
        <TabsContent value="logs" className="flex-1 p-6 space-y-4">
          {/* Performance Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600 mb-2">CQL Evaluation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Execution Time:</span>
                  <span className="font-mono">{cqlResult?.executionTime || 0}ms</span>
                </div>
                {cqlResult?.memoryUsage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-mono">{cqlResult.memoryUsage}MB</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={cqlResult ? "text-green-600" : "text-gray-400"}>
                    {cqlResult ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-green-50 border border-green-200">
              <h3 className="text-sm font-medium text-green-600 mb-2">SQL on FHIR</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-mono">{sqlResult?.executionTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={sqlResult ? "text-green-600" : "text-gray-400"}>
                    {sqlResult ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Execution Log */}
          <div className="flex-1 border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Execution Log</h3>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            <div className="p-4 bg-white overflow-auto font-mono text-xs space-y-1" style={{ height: "calc(100% - 40px)" }}>
              {[...(cqlResult?.logs || []), ...(sqlResult?.logs || [])].length > 0 ? (
                <div className="space-y-1">
                  {cqlResult?.logs && formatLogs(cqlResult.logs)}
                  {sqlResult?.logs && (
                    <>
                      {cqlResult?.logs && cqlResult.logs.length > 0 && (
                        <div className="border-t border-gray-200 my-2 pt-2" />
                      )}
                      {formatLogs(sqlResult.logs)}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No execution logs yet</p>
                  <p className="text-xs">Logs will appear here when you run evaluations</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

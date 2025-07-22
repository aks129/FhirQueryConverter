import { useState } from "react";
import { FhirBundle, SqlExecutionResult } from "@/types/fhir";
import { SqlTranspiler } from "@/lib/sql-transpiler";
import { useToast } from "@/hooks/use-toast";

export function useSqlEvaluation() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SqlExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const convertAndEvaluate = async (cqlCode: string, fhirBundle: FhirBundle) => {
    setIsLoading(true);
    setError(null);

    try {
      const transpiler = new SqlTranspiler();
      const executionResult = await transpiler.convertAndEvaluate(cqlCode, fhirBundle);
      setResult(executionResult);
      
      toast({
        title: "SQL Conversion & Evaluation Completed",
        description: `Execution completed in ${executionResult.executionTime}ms`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "SQL Evaluation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    convertAndEvaluate,
    clearResult,
    isLoading,
    result,
    error
  };
}

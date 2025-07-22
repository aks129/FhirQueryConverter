import { useState } from "react";
import { FhirBundle, ExecutionResult } from "@/types/fhir";
import { CqlEngine } from "@/lib/cql-engine";
import { useToast } from "@/hooks/use-toast";

export function useCqlEvaluation() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const evaluateCql = async (cqlCode: string, fhirBundle: FhirBundle) => {
    setIsLoading(true);
    setError(null);

    try {
      const engine = new CqlEngine();
      const executionResult = await engine.evaluateCql(cqlCode, fhirBundle);
      setResult(executionResult);
      
      toast({
        title: "CQL Evaluation Completed",
        description: `Execution completed in ${executionResult.executionTime}ms`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "CQL Evaluation Failed",
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
    evaluateCql,
    clearResult,
    isLoading,
    result,
    error
  };
}

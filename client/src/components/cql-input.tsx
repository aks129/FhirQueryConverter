import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, Code, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FhirLibraryLoader } from "./fhir-library-loader";

interface CqlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
}

export function CqlInput({ value, onChange, onValidate }: CqlInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [loadedLibraryName, setLoadedLibraryName] = useState<string | null>(null);
  const { toast } = useToast();

  const validateCql = async () => {
    setIsValidating(true);
    
    // Basic CQL validation
    try {
      if (!value.trim()) {
        throw new Error("CQL code is required");
      }

      if (!value.includes('define ')) {
        throw new Error("CQL must contain at least one define statement");
      }

      // Check for required define statements
      const requiredDefines = ['Initial Population', 'Denominator', 'Numerator'];
      const missingDefines = requiredDefines.filter(def => 
        !value.includes(`define "${def}"`)
      );

      if (missingDefines.length > 0) {
        throw new Error(`Missing required define statements: ${missingDefines.join(', ')}`);
      }

      toast({
        title: "CQL Validation Successful",
        description: "Your CQL code appears to be valid",
      });
      
      onValidate?.(true);
    } catch (error) {
      toast({
        title: "CQL Validation Failed",
        description: error instanceof Error ? error.message : "Unknown validation error",
        variant: "destructive",
      });
      
      onValidate?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const clearCql = () => {
    onChange("");
    setLoadedLibraryName(null);
    toast({
      title: "CQL Cleared",
      description: "CQL input has been cleared",
    });
  };

  const handleCqlLoaded = (cql: string, libraryName: string) => {
    onChange(cql);
    setLoadedLibraryName(libraryName);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <Code className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                CQL Input
              </h2>
              <p className="text-xs text-slate-500">
                {loadedLibraryName
                  ? <>Loaded: <span className="font-medium text-blue-600">{loadedLibraryName}</span></>
                  : "Enter CQL or load from FHIR server"
                }
              </p>
            </div>
          </div>
          <FhirLibraryLoader onCqlLoaded={handleCqlLoaded} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full p-3 font-mono text-sm resize-none border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
          placeholder={`library ExampleMeasure version '1.0.0'

using FHIR version '4.0.1'

define "Initial Population":
  [Patient] P
    where P.gender = 'female'

define "Denominator":
  "Initial Population"

define "Numerator":
  "Denominator" D
    with [Observation: "Heart Rate"] O
      such that O.effective during "Measurement Period"`}
        />

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>CQL 1.5 Supported</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={validateCql}
              disabled={isValidating}
              className="text-xs h-8 border-slate-200"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              {isValidating ? "..." : "Validate"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCql}
              className="text-xs h-8 border-slate-200 text-slate-600"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

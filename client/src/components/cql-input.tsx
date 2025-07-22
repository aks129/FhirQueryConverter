import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CqlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
}

export function CqlInput({ value, onChange, onValidate }: CqlInputProps) {
  const [isValidating, setIsValidating] = useState(false);
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
    toast({
      title: "CQL Cleared",
      description: "CQL input has been cleared",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-1/2">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <i className="fas fa-code text-blue-600 mr-2"></i>
          CQL Input
        </h2>
        <p className="text-sm text-gray-600 mt-1">Enter your Clinical Quality Language code</p>
      </div>
      <div className="p-6 h-full">
        <div className="h-full">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-5/6 p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder={`library ExampleMeasure version '1.0.0'

using FHIR version '4.0.1'

define "Initial Population":
  [Patient] P
    where P.gender = 'female'
      and AgeInYearsAt(end of "Measurement Period") >= 18

define "Denominator":
  "Initial Population"

define "Numerator":
  "Denominator" D
    with [Observation: "Heart Rate"] O
      such that O.effective during "Measurement Period"`}
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="fas fa-info-circle"></i>
              <span>CQL Version 1.5 Support</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={validateCql}
                disabled={isValidating}
                className="text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isValidating ? "Validating..." : "Validate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCql}
                className="text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

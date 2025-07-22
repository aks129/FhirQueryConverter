import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CqlInput } from "@/components/cql-input";
import { FhirUpload } from "@/components/fhir-upload";
import { OutputPanel } from "@/components/output-panel";
import { useCqlEvaluation } from "@/hooks/use-cql-evaluation";
import { useSqlEvaluation } from "@/hooks/use-sql-evaluation";
import { FhirBundle } from "@/types/fhir";
import { sampleCqlCode } from "@/lib/sample-data";
import { Play, ServerCog, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [cqlCode, setCqlCode] = useState(sampleCqlCode);
  const [fhirBundle, setFhirBundle] = useState<FhirBundle | null>(null);
  
  const { 
    evaluateCql, 
    isLoading: cqlLoading, 
    result: cqlResult 
  } = useCqlEvaluation();
  
  const { 
    convertAndEvaluate, 
    isLoading: sqlLoading, 
    result: sqlResult 
  } = useSqlEvaluation();
  
  const { toast } = useToast();

  const handleCqlEvaluation = async () => {
    if (!cqlCode.trim()) {
      toast({
        title: "CQL Required",
        description: "Please enter CQL code before evaluation",
        variant: "destructive",
      });
      return;
    }

    if (!fhirBundle) {
      toast({
        title: "FHIR Bundle Required",
        description: "Please upload a FHIR bundle before evaluation",
        variant: "destructive",
      });
      return;
    }

    await evaluateCql(cqlCode, fhirBundle);
  };

  const handleSqlEvaluation = async () => {
    if (!cqlCode.trim()) {
      toast({
        title: "CQL Required",
        description: "Please enter CQL code before conversion",
        variant: "destructive",
      });
      return;
    }

    if (!fhirBundle) {
      toast({
        title: "FHIR Bundle Required",
        description: "Please upload a FHIR bundle before evaluation",
        variant: "destructive",
      });
      return;
    }

    await convertAndEvaluate(cqlCode, fhirBundle);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Stethoscope className="text-blue-600 text-2xl" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  FHIR HL7 CQL to SQL on FHIR Converter
                </h1>
                <p className="text-sm text-gray-600">
                  Clinical Quality Language Evaluation & Conversion Tool
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600">System Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-140px)]">
          
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* CQL Input Section */}
            <CqlInput
              value={cqlCode}
              onChange={setCqlCode}
            />

            {/* FHIR Bundle Upload Section */}
            <div className="space-y-4">
              <FhirUpload
                bundle={fhirBundle}
                onBundleChange={setFhirBundle}
              />

              {/* Execution Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleCqlEvaluation}
                  disabled={cqlLoading || !cqlCode.trim() || !fhirBundle}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {cqlLoading ? "Evaluating..." : "Evaluate with CQL"}
                </Button>
                
                <Button
                  onClick={handleSqlEvaluation}
                  disabled={sqlLoading || !cqlCode.trim() || !fhirBundle}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                >
                  <ServerCog className="w-4 h-4 mr-2" />
                  {sqlLoading ? "Converting..." : "Convert and Evaluate with SQL on FHIR"}
                </Button>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-3">
            <OutputPanel
              cqlResult={cqlResult}
              sqlResult={sqlResult}
              cqlLoading={cqlLoading}
              sqlLoading={sqlLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>FHIR HL7 CQL to SQL Converter v1.0.0</span>
              <span>•</span>
              <span>Supports CQL 1.5 & FHIR R4</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-blue-600">Documentation</a>
              <a href="#" className="hover:text-blue-600">GitHub</a>
              <a href="#" className="hover:text-blue-600">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CqlInput } from "@/components/cql-input";
import { FhirUpload } from "@/components/fhir-upload";
import { OutputPanel } from "@/components/output-panel";
import { useCqlEvaluation } from "@/hooks/use-cql-evaluation";
import { useSqlEvaluation } from "@/hooks/use-sql-evaluation";
import { FhirBundle } from "@/types/fhir";
import { sampleCqlCode, diabetesCareBundle } from "@/lib/sample-data";
import { Play, ServerCog, Stethoscope, Zap, HelpCircle, Bot, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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

  const runSampleExample = async () => {
    try {
      // Load sample data if not already loaded
      if (!fhirBundle) {
        setFhirBundle(diabetesCareBundle);
        toast({
          title: "Sample Data Loaded",
          description: "Loaded diabetes care sample with 3 patients and heart rate observations",
        });
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Ensure we have sample CQL
      if (!cqlCode.trim()) {
        setCqlCode(sampleCqlCode);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Running Example Demonstration",
        description: "Running both CQL and SQL evaluations automatically",
      });

      // Run CQL evaluation first
      await evaluateCql(cqlCode || sampleCqlCode, fhirBundle || diabetesCareBundle);
      
      // Wait a moment between evaluations
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Run SQL evaluation
      await convertAndEvaluate(cqlCode || sampleCqlCode, fhirBundle || diabetesCareBundle);

      toast({
        title: "Example Complete!",
        description: "Both evaluation methods completed. Check the output tabs to compare results.",
      });

    } catch (error) {
      toast({
        title: "Example Failed",
        description: "There was an error running the example demonstration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header - Simplified */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <Stethoscope className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  CQL to SQL on FHIR
                </h1>
                <p className="text-xs text-gray-500">
                  Convert clinical quality measures to executable SQL
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Link href="/e2e-demo">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-e2e"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  E2E Demo
                </Button>
              </Link>
              <Link href="/ai">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-ai"
                >
                  <Bot className="w-4 h-4 mr-1" />
                  AI
                </Button>
              </Link>
              <Link href="/faq">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-faq"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </Link>
            </nav>
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

              {/* Quick Start */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <Button
                  onClick={runSampleExample}
                  disabled={cqlLoading || sqlLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {(cqlLoading || sqlLoading) ? "Running..." : "Quick Start Demo"}
                </Button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Load sample CQL + FHIR data, run both evaluations
                </p>
              </div>

              {/* Evaluation Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCqlEvaluation}
                  disabled={cqlLoading || !cqlCode.trim() || !fhirBundle}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {cqlLoading ? "..." : "Run CQL"}
                </Button>

                <Button
                  onClick={handleSqlEvaluation}
                  disabled={sqlLoading || !cqlCode.trim() || !fhirBundle}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  {sqlLoading ? "..." : "CQL to SQL"}
                </Button>
              </div>

              {!fhirBundle && cqlCode.trim() && (
                <p className="text-xs text-amber-600 text-center">
                  Load FHIR data to enable evaluation
                </p>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-3">
            <OutputPanel
              cqlResult={cqlResult}
              sqlResult={sqlResult}
              cqlLoading={cqlLoading}
              sqlLoading={sqlLoading}
              cqlCode={cqlCode}
            />
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <p className="text-xs text-gray-400 text-center">
            CQL 1.5 + FHIR R4 | Open Quality
          </p>
        </div>
      </footer>
    </div>
  );
}

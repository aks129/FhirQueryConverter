import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CqlInput } from "@/components/cql-input";
import { FhirUpload } from "@/components/fhir-upload";
import { OutputPanel } from "@/components/output-panel";
import { useCqlEvaluation } from "@/hooks/use-cql-evaluation";
import { useSqlEvaluation } from "@/hooks/use-sql-evaluation";
import { FhirBundle } from "@/types/fhir";
import { sampleCqlCode, diabetesCareBundle } from "@/lib/sample-data";
import { Play, ServerCog, Stethoscope, Zap, HelpCircle, Bot } from "lucide-react";
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
              <Link href="/e2e-demo">
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-e2e"
                >
                  <Zap className="w-4 h-4" />
                  End-to-End Demo
                </Button>
              </Link>
              <Link href="/whats-next">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                  data-testid="button-learn-more"
                >
                  <Zap className="w-4 h-4" />
                  Learn More
                </Button>
              </Link>
              <Link href="/ai">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                  data-testid="button-ai"
                >
                  <Bot className="w-4 h-4" />
                  AI Agents
                </Button>
              </Link>
              <Link href="/faq">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  data-testid="button-faq"
                >
                  <HelpCircle className="w-4 h-4" />
                  FAQ & Architecture
                </Button>
              </Link>
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

              {/* Quick Demo Button */}
              <div className="mb-4">
                <Button
                  onClick={runSampleExample}
                  disabled={cqlLoading || sqlLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 border-2 border-purple-400"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {(cqlLoading || sqlLoading) ? "Running Example..." : "Use Sample & Run Example"}
                </Button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Automatically loads sample data and runs both evaluation methods
                </p>
              </div>

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
              cqlCode={cqlCode}
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

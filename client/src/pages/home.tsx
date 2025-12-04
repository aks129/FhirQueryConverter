import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CqlInput } from "@/components/cql-input";
import { FhirUpload } from "@/components/fhir-upload";
import { OutputPanel } from "@/components/output-panel";
import { useCqlEvaluation } from "@/hooks/use-cql-evaluation";
import { useSqlEvaluation } from "@/hooks/use-sql-evaluation";
import { FhirBundle } from "@/types/fhir";
import { sampleCqlCode, diabetesCareBundle } from "@/lib/sample-data";
import { Play, Stethoscope, Zap, HelpCircle, Bot, ArrowRight, Code, Database, Github, FileCode } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  CQL to SQL on FHIR
                </h1>
                <p className="text-sm text-slate-500">
                  Clinical Quality Language Converter
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <Link href="/e2e-demo">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                  data-testid="button-e2e"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  E2E Demo
                </Button>
              </Link>
              <Link href="/ai">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 hover:bg-slate-50"
                  data-testid="button-ai"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </Link>
              <Link href="/faq">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900"
                  data-testid="button-faq"
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Help
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">

          {/* Input Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
            {/* CQL Input Section */}
            <CqlInput
              value={cqlCode}
              onChange={setCqlCode}
            />

            {/* FHIR Bundle Upload Section */}
            <FhirUpload
              bundle={fhirBundle}
              onBundleChange={setFhirBundle}
            />

            {/* Action Buttons */}
            <div className="flex-shrink-0 space-y-3">
              {/* Quick Start */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                <Button
                  onClick={runSampleExample}
                  disabled={cqlLoading || sqlLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {(cqlLoading || sqlLoading) ? "Running..." : "Quick Start Demo"}
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Load sample CQL + FHIR data
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
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
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
          <div className="lg:col-span-3 h-full overflow-hidden">
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
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span className="flex items-center">
                <Code className="w-4 h-4 mr-1" />
                CQL 1.5
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center">
                <Database className="w-4 h-4 mr-1" />
                FHIR R4
              </span>
              <span className="text-slate-300">|</span>
              <span>SQL on FHIR v2</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/aks129/FhirQueryConverter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <span className="text-sm text-slate-400">
                Open Quality Initiative
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

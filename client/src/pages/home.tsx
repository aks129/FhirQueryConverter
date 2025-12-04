import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CqlInput } from "@/components/cql-input";
import { FhirUpload } from "@/components/fhir-upload";
import { OutputPanel } from "@/components/output-panel";
import { useCqlEvaluation } from "@/hooks/use-cql-evaluation";
import { useSqlEvaluation } from "@/hooks/use-sql-evaluation";
import { FhirBundle } from "@/types/fhir";
import { sampleCqlCode, diabetesCareBundle } from "@/lib/sample-data";
import { Play, Zap, HelpCircle, Bot, ArrowRight, Code, Database, Github, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  CQL to SQL on FHIR
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Clinical Quality Language Converter
                </p>
              </div>
            </motion.div>
            <nav className="flex items-center space-x-3">
              <Link href="/e2e-demo">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 rounded-full px-6"
                    data-testid="button-e2e"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    E2E Demo
                  </Button>
                </motion.div>
              </Link>
              <Link href="/ai">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full px-4"
                    data-testid="button-ai"
                  >
                    <Bot className="w-4 h-4 mr-2 text-indigo-500" />
                    AI Assistant
                  </Button>
                </motion.div>
              </Link>
              <Link href="/faq">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900 rounded-full"
                    data-testid="button-faq"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Help
                  </Button>
                </motion.div>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">

          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden"
          >
            {/* CQL Input Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <CqlInput
                value={cqlCode}
                onChange={setCqlCode}
              />
            </div>

            {/* FHIR Bundle Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <FhirUpload
                bundle={fhirBundle}
                onBundleChange={setFhirBundle}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 space-y-4">
              {/* Quick Start */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100 shadow-sm"
              >
                <Button
                  onClick={runSampleExample}
                  disabled={cqlLoading || sqlLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-md shadow-indigo-500/20 h-10 rounded-lg transition-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {(cqlLoading || sqlLoading) ? "Running..." : "Quick Start Demo"}
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center font-medium">
                  Load sample CQL + FHIR data instantly
                </p>
              </motion.div>

              {/* Evaluation Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleCqlEvaluation}
                    disabled={cqlLoading || !cqlCode.trim() || !fhirBundle}
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 h-10 rounded-lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {cqlLoading ? "..." : "Run CQL"}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSqlEvaluation}
                    disabled={sqlLoading || !cqlCode.trim() || !fhirBundle}
                    variant="outline"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 h-10 rounded-lg"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {sqlLoading ? "..." : "CQL to SQL"}
                  </Button>
                </motion.div>
              </div>

              {!fhirBundle && cqlCode.trim() && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-amber-600 text-center font-medium bg-amber-50 py-2 rounded-lg border border-amber-100"
                >
                  ⚠️ Please load FHIR data to enable evaluation
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 h-full overflow-hidden bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200"
          >
            <OutputPanel
              cqlResult={cqlResult}
              sqlResult={sqlResult}
              cqlLoading={cqlLoading}
              sqlLoading={sqlLoading}
              cqlCode={cqlCode}
            />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center hover:text-blue-600 transition-colors cursor-default">
                <Code className="w-4 h-4 mr-2 text-slate-400" />
                CQL 1.5
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center hover:text-blue-600 transition-colors cursor-default">
                <Database className="w-4 h-4 mr-2 text-slate-400" />
                FHIR R4
              </span>
              <span className="text-slate-300">|</span>
              <span className="hover:text-blue-600 transition-colors cursor-default">SQL on FHIR v2</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/aks129/FhirQueryConverter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <Github className="w-5 h-5" />
              </a>
              <span className="text-sm text-slate-400 font-medium">
                Open Quality Initiative
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

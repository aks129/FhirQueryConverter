/**
 * Main Workflow Page
 *
 * Guides users through the complete 9-step FHIR Query Converter workflow:
 * 1. Connect to FHIR Server
 * 2. Load CQL Libraries
 * 3. Connect to Terminology Server
 * 4. Execute & Generate Measure Reports
 * 5. Translate to SQL
 * 6. Connect to Database
 * 7. Write Back to FHIR Server
 * 8. Manage View Definitions
 * 9. Compare Results (Phase 8)
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  StepperNav,
  CompactStepper,
  StepNavigation,
  type Step,
} from "@/components/wizard/StepperNav";
import { FhirServerConnect } from "@/components/connections/FhirServerConnect";
import { LibraryManager } from "@/components/library/LibraryManager";
import { TerminologyConnect } from "@/components/terminology/TerminologyConnect";
import { ExecutionDashboard } from "@/components/execution/ExecutionDashboard";
import { SqlTranslation } from "@/components/sql/SqlTranslation";
import { DatabaseConnect } from "@/components/database/DatabaseConnect";
import { WriteBackPanel } from "@/components/writeback/WriteBackPanel";
import { ViewManagement } from "@/components/views/ViewManagement";
import { ComparisonDashboard } from "@/components/comparison/ComparisonDashboard";
import { useAppStore, WorkflowStep } from "@/store/app-store";
import {
  Server,
  FileCode,
  BookOpen,
  Play,
  Database,
  CloudUpload,
  Eye,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Define workflow steps
const WORKFLOW_STEPS: Step[] = [
  {
    id: "fhir-connection",
    label: "FHIR Server",
    description: "Connect to Medplum",
    icon: Server,
  },
  {
    id: "library-loading",
    label: "CQL Libraries",
    description: "Load & parse",
    icon: FileCode,
  },
  {
    id: "terminology-connection",
    label: "Terminology",
    description: "Value sets",
    icon: BookOpen,
  },
  {
    id: "execution",
    label: "Execute CQL",
    description: "Run queries",
    icon: Play,
  },
  {
    id: "sql-translation",
    label: "SQL Translation",
    description: "Generate SQL",
    icon: FileCode,
  },
  {
    id: "database-connection",
    label: "Database",
    description: "DuckDB/Databricks",
    icon: Database,
  },
  {
    id: "writeback",
    label: "Write Back",
    description: "Post to FHIR",
    icon: CloudUpload,
  },
  {
    id: "view-management",
    label: "View Defs",
    description: "Manage views",
    icon: Eye,
  },
  {
    id: "comparison",
    label: "Compare Results",
    description: "CQL vs SQL",
    icon: BarChart3,
  },
];

export default function Workflow() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Get state from store
  const {
    workflow,
    setCurrentStep,
    markStepComplete,
    errors,
    clearErrors,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  // Handle step navigation
  const handleStepClick = (step: WorkflowStep) => {
    // Allow navigation to completed steps or current step
    if (
      workflow.completedSteps.has(step) ||
      step === workflow.currentStep
    ) {
      setCurrentStep(step);
    }
  };

  const handleNext = async () => {
    const currentIndex = WORKFLOW_STEPS.findIndex(
      (s) => s.id === workflow.currentStep
    );

    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      setIsLoading(true);
      try {
        // Mark current step as complete
        markStepComplete(workflow.currentStep);

        // Move to next step
        const nextStep = WORKFLOW_STEPS[currentIndex + 1];
        setCurrentStep(nextStep.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    const currentIndex = WORKFLOW_STEPS.findIndex(
      (s) => s.id === workflow.currentStep
    );

    if (currentIndex > 0) {
      const prevStep = WORKFLOW_STEPS[currentIndex - 1];
      setCurrentStep(prevStep.id);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  // Render step content
  const renderStepContent = () => {
    switch (workflow.currentStep) {
      case "fhir-connection":
        return <FhirConnectionStep />;
      case "library-loading":
        return <LibraryLoadingStep />;
      case "terminology-connection":
        return <TerminologyConnectionStep />;
      case "execution":
        return <ExecutionStep />;
      case "sql-translation":
        return <SqlTranslationStep />;
      case "database-connection":
        return <DatabaseConnectionStep />;
      case "writeback":
        return <WriteBackStep />;
      case "view-management":
        return <ViewManagementStep />;
      case "comparison":
        return <ComparisonStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">FHIR Query Converter</h1>
                <p className="text-sm text-muted-foreground">
                  Production Workflow
                </p>
              </div>
            </div>
            <Badge variant="outline">Phase 8 - Alpha v0.3</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {errors.length} error(s) occurred. Please review and fix.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearErrors}
                className="ml-4"
              >
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stepper Navigation */}
        <div className="mb-8">
          {isMobile ? (
            <CompactStepper
              steps={WORKFLOW_STEPS}
              currentStep={workflow.currentStep}
              completedSteps={workflow.completedSteps}
              onStepClick={handleStepClick}
            />
          ) : (
            <StepperNav
              steps={WORKFLOW_STEPS}
              currentStep={workflow.currentStep}
              completedSteps={workflow.completedSteps}
              onStepClick={handleStepClick}
            />
          )}
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <StepNavigation
          currentStep={workflow.currentStep}
          steps={WORKFLOW_STEPS}
          canProceed={workflow.canProceed}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

// ============================================================================
// Step Components (Placeholders - will be implemented in detail)
// ============================================================================

function FhirConnectionStep() {
  return <FhirServerConnect />;
}

function LibraryLoadingStep() {
  return <LibraryManager />;
}

function TerminologyConnectionStep() {
  return <TerminologyConnect />;
}

function ExecutionStep() {
  return <ExecutionDashboard />;
}

function SqlTranslationStep() {
  return <SqlTranslation />;
}

function DatabaseConnectionStep() {
  return <DatabaseConnect />;
}

function WriteBackStep() {
  return <WriteBackPanel />;
}

function ViewManagementStep() {
  return <ViewManagement />;
}

function ComparisonStep() {
  return <ComparisonDashboard />;
}

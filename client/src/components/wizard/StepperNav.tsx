/**
 * Stepper Navigation Component
 *
 * Provides visual navigation for the 8-step workflow:
 * 1. FHIR Server Connection
 * 2. Load CQL Libraries
 * 3. Terminology Server
 * 4. Execute & Generate Reports
 * 5. SQL Translation
 * 6. Database Connection
 * 7. Write Back to FHIR
 * 8. View Definitions
 */

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowStep } from "@/store/app-store";

export interface Step {
  id: WorkflowStep;
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepperNavProps {
  steps: Step[];
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  onStepClick?: (step: WorkflowStep) => void;
  className?: string;
}

export function StepperNav({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepperNavProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav className={cn("w-full", className)} aria-label="Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const canClick = isCompleted || isCurrent || isPast;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <button
                onClick={() => canClick && onStepClick?.(step.id)}
                disabled={!canClick}
                className={cn(
                  "group flex flex-col items-center transition-all",
                  canClick && "cursor-pointer hover:opacity-80",
                  !canClick && "cursor-not-allowed opacity-50"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step Circle */}
                <div className="relative flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted &&
                        "border-green-600 bg-green-600 text-white",
                      isCurrent &&
                        !isCompleted &&
                        "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950",
                      isPast &&
                        !isCompleted &&
                        "border-gray-400 bg-gray-100 text-gray-600 dark:bg-gray-800",
                      isFuture &&
                        "border-gray-300 bg-white text-gray-400 dark:bg-gray-900"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent && "text-blue-600 dark:text-blue-400",
                      isCompleted && "text-green-600 dark:text-green-400",
                      !isCurrent &&
                        !isCompleted &&
                        "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground hidden md:block">
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    isCompleted
                      ? "bg-green-600"
                      : isPast
                      ? "bg-gray-400"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact Stepper for Mobile/Small Screens
 */
export function CompactStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepperNavProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const currentStepData = steps[currentIndex];

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(((currentIndex + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Step Info */}
      <div className="flex items-center gap-3 p-4 bg-card border rounded-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950 shrink-0">
          {completedSteps.has(currentStep) ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{currentIndex + 1}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{currentStepData.label}</h3>
          <p className="text-xs text-muted-foreground">
            {currentStepData.description}
          </p>
        </div>
        {currentIndex < steps.length - 1 && (
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Step Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick?.(step.id)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentIndex
                ? "w-8 bg-blue-600"
                : completedSteps.has(step.id)
                ? "w-2 bg-green-600"
                : "w-2 bg-gray-300 dark:bg-gray-600"
            )}
            aria-label={`Go to ${step.label}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Navigation Buttons for Stepper
 */
interface StepNavigationProps {
  currentStep: WorkflowStep;
  steps: Step[];
  canProceed: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function StepNavigation({
  currentStep,
  steps,
  canProceed,
  onNext,
  onBack,
  onSkip,
  isLoading,
  className,
}: StepNavigationProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <button
        onClick={onBack}
        disabled={isFirst || isLoading}
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors rounded-md",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        Back
      </button>

      <div className="flex items-center gap-2">
        {!isLast && onSkip && (
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}

        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className={cn(
            "px-6 py-2 text-sm font-medium text-white transition-colors rounded-md",
            "bg-blue-600 hover:bg-blue-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : isLast ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

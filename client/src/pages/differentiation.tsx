import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "wouter";

type CapabilityStatus = "full" | "partial" | "none";

interface Vendor {
  name: string;
  shortName: string;
}

interface Capability {
  name: string;
  description: string;
  example?: string;
  scores: Record<string, CapabilityStatus>;
}

const VENDORS: Vendor[] = [
  { name: "Open Quality", shortName: "OQ" },
  { name: "Innovaccer", shortName: "INN" },
  { name: "Arcadia", shortName: "ARC" },
  { name: "Health Catalyst", shortName: "HC" },
  { name: "Lightbeam", shortName: "LB" },
  { name: "Edifecs", shortName: "EDF" },
  { name: "Athena Pop Health", shortName: "ATH" },
  { name: "Raw LLMs", shortName: "LLM" }
];

const CAPABILITIES: Capability[] = [
  {
    name: "Understands CQL",
    description: "Can parse and interpret Clinical Quality Language (CQL) measure definitions natively.",
    example: "Parse CQL like 'define Numerator: exists [Observation: Mammography]' and evaluate it.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Understands FHIR logic",
    description: "Native support for FHIR resources, references, and data structures.",
    example: "Traverse Patient → Observation → code → coding → system/code relationships.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "partial",
      "Arcadia": "partial",
      "Health Catalyst": "partial",
      "Lightbeam": "none",
      "Edifecs": "partial",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Explains WHY a measure failed",
    description: "Provides human-readable explanations for why a patient did or did not meet measure criteria.",
    example: "'Patient failed because mammography was performed 28 months ago, exceeding the 27-month window.'",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Shows missing/incorrect data",
    description: "Identifies gaps in data feeds, incorrect mappings, or documentation issues.",
    example: "'No mammography observation found. Check if CPT 77067 is being captured from claims feed.'",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "partial",
      "Arcadia": "partial",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Root cause insights",
    description: "AI-driven analysis of why performance is dropping across populations.",
    example: "'15% drop in CMS125 numerator traced to missing radiology interface since March 2024.'",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Evidence-based explanations",
    description: "Links reasoning to clinical guidelines, measure specifications, and source data.",
    example: "'Per CMS125v12 specification section 4.2, mammography must occur within 27 months of period end.'",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Transparent rule logic",
    description: "Shows the exact logic path used to evaluate each patient against measure criteria.",
    example: "Visual trace: Initial Pop ✓ → Denominator ✓ → Exclusion ✗ → Numerator ✓ = PASS",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "SQL-on-FHIR native",
    description: "Built on SQL-on-FHIR standard for reproducible, portable analytics.",
    example: "Generate ViewDefinitions that work across Databricks, BigQuery, Snowflake.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Data quality scoring",
    description: "Automated scoring of data completeness, timeliness, and accuracy.",
    example: "Data quality score: 78%. Missing: 12% encounter types, 8% procedure codes.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "partial",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Agentic recommendations",
    description: "AI-generated, actionable next steps to close gaps or fix data issues.",
    example: "'Schedule mammography outreach for 234 patients. Priority: high-risk, last visit >6mo.'",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "partial"
    }
  },
  {
    name: "Real-time explainability",
    description: "Instant explanations as data changes, not batch-processed reports.",
    example: "See explanation update in real-time as new claims arrive.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Deployable in days",
    description: "Quick setup without months of implementation or custom development.",
    example: "Connect FHIR server, configure measures, see results in <1 week.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  },
  {
    name: "Interoperability-first DNA",
    description: "Built from ground up on FHIR, CQL, and healthcare standards.",
    example: "Native support for US Core, QI-Core, HEDIS value sets, NLM VSAC.",
    scores: {
      "Open Quality": "full",
      "Innovaccer": "none",
      "Arcadia": "none",
      "Health Catalyst": "none",
      "Lightbeam": "none",
      "Edifecs": "none",
      "Athena Pop Health": "none",
      "Raw LLMs": "none"
    }
  }
];

const StatusIcon = ({ status }: { status: CapabilityStatus }) => {
  switch (status) {
    case "full":
      return (
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      );
    case "partial":
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </div>
      );
    case "none":
      return (
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      );
  }
};

export default function Differentiation() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const toggleRow = (capName: string) => {
    setExpandedRow(expandedRow === capName ? null : capName);
  };

  const filteredVendors = selectedVendor
    ? VENDORS.filter(v => v.name === "Open Quality" || v.name === selectedVendor)
    : VENDORS;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link href="/whats-next">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 text-center">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100 mb-4">
          Differentiation Matrix
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
          Open Quality vs. Pop Health Vendors
        </p>
      </section>

      {/* Legend */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-gray-600 dark:text-gray-400">Full capability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-gray-600 dark:text-gray-400">Partial / limited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <span className="text-gray-600 dark:text-gray-400">No capability</span>
          </div>
        </div>
      </section>

      {/* Compare Filter */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Compare with:</span>
          <Button
            variant={selectedVendor === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedVendor(null)}
            className="rounded-full text-xs"
          >
            All
          </Button>
          {VENDORS.filter(v => v.name !== "Open Quality").map(vendor => (
            <Button
              key={vendor.name}
              variant={selectedVendor === vendor.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVendor(selectedVendor === vendor.name ? null : vendor.name)}
              className="rounded-full text-xs"
            >
              {vendor.shortName}
            </Button>
          ))}
        </div>
      </section>

      {/* Matrix Table */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-4 px-4 font-medium text-gray-900 dark:text-gray-100 min-w-[200px]">
                  Capability
                </th>
                {filteredVendors.map(vendor => (
                  <th
                    key={vendor.name}
                    className={`py-4 px-3 font-medium text-center min-w-[80px] ${
                      vendor.name === "Open Quality"
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <span className="hidden md:inline">{vendor.name}</span>
                    <span className="md:hidden">{vendor.shortName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((cap, i) => (
                <>
                  <tr
                    key={cap.name}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer ${
                      i % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50/50 dark:bg-gray-900/30"
                    }`}
                    onClick={() => toggleRow(cap.name)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-medium mb-1">{cap.name}</p>
                            <p className="text-sm text-gray-500">{cap.description}</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-gray-700 dark:text-gray-300 font-light">{cap.name}</span>
                        {expandedRow === cap.name ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                        )}
                      </div>
                    </td>
                    {filteredVendors.map(vendor => (
                      <td
                        key={vendor.name}
                        className={`py-4 px-3 text-center ${
                          vendor.name === "Open Quality" ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <div className="flex justify-center">
                          <StatusIcon status={cap.scores[vendor.name]} />
                        </div>
                      </td>
                    ))}
                  </tr>
                  {expandedRow === cap.name && (
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={filteredVendors.length + 1} className="py-4 px-4">
                        <div className="max-w-2xl">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {cap.description}
                          </p>
                          {cap.example && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Example: </span>
                              <span className="text-gray-700 dark:text-gray-300 italic">{cap.example}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* What This Means */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-8 text-center">
            What This Means for Teams
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">For Quality Teams</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                Stop manually reviewing charts to understand why measures fail.
                Get instant, evidence-based explanations.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">For Data Teams</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                Identify missing feeds and mapping issues before they impact performance.
                SQL-on-FHIR native for portable analytics.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">For Leadership</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                Understand root causes of performance drops.
                Make data-driven decisions with transparent AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-4">
            See the Difference
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-light mb-8">
            Request a demo to see explainable quality in action.
          </p>
          <Link href="/early-access">
            <Button
              size="lg"
              className="bg-[#4C83FF] hover:bg-[#3A6FFF] text-white rounded-xl px-8 h-12 font-medium"
            >
              Request Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
              Open Quality · Differentiation Matrix
            </div>
            <div className="flex items-center gap-6">
              <Link href="/whats-next">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  What's Next
                </span>
              </Link>
              <Link href="/investor">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Investor
                </span>
              </Link>
              <Link href="/early-access">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Early Access
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

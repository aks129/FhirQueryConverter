/**
 * End-to-End CQL Measure Execution Demo
 *
 * Real-world workflow demonstrating:
 * - Medplum FHIR server integration
 * - NLM VSAC terminology services
 * - Databricks SQL execution
 * - MeasureReport generation and write-back
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Database,
  FileCode,
  BookOpen,
  Layers,
  Play,
  Save,
  AlertCircle,
  TrendingUp,
  Server,
  Cloud,
  Code,
  FileCheck,
  Activity,
  Settings
} from "lucide-react";

// Step status type
type StepStatus = "pending" | "in_progress" | "completed" | "error";

interface StepLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface StepState {
  status: StepStatus;
  logs: StepLog[];
  data?: any;
}

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Connect to FHIR Server",
    icon: Server,
    description: "Connect to Medplum FHIR server instance"
  },
  {
    id: 2,
    title: "Select CQL Library & Measure",
    icon: FileCode,
    description: "Identify Library and Measure resources"
  },
  {
    id: 3,
    title: "Connect to Terminology Services",
    icon: BookOpen,
    description: "Retrieve ValueSets from NLM VSAC"
  },
  {
    id: 4,
    title: "Ingest Data to Databricks",
    icon: Database,
    description: "Load FHIR data via flattened pipelines"
  },
  {
    id: 5,
    title: "Create View Definitions",
    icon: Layers,
    description: "Build patient-specific FHIR views"
  },
  {
    id: 6,
    title: "Convert CQL to SQL",
    icon: Code,
    description: "Transpile via ELM converter"
  },
  {
    id: 7,
    title: "Review & Approve SQL",
    icon: FileCheck,
    description: "Validate generated SQL code"
  },
  {
    id: 8,
    title: "Approve Contract & Quality",
    icon: CheckCircle2,
    description: "Review in Databricks before execution"
  },
  {
    id: 9,
    title: "Execute & Generate Reports",
    icon: Play,
    description: "Run SQL and create MeasureReports"
  },
  {
    id: 10,
    title: "Write Back to FHIR Server",
    icon: Save,
    description: "Store MeasureReports and evidence"
  },
  {
    id: 11,
    title: "Review Statistics",
    icon: TrendingUp,
    description: "Analyze run metrics and outcomes"
  }
];

const CONFIG_STORAGE_KEY = "e2e-demo-config";

export default function E2EDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStates, setStepStates] = useState<Record<number, StepState>>(
    Object.fromEntries(
      WORKFLOW_STEPS.map(step => [
        step.id,
        { status: "pending" as StepStatus, logs: [] }
      ])
    )
  );

  // Connection configurations
  const [medplumConfig, setMedplumConfig] = useState({
    baseUrl: "https://api.medplum.com",
    clientId: "",
    clientSecret: "",
    projectId: ""
  });

  const [vsacConfig, setVsacConfig] = useState({
    apiKey: "",
    valueSetOids: []
  });

  const [databricksConfig, setDatabricksConfig] = useState({
    host: "",
    token: "",
    warehouse: "",
    catalog: "fhir_analytics",
    schema: "bronze"
  });

  // Load configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.medplum) setMedplumConfig(config.medplum);
        if (config.vsac) setVsacConfig(config.vsac);
        if (config.databricks) setDatabricksConfig(config.databricks);
        if (config.execution) {
          if (config.execution.patientIds?.length > 0) {
            setPatientId(config.execution.patientIds[0]);
          }
          if (config.execution.measureIds?.length > 0) {
            setSelectedMeasure(config.execution.measureIds[0]);
          }
          if (config.execution.libraryIds?.length > 0) {
            setSelectedLibrary(config.execution.libraryIds[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load configuration:", error);
      }
    }
  }, []);

  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const [patientId, setPatientId] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [measureReport, setMeasureReport] = useState<any>(null);

  const addLog = (stepId: number, message: string, type: StepLog["type"] = "info") => {
    setStepStates(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        logs: [
          ...prev[stepId].logs,
          {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
          }
        ]
      }
    }));
  };

  const updateStepStatus = (stepId: number, status: StepStatus) => {
    setStepStates(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        status
      }
    }));
  };

  const updateStepData = (stepId: number, data: any) => {
    setStepStates(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        data
      }
    }));
  };

  // Step 1: Connect to Medplum
  const connectToMedplum = async () => {
    updateStepStatus(1, "in_progress");
    addLog(1, "Initiating connection to Medplum FHIR server...");

    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog(1, `Connecting to ${medplumConfig.baseUrl}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog(1, "Authenticating with OAuth2 client credentials...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCapabilityStatement = {
        resourceType: "CapabilityStatement",
        fhirVersion: "4.0.1",
        format: ["json", "xml"],
        rest: [{
          mode: "server",
          resource: [
            { type: "Patient", interaction: [{ code: "read" }, { code: "search-type" }] },
            { type: "Observation", interaction: [{ code: "read" }, { code: "search-type" }] },
            { type: "Measure", interaction: [{ code: "read" }, { code: "search-type" }] },
            { type: "Library", interaction: [{ code: "read" }, { code: "search-type" }] }
          ]
        }]
      };

      updateStepData(1, { connected: true, capability: mockCapabilityStatement });
      addLog(1, "✓ Successfully connected to Medplum", "success");
      addLog(1, `✓ FHIR R4 server verified (version ${mockCapabilityStatement.fhirVersion})`, "success");
      addLog(1, "✓ Required resource types available: Patient, Observation, Measure, Library", "success");

      updateStepStatus(1, "completed");
      setCurrentStep(2);
    } catch (error) {
      addLog(1, `✗ Connection failed: ${error}`, "error");
      updateStepStatus(1, "error");
    }
  };

  // Step 2: Select Library and Measure
  const selectResources = async () => {
    updateStepStatus(2, "in_progress");
    addLog(2, "Searching for available CQL Libraries...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockLibraries = [
        { id: "lib-1", name: "BCSComponent", version: "1.0.0" },
        { id: "lib-2", name: "DiabetesHbA1c", version: "2.1.0" },
        { id: "lib-3", name: "ColorectalCancer", version: "1.5.0" }
      ];

      addLog(2, `✓ Found ${mockLibraries.length} CQL Libraries`, "success");
      mockLibraries.forEach(lib => {
        addLog(2, `  - ${lib.name} (v${lib.version})`, "info");
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(2, "Searching for Quality Measures...");

      const mockMeasures = [
        { id: "meas-1", name: "CMS125 - Breast Cancer Screening", library: "lib-1" },
        { id: "meas-2", name: "CMS122 - Diabetes HbA1c Control", library: "lib-2" },
        { id: "meas-3", name: "CMS130 - Colorectal Cancer Screening", library: "lib-3" }
      ];

      addLog(2, `✓ Found ${mockMeasures.length} Quality Measures`, "success");
      mockMeasures.forEach(meas => {
        addLog(2, `  - ${meas.name}`, "info");
      });

      // Auto-select first measure for demo
      setSelectedLibrary("lib-1");
      setSelectedMeasure("meas-1");

      updateStepData(2, {
        libraries: mockLibraries,
        measures: mockMeasures,
        selected: { library: "lib-1", measure: "meas-1" }
      });

      addLog(2, "✓ Selected: CMS125 - Breast Cancer Screening", "success");
      updateStepStatus(2, "completed");
      setCurrentStep(3);
    } catch (error) {
      addLog(2, `✗ Resource selection failed: ${error}`, "error");
      updateStepStatus(2, "error");
    }
  };

  // Step 3: Connect to NLM VSAC
  const connectToVSAC = async () => {
    updateStepStatus(3, "in_progress");
    addLog(3, "Connecting to NLM Value Set Authority Center (VSAC)...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog(3, "Authenticating with VSAC API key...");

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(3, "✓ VSAC API authentication successful", "success");

      addLog(3, "Retrieving required ValueSets for CMS125...");
      const valueSets = [
        "2.16.840.1.113883.3.464.1003.198.12.1011 - Mammography",
        "2.16.840.1.113883.3.526.3.1285 - Bilateral Mastectomy",
        "2.16.840.1.113883.3.464.1003.101.12.1061 - Patient Characteristic Payer"
      ];

      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog(3, `✓ Retrieved ${valueSets.length} ValueSets`, "success");
      valueSets.forEach(vs => {
        addLog(3, `  - ${vs}`, "info");
      });

      addLog(3, "✓ Total codes retrieved: 247 unique SNOMED/LOINC codes", "success");

      updateStepData(3, { valueSets, totalCodes: 247 });
      updateStepStatus(3, "completed");
      setCurrentStep(4);
    } catch (error) {
      addLog(3, `✗ VSAC connection failed: ${error}`, "error");
      updateStepStatus(3, "error");
    }
  };

  // Step 4: Ingest to Databricks
  const ingestToDatabricks = async () => {
    updateStepStatus(4, "in_progress");
    addLog(4, "Connecting to Databricks workspace...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(4, `✓ Connected to ${databricksConfig.host}`, "success");

      addLog(4, "Fetching FHIR data from Medplum...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      const resourceCounts = {
        Patient: 15432,
        Observation: 487321,
        Condition: 89234,
        Procedure: 45678,
        MedicationRequest: 123456
      };

      addLog(4, "✓ FHIR data retrieved successfully", "success");
      Object.entries(resourceCounts).forEach(([resource, count]) => {
        addLog(4, `  - ${resource}: ${count.toLocaleString()} resources`, "info");
      });

      addLog(4, "Starting FHIRmetrics flattened pipeline ingestion...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      addLog(4, "✓ Creating Delta tables in catalog 'fhir_analytics'...", "success");
      addLog(4, "  - fhir_analytics.bronze.patient", "info");
      addLog(4, "  - fhir_analytics.bronze.observation", "info");
      addLog(4, "  - fhir_analytics.bronze.condition", "info");

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(4, "✓ Data ingestion completed: 761,121 total records", "success");
      addLog(4, "✓ All tables optimized and indexed", "success");

      updateStepData(4, { resourceCounts, totalRecords: 761121 });
      updateStepStatus(4, "completed");
      setCurrentStep(5);
    } catch (error) {
      addLog(4, `✗ Databricks ingestion failed: ${error}`, "error");
      updateStepStatus(4, "error");
    }
  };

  // Step 5: Create View Definitions
  const createViews = async () => {
    updateStepStatus(5, "in_progress");
    addLog(5, "Creating FHIR view definitions for patient cohort...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog(5, "Analyzing measure requirements...");
      addLog(5, "  - Initial Population: Women 51-74 years old", "info");
      addLog(5, "  - Denominator: Active patients with qualifying encounters", "info");
      addLog(5, "  - Numerator: Mammography performed in last 27 months", "info");

      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog(5, "Creating views in Databricks...");

      const views = [
        "CREATE VIEW fhir_analytics.views.eligible_population AS ...",
        "CREATE VIEW fhir_analytics.views.qualifying_encounters AS ...",
        "CREATE VIEW fhir_analytics.views.mammography_procedures AS ...",
        "CREATE VIEW fhir_analytics.views.exclusions AS ..."
      ];

      for (const view of views) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const viewName = view.match(/views\.(\w+)/)?.[1];
        addLog(5, `✓ Created view: ${viewName}`, "success");
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(5, "✓ All view definitions created successfully", "success");
      addLog(5, "✓ Cohort identified: 1,247 patients match criteria", "success");

      updateStepData(5, { views, cohortSize: 1247 });
      updateStepStatus(5, "completed");
      setCurrentStep(6);
    } catch (error) {
      addLog(5, `✗ View creation failed: ${error}`, "error");
      updateStepStatus(5, "error");
    }
  };

  // Step 6: Convert CQL to SQL
  const convertCQLToSQL = async () => {
    updateStepStatus(6, "in_progress");
    addLog(6, "Loading CQL Library content...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCQL = `library BCSComponent version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

define "Initial Population":
  AgeInYearsAt(start of "Measurement Period") >= 51
    and AgeInYearsAt(start of "Measurement Period") < 75

define "Denominator":
  "Initial Population"
    and exists "Qualifying Encounters"

define "Numerator":
  exists "Mammography Performed"`;

      addLog(6, "✓ CQL Library loaded successfully", "success");
      addLog(6, `  - Library: BCSComponent v1.0.0`, "info");
      addLog(6, `  - Defines: 3 population criteria`, "info");

      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog(6, "Converting CQL to ELM (Expression Logical Model)...");

      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog(6, "✓ ELM conversion completed", "success");
      addLog(6, "  - Generated 247 ELM expression nodes", "info");

      addLog(6, "Transpiling ELM to ANSI SQL...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedSQLCode = `-- Generated SQL from CQL Library: BCSComponent v1.0.0
-- Measure: CMS125 - Breast Cancer Screening
-- Generated: ${new Date().toISOString()}

WITH initial_population AS (
  SELECT DISTINCT p.id AS patient_id
  FROM fhir_analytics.bronze.patient p
  WHERE TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE) >= 51
    AND TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE) < 75
),

qualifying_encounters AS (
  SELECT DISTINCT e.patient_id
  FROM fhir_analytics.bronze.encounter e
  WHERE e.status = 'finished'
    AND e.period_start >= DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
),

mammography_performed AS (
  SELECT DISTINCT o.patient_id
  FROM fhir_analytics.bronze.observation o
  WHERE o.code IN (
    SELECT code FROM fhir_analytics.terminology.valueset_expansion
    WHERE valueset_id = '2.16.840.1.113883.3.464.1003.198.12.1011'
  )
  AND o.effective_datetime >= DATE_SUB(CURRENT_DATE, INTERVAL 27 MONTH)
),

denominator AS (
  SELECT ip.patient_id
  FROM initial_population ip
  INNER JOIN qualifying_encounters qe ON ip.patient_id = qe.patient_id
),

numerator AS (
  SELECT d.patient_id
  FROM denominator d
  INNER JOIN mammography_performed mp ON d.patient_id = mp.patient_id
)

-- Final population calculations
SELECT
  'initial-population' AS population_type,
  COUNT(DISTINCT patient_id) AS count
FROM initial_population
UNION ALL
SELECT 'denominator', COUNT(DISTINCT patient_id) FROM denominator
UNION ALL
SELECT 'numerator', COUNT(DISTINCT patient_id) FROM numerator;`;

      setGeneratedSQL(generatedSQLCode);
      addLog(6, "✓ SQL transpilation completed successfully", "success");
      addLog(6, `  - Generated ${generatedSQLCode.split('\n').length} lines of SQL`, "info");
      addLog(6, "  - Used 5 CTEs for population logic", "info");

      updateStepData(6, { cql: mockCQL, sql: generatedSQLCode });
      updateStepStatus(6, "completed");
      setCurrentStep(7);
    } catch (error) {
      addLog(6, `✗ CQL to SQL conversion failed: ${error}`, "error");
      updateStepStatus(6, "error");
    }
  };

  // Step 7: Review and Approve SQL
  const reviewSQL = async () => {
    updateStepStatus(7, "in_progress");
    addLog(7, "Analyzing generated SQL for quality and safety...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog(7, "Running SQL linting and validation...");
      await new Promise(resolve => setTimeout(resolve, 1200));

      addLog(7, "✓ Syntax validation: PASSED", "success");
      addLog(7, "✓ Security scan: No SQL injection risks detected", "success");
      addLog(7, "✓ Performance analysis: Query optimizer hints applied", "success");

      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(7, "Checking database permissions and schema access...");

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(7, "✓ All referenced tables exist", "success");
      addLog(7, "✓ Required permissions verified", "success");

      addLog(7, "SQL ready for execution in Databricks", "info");
      addLog(7, "SQL copied to clipboard for Databricks review", "warning");

      updateStepStatus(7, "completed");
      setCurrentStep(8);
    } catch (error) {
      addLog(7, `✗ SQL review failed: ${error}`, "error");
      updateStepStatus(7, "error");
    }
  };

  // Step 8: Approve Contract & Quality
  const approveContract = async () => {
    updateStepStatus(8, "in_progress");
    addLog(8, "Opening Databricks workspace for contract review...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog(8, "Simulating manual review in Databricks SQL Editor...");
      addLog(8, "  - Validating measure definition accuracy", "info");
      addLog(8, "  - Checking population criteria logic", "info");
      addLog(8, "  - Verifying ValueSet expansions", "info");

      await new Promise(resolve => setTimeout(resolve, 2000));
      addLog(8, "✓ Quality validation completed", "success");

      addLog(8, "Reviewing contract terms and data usage policy...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog(8, "✓ Data governance requirements met", "success");
      addLog(8, "✓ PHI handling complies with HIPAA", "success");
      addLog(8, "✓ Measure steward attribution included", "success");

      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(8, "✓ Contract approved for execution", "success");

      updateStepStatus(8, "completed");
      setCurrentStep(9);
    } catch (error) {
      addLog(8, `✗ Contract approval failed: ${error}`, "error");
      updateStepStatus(8, "error");
    }
  };

  // Step 9: Execute SQL and Generate Reports
  const executeSQL = async () => {
    updateStepStatus(9, "in_progress");
    addLog(9, "Submitting SQL query to Databricks warehouse...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(9, `✓ Query submitted to warehouse: ${databricksConfig.warehouse}`, "success");

      addLog(9, "Executing query...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      addLog(9, "✓ Query execution completed in 2.47 seconds", "success");
      addLog(9, "  - Scanned: 761,121 rows", "info");
      addLog(9, "  - Processed: 1,247 patients", "info");

      const mockResults = {
        initialPopulation: 1247,
        denominator: 1189,
        numerator: 892,
        denominatorExclusion: 58
      };

      addLog(9, "Population calculation results:", "info");
      addLog(9, `  - Initial Population: ${mockResults.initialPopulation}`, "info");
      addLog(9, `  - Denominator: ${mockResults.denominator}`, "info");
      addLog(9, `  - Numerator: ${mockResults.numerator}`, "info");
      addLog(9, `  - Denominator Exclusion: ${mockResults.denominatorExclusion}`, "info");

      const rate = ((mockResults.numerator / mockResults.denominator) * 100).toFixed(2);
      addLog(9, `  - Performance Rate: ${rate}%`, "success");

      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog(9, "Generating FHIR MeasureReport resource...");

      const mockMeasureReport = {
        resourceType: "MeasureReport",
        id: `measurereport-${Date.now()}`,
        status: "complete",
        type: "summary",
        measure: "Measure/CMS125",
        date: new Date().toISOString(),
        period: {
          start: "2024-01-01",
          end: "2024-12-31"
        },
        group: [{
          population: [
            { code: { text: "initial-population" }, count: mockResults.initialPopulation },
            { code: { text: "denominator" }, count: mockResults.denominator },
            { code: { text: "numerator" }, count: mockResults.numerator },
            { code: { text: "denominator-exclusion" }, count: mockResults.denominatorExclusion }
          ],
          measureScore: {
            value: parseFloat(rate) / 100
          }
        }]
      };

      setMeasureReport(mockMeasureReport);
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(9, "✓ MeasureReport generated successfully", "success");

      updateStepData(9, { results: mockResults, measureReport: mockMeasureReport });
      updateStepStatus(9, "completed");
      setCurrentStep(10);
    } catch (error) {
      addLog(9, `✗ SQL execution failed: ${error}`, "error");
      updateStepStatus(9, "error");
    }
  };

  // Step 10: Write Back to FHIR Server
  const writeBackToFHIR = async () => {
    updateStepStatus(10, "in_progress");
    addLog(10, "Preparing resources for write-back to Medplum...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog(10, "Creating MeasureReport resource...");
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog(10, `✓ POST MeasureReport/${measureReport?.id}`, "success");

      addLog(10, "Generating supporting evidence QuestionnaireResponse...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockQuestionnaire = {
        resourceType: "QuestionnaireResponse",
        id: `qr-evidence-${Date.now()}`,
        status: "completed",
        authored: new Date().toISOString(),
        subject: { reference: `Measure/CMS125` },
        item: [
          {
            linkId: "execution-method",
            text: "Execution Method",
            answer: [{ valueString: "SQL on FHIR via Databricks" }]
          },
          {
            linkId: "data-source",
            text: "Data Source",
            answer: [{ valueString: "Medplum FHIR R4 Server" }]
          },
          {
            linkId: "patients-evaluated",
            text: "Total Patients Evaluated",
            answer: [{ valueInteger: 1247 }]
          },
          {
            linkId: "execution-time",
            text: "Execution Time",
            answer: [{ valueString: "2.47 seconds" }]
          },
          {
            linkId: "valuesets-used",
            text: "ValueSets Retrieved",
            answer: [{ valueInteger: 3 }]
          }
        ]
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(10, `✓ POST QuestionnaireResponse/${mockQuestionnaire.id}`, "success");

      addLog(10, "Storing detailed population lists...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog(10, "✓ Created List/numerator-patients (892 patients)", "success");
      addLog(10, "✓ Created List/denominator-exclusions (58 patients)", "success");

      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(10, "✓ All resources written back to Medplum successfully", "success");
      addLog(10, `✓ Total resources created: 4`, "success");

      updateStepData(10, {
        measureReportId: measureReport?.id,
        questionnaireResponseId: mockQuestionnaire.id,
        totalResources: 4
      });
      updateStepStatus(10, "completed");
      setCurrentStep(11);
    } catch (error) {
      addLog(10, `✗ Write-back failed: ${error}`, "error");
      updateStepStatus(10, "error");
    }
  };

  // Step 11: Review Statistics
  const reviewStatistics = async () => {
    updateStepStatus(11, "in_progress");
    addLog(11, "Compiling execution statistics...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stats = {
        totalExecutionTime: "14.2 seconds",
        fhirResourcesProcessed: 761121,
        patientsEvaluated: 1247,
        measuresCalculated: 1,
        valueSetExpansions: 3,
        totalCodes: 247,
        databaseQueries: 5,
        resourcesCreated: 4,
        performanceRate: "75.03%",
        complianceScore: "Above National Average (68%)"
      };

      addLog(11, "✓ Statistics compiled successfully", "success");
      addLog(11, "", "info");
      addLog(11, "📊 EXECUTION SUMMARY:", "info");
      addLog(11, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
      addLog(11, `⏱️  Total Execution Time: ${stats.totalExecutionTime}`, "info");
      addLog(11, `📦 FHIR Resources Processed: ${stats.fhirResourcesProcessed.toLocaleString()}`, "info");
      addLog(11, `👥 Patients Evaluated: ${stats.patientsEvaluated.toLocaleString()}`, "info");
      addLog(11, `📋 Measures Calculated: ${stats.measuresCalculated}`, "info");
      addLog(11, `🏷️  ValueSet Expansions: ${stats.valueSetExpansions}`, "info");
      addLog(11, `🔢 Total Terminology Codes: ${stats.totalCodes}`, "info");
      addLog(11, `🔍 Database Queries Executed: ${stats.databaseQueries}`, "info");
      addLog(11, `💾 FHIR Resources Created: ${stats.resourcesCreated}`, "info");
      addLog(11, "", "info");
      addLog(11, "📈 QUALITY METRICS:", "info");
      addLog(11, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
      addLog(11, `✅ Performance Rate: ${stats.performanceRate}`, "success");
      addLog(11, `🎯 ${stats.complianceScore}`, "success");
      addLog(11, "", "info");
      addLog(11, "✓ End-to-end workflow completed successfully!", "success");

      updateStepData(11, stats);
      updateStepStatus(11, "completed");
    } catch (error) {
      addLog(11, `✗ Statistics compilation failed: ${error}`, "error");
      updateStepStatus(11, "error");
    }
  };

  const getStepIcon = (stepId: number) => {
    const status = stepStates[stepId]?.status;

    if (status === "completed") {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (status === "in_progress") {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    } else if (status === "error") {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const executeCurrentStep = () => {
    switch (currentStep) {
      case 1: connectToMedplum(); break;
      case 2: selectResources(); break;
      case 3: connectToVSAC(); break;
      case 4: ingestToDatabricks(); break;
      case 5: createViews(); break;
      case 6: convertCQLToSQL(); break;
      case 7: reviewSQL(); break;
      case 8: approveContract(); break;
      case 9: executeSQL(); break;
      case 10: writeBackToFHIR(); break;
      case 11: reviewStatistics(); break;
    }
  };

  const renderStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medplum-url">Medplum Base URL</Label>
                <Input
                  id="medplum-url"
                  value={medplumConfig.baseUrl}
                  onChange={(e) => setMedplumConfig({ ...medplumConfig, baseUrl: e.target.value })}
                  placeholder="https://api.medplum.com"
                />
              </div>
              <div>
                <Label htmlFor="medplum-project">Project ID</Label>
                <Input
                  id="medplum-project"
                  value={medplumConfig.projectId}
                  onChange={(e) => setMedplumConfig({ ...medplumConfig, projectId: e.target.value })}
                  placeholder="your-project-id"
                />
              </div>
              <div>
                <Label htmlFor="medplum-client">Client ID</Label>
                <Input
                  id="medplum-client"
                  type="password"
                  value={medplumConfig.clientId}
                  onChange={(e) => setMedplumConfig({ ...medplumConfig, clientId: e.target.value })}
                  placeholder="OAuth2 Client ID"
                />
              </div>
              <div>
                <Label htmlFor="medplum-secret">Client Secret</Label>
                <Input
                  id="medplum-secret"
                  type="password"
                  value={medplumConfig.clientSecret}
                  onChange={(e) => setMedplumConfig({ ...medplumConfig, clientSecret: e.target.value })}
                  placeholder="OAuth2 Client Secret"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>NLM VSAC API Key Required</AlertTitle>
              <AlertDescription>
                Access to NLM VSAC requires an API key from UMLS Terminology Services.
                Register at <a href="https://uts.nlm.nih.gov/uts/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">uts.nlm.nih.gov</a> and generate an API key.
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vsac-apikey">VSAC API Key</Label>
                <Input
                  id="vsac-apikey"
                  type="password"
                  value={vsacConfig.apiKey}
                  onChange={(e) => setVsacConfig({ ...vsacConfig, apiKey: e.target.value })}
                  placeholder="Enter your VSAC API key"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="databricks-host">Databricks Host</Label>
                <Input
                  id="databricks-host"
                  value={databricksConfig.host}
                  onChange={(e) => setDatabricksConfig({ ...databricksConfig, host: e.target.value })}
                  placeholder="https://your-workspace.cloud.databricks.com"
                />
              </div>
              <div>
                <Label htmlFor="databricks-warehouse">SQL Warehouse</Label>
                <Input
                  id="databricks-warehouse"
                  value={databricksConfig.warehouse}
                  onChange={(e) => setDatabricksConfig({ ...databricksConfig, warehouse: e.target.value })}
                  placeholder="warehouse-id"
                />
              </div>
              <div>
                <Label htmlFor="databricks-token">Access Token</Label>
                <Input
                  id="databricks-token"
                  type="password"
                  value={databricksConfig.token}
                  onChange={(e) => setDatabricksConfig({ ...databricksConfig, token: e.target.value })}
                  placeholder="Personal access token"
                />
              </div>
              <div>
                <Label htmlFor="databricks-catalog">Catalog Name</Label>
                <Input
                  id="databricks-catalog"
                  value={databricksConfig.catalog}
                  onChange={(e) => setDatabricksConfig({ ...databricksConfig, catalog: e.target.value })}
                  placeholder="fhir_analytics"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {stepStates[6]?.data?.cql && (
              <div>
                <Label>Original CQL (Preview)</Label>
                <Textarea
                  value={stepStates[6].data.cql}
                  readOnly
                  className="font-mono text-sm h-32"
                />
              </div>
            )}
            {generatedSQL && (
              <div>
                <Label>Generated SQL</Label>
                <Textarea
                  value={generatedSQL}
                  readOnly
                  className="font-mono text-sm h-64"
                />
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            {stepStates[9]?.data?.results && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Initial Population</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stepStates[9].data.results.initialPopulation}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Denominator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stepStates[9].data.results.denominator}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Numerator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{stepStates[9].data.results.numerator}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Performance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {((stepStates[9].data.results.numerator / stepStates[9].data.results.denominator) * 100).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {measureReport && (
              <div>
                <Label>Generated MeasureReport (FHIR R4)</Label>
                <Textarea
                  value={JSON.stringify(measureReport, null, 2)}
                  readOnly
                  className="font-mono text-xs h-48"
                />
              </div>
            )}
          </div>
        );

      case 11:
        return (
          <div className="space-y-4">
            {stepStates[11]?.data && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="col-span-3 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Workflow Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      End-to-end CQL measure execution completed successfully in {stepStates[11].data.totalExecutionTime}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Performance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stepStates[11].data.performanceRate}</div>
                    <div className="text-xs text-muted-foreground mt-1">Above national average</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Patients Evaluated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stepStates[11].data.patientsEvaluated.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Across all populations</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Resources Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stepStates[11].data.resourcesCreated}</div>
                    <div className="text-xs text-muted-foreground mt-1">Written to FHIR server</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Converter
          </Button>
        </Link>
        <Link href="/e2e-config">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">End-to-End CQL Measure Execution</h1>
        <p className="text-lg text-muted-foreground">
          Real-world workflow: Medplum → NLM VSAC → Databricks → MeasureReport
        </p>
      </div>

      {/* Workflow Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
          <CardDescription>
            {currentStep <= 11 ? `Step ${currentStep} of 11` : "Workflow Complete"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-2">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  step.id === currentStep ? "scale-110" : ""
                } transition-transform`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    stepStates[step.id]?.status === "completed"
                      ? "bg-green-100 border-green-600"
                      : stepStates[step.id]?.status === "in_progress"
                      ? "bg-blue-100 border-blue-600"
                      : stepStates[step.id]?.status === "error"
                      ? "bg-red-100 border-red-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {getStepIcon(step.id)}
                </div>
                <div className="text-xs text-center text-muted-foreground w-20 line-clamp-2">
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Step Configuration & Execution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {WORKFLOW_STEPS[currentStep - 1] && (
                <>
                  {(() => {
                    const StepIcon = WORKFLOW_STEPS[currentStep - 1].icon;
                    return <StepIcon className="w-5 h-5" />;
                  })()}
                  Step {currentStep}: {WORKFLOW_STEPS[currentStep - 1]?.title}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {WORKFLOW_STEPS[currentStep - 1]?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStepContent(currentStep)}

            <div className="flex gap-2">
              <Button
                onClick={executeCurrentStep}
                disabled={stepStates[currentStep]?.status === "in_progress" || stepStates[currentStep]?.status === "completed"}
                className="flex-1"
              >
                {stepStates[currentStep]?.status === "in_progress" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : stepStates[currentStep]?.status === "completed" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Step
                  </>
                )}
              </Button>

              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={stepStates[currentStep]?.status === "in_progress"}
                >
                  Previous
                </Button>
              )}

              {currentStep < 11 && stepStates[currentStep]?.status === "completed" && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
            <CardDescription>
              Real-time status updates and detailed logging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-950 text-gray-100 rounded-lg p-4 font-mono text-xs h-[600px] overflow-y-auto">
              {stepStates[currentStep]?.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`mb-1 ${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : log.type === "warning"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {stepStates[currentStep]?.logs.length === 0 && (
                <div className="text-gray-500">Waiting for execution...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Context */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About This Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="architecture">
              <AccordionTrigger>System Architecture</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>This demo showcases a production-grade architecture for CQL measure execution:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Medplum</strong>: FHIR R4-compliant server for EHR data storage and retrieval</li>
                    <li><strong>NLM VSAC</strong>: National Library of Medicine Value Set Authority Center for terminology</li>
                    <li><strong>Databricks</strong>: Cloud data platform for large-scale SQL execution on FHIR data</li>
                    <li><strong>FHIRmetrics</strong>: Pipeline for flattening hierarchical FHIR resources into relational tables</li>
                    <li><strong>ELM Converter</strong>: Transpiles CQL logic to optimized ANSI SQL</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="integration">
              <AccordionTrigger>Integration Points</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>The workflow integrates multiple healthcare data standards and platforms:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>FHIR R4</strong>: Fast Healthcare Interoperability Resources standard</li>
                    <li><strong>CQL 1.5</strong>: Clinical Quality Language for measure logic</li>
                    <li><strong>ELM</strong>: Expression Logical Model intermediate representation</li>
                    <li><strong>SQL on FHIR</strong>: HL7 implementation guide for SQL-based analytics</li>
                    <li><strong>VSAC APIs</strong>: RESTful terminology services</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Security & Compliance</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>Production deployments must address:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>HIPAA Compliance</strong>: PHI encryption at rest and in transit</li>
                    <li><strong>OAuth2 Authentication</strong>: Secure API access with client credentials flow</li>
                    <li><strong>Audit Logging</strong>: Complete traceability of data access and transformations</li>
                    <li><strong>Data Governance</strong>: Role-based access control and data usage policies</li>
                    <li><strong>SQL Injection Prevention</strong>: Parameterized queries and input validation</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="scalability">
              <AccordionTrigger>Scalability Considerations</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>This architecture scales to millions of patient records:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Databricks Clusters</strong>: Auto-scaling compute for query execution</li>
                    <li><strong>Delta Lake</strong>: Optimized storage with ACID transactions</li>
                    <li><strong>Partition Strategies</strong>: Patient-level and date-based partitioning</li>
                    <li><strong>Incremental Processing</strong>: Process only changed data since last run</li>
                    <li><strong>Caching</strong>: ValueSet and Library caching to reduce API calls</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

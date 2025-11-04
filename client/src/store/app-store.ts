/**
 * Application State Management using Zustand
 *
 * Manages the complete workflow state for the FHIR Query Converter:
 * 1. FHIR Server Connection
 * 2. CQL Library Management
 * 3. Terminology Server Connection
 * 4. Execution & Measure Reports
 * 5. SQL Translation
 * 6. Database Connection
 * 7. Write-Back to FHIR
 * 8. View Definition Management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface FhirServerConnection {
  baseUrl: string;
  projectId?: string;
  isConnected: boolean;
  accessToken?: string;
  user?: {
    email: string;
    name?: string;
  };
}

export interface CqlLibrary {
  id: string;
  name: string;
  version?: string;
  content: string;
  url?: string;
  status: 'active' | 'draft' | 'retired';
  dependencies?: string[];
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
  };
}

export interface TerminologyServerConnection {
  baseUrl: string;
  isConnected: boolean;
  expandedValueSets: Map<string, ValueSetExpansion>;
}

export interface ValueSetExpansion {
  url: string;
  version?: string;
  contains: Array<{
    system: string;
    code: string;
    display?: string;
  }>;
  count: number;
}

export interface MeasureReport {
  id?: string;
  resourceType: 'MeasureReport';
  status: 'complete' | 'pending' | 'error';
  type: 'summary' | 'subject-list' | 'data-collection';
  measure: string;
  period: {
    start: string;
    end: string;
  };
  group: Array<{
    id?: string;
    population?: Array<{
      code: {
        text: string;
      };
      count: number;
    }>;
    measureScore?: {
      value: number;
    };
  }>;
  evaluatedResources?: any;
  meta?: {
    source?: 'cql' | 'sql';
    executionTime?: number;
  };
}

export interface DatabaseConnection {
  type: 'duckdb' | 'databricks' | null;
  isConnected: boolean;
  config?: {
    // DuckDB
    dbPath?: string;
    // Databricks
    serverHostname?: string;
    httpPath?: string;
    token?: string;
  };
}

export interface ViewDefinition {
  id?: string;
  resourceType: 'ViewDefinition';
  url: string;
  name: string;
  status: 'active' | 'draft';
  resource: string;
  select: Array<{
    column: Array<{
      path: string;
      name: string;
      type?: string;
    }>;
  }>;
  where?: Array<{
    path: string;
    equals?: any;
  }>;
}

export type WorkflowStep =
  | 'fhir-connection'
  | 'library-loading'
  | 'terminology-connection'
  | 'execution'
  | 'sql-translation'
  | 'database-connection'
  | 'writeback'
  | 'view-management';

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  canProceed: boolean;
}

// ============================================================================
// Store Interface
// ============================================================================

interface AppState {
  // Workflow State
  workflow: WorkflowState;
  setCurrentStep: (step: WorkflowStep) => void;
  markStepComplete: (step: WorkflowStep) => void;
  resetWorkflow: () => void;

  // FHIR Server Connection (Step 1)
  fhirServer: FhirServerConnection;
  connectToFhirServer: (baseUrl: string, projectId?: string) => void;
  setFhirAccessToken: (token: string, user?: any) => void;
  disconnectFhirServer: () => void;
  disconnectFromFhirServer: () => void; // Alias for disconnectFhirServer

  // CQL Library Management (Step 2)
  libraries: CqlLibrary[];
  selectedLibrary: CqlLibrary | null;
  addLibrary: (library: CqlLibrary) => void;
  removeLibrary: (id: string) => void;
  selectLibrary: (id: string) => void;
  clearLibraries: () => void;

  // Terminology Server Connection (Step 3)
  terminologyServer: TerminologyServerConnection;
  connectToTerminologyServer: (baseUrl: string) => void;
  addValueSetExpansion: (url: string, expansion: ValueSetExpansion) => void;
  disconnectTerminologyServer: () => void;

  // Execution & Measure Reports (Step 4)
  measurementPeriod: { start: string; end: string };
  setMeasurementPeriod: (period: { start: string; end: string }) => void;
  cqlMeasureReport: MeasureReport | null;
  setCqlMeasureReport: (report: MeasureReport) => void;

  // SQL Translation (Step 5)
  generatedSql: string | null;
  setGeneratedSql: (sql: string) => void;
  sqlMeasureReport: MeasureReport | null;
  setSqlMeasureReport: (report: MeasureReport) => void;

  // Database Connection (Step 6)
  database: DatabaseConnection;
  connectToDatabase: (
    type: 'duckdb' | 'databricks',
    config: DatabaseConnection['config']
  ) => void;
  disconnectDatabase: () => void;

  // Write-Back to FHIR (Step 7)
  postedResources: Array<{
    resourceType: string;
    id: string;
    url?: string;
  }>;
  addPostedResource: (resource: {
    resourceType: string;
    id: string;
    url?: string;
  }) => void;

  // View Definition Management (Step 8)
  viewDefinitions: ViewDefinition[];
  addViewDefinition: (view: ViewDefinition) => void;
  removeViewDefinition: (id: string) => void;

  // Error Handling
  errors: Array<{ step: WorkflowStep; message: string; timestamp: number }>;
  addError: (step: WorkflowStep, message: string) => void;
  clearErrors: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial Workflow State
      workflow: {
        currentStep: 'fhir-connection',
        completedSteps: new Set(),
        canProceed: false,
      },

      setCurrentStep: (step) =>
        set((state) => ({
          workflow: { ...state.workflow, currentStep: step },
        })),

      markStepComplete: (step) =>
        set((state) => {
          const newCompletedSteps = new Set(state.workflow.completedSteps);
          newCompletedSteps.add(step);
          return {
            workflow: {
              ...state.workflow,
              completedSteps: newCompletedSteps,
              canProceed: true,
            },
          };
        }),

      resetWorkflow: () =>
        set({
          workflow: {
            currentStep: 'fhir-connection',
            completedSteps: new Set(),
            canProceed: false,
          },
        }),

      // FHIR Server Connection
      fhirServer: {
        baseUrl: 'https://api.medplum.com',
        isConnected: false,
      },

      connectToFhirServer: (baseUrl, projectId) =>
        set({
          fhirServer: {
            baseUrl,
            projectId,
            isConnected: false, // Will be set to true after authentication
          },
        }),

      setFhirAccessToken: (token, user) =>
        set((state) => ({
          fhirServer: {
            ...state.fhirServer,
            isConnected: true,
            accessToken: token,
            user,
          },
        })),

      disconnectFhirServer: () =>
        set({
          fhirServer: {
            baseUrl: 'https://api.medplum.com',
            isConnected: false,
          },
        }),

      disconnectFromFhirServer: function() {
        return this.disconnectFhirServer();
      },

      // CQL Library Management
      libraries: [],
      selectedLibrary: null,

      addLibrary: (library) =>
        set((state) => ({
          libraries: [...state.libraries, library],
        })),

      removeLibrary: (id) =>
        set((state) => ({
          libraries: state.libraries.filter((lib) => lib.id !== id),
          selectedLibrary:
            state.selectedLibrary?.id === id ? null : state.selectedLibrary,
        })),

      selectLibrary: (id) =>
        set((state) => ({
          selectedLibrary:
            state.libraries.find((lib) => lib.id === id) || null,
        })),

      clearLibraries: () =>
        set({
          libraries: [],
          selectedLibrary: null,
        }),

      // Terminology Server Connection
      terminologyServer: {
        baseUrl: 'https://tx.fhir.org/r4',
        isConnected: false,
        expandedValueSets: new Map(),
      },

      connectToTerminologyServer: (baseUrl) =>
        set((state) => ({
          terminologyServer: {
            ...state.terminologyServer,
            baseUrl,
            isConnected: true,
          },
        })),

      addValueSetExpansion: (url, expansion) =>
        set((state) => {
          const newMap = new Map(state.terminologyServer.expandedValueSets);
          newMap.set(url, expansion);
          return {
            terminologyServer: {
              ...state.terminologyServer,
              expandedValueSets: newMap,
            },
          };
        }),

      disconnectTerminologyServer: () =>
        set((state) => ({
          terminologyServer: {
            ...state.terminologyServer,
            isConnected: false,
          },
        })),

      // Execution & Measure Reports
      measurementPeriod: {
        start: new Date(
          new Date().getFullYear(),
          0,
          1
        ).toISOString(),
        end: new Date(
          new Date().getFullYear(),
          11,
          31
        ).toISOString(),
      },

      setMeasurementPeriod: (period) =>
        set({
          measurementPeriod: period,
        }),

      cqlMeasureReport: null,
      setCqlMeasureReport: (report) =>
        set({
          cqlMeasureReport: report,
        }),

      // SQL Translation
      generatedSql: null,
      setGeneratedSql: (sql) =>
        set({
          generatedSql: sql,
        }),

      sqlMeasureReport: null,
      setSqlMeasureReport: (report) =>
        set({
          sqlMeasureReport: report,
        }),

      // Database Connection
      database: {
        type: null,
        isConnected: false,
      },

      connectToDatabase: (type, config) =>
        set({
          database: {
            type,
            isConnected: true,
            config,
          },
        }),

      disconnectDatabase: () =>
        set({
          database: {
            type: null,
            isConnected: false,
          },
        }),

      // Write-Back to FHIR
      postedResources: [],

      addPostedResource: (resource) =>
        set((state) => ({
          postedResources: [...state.postedResources, resource],
        })),

      // View Definition Management
      viewDefinitions: [],

      addViewDefinition: (view) =>
        set((state) => ({
          viewDefinitions: [...state.viewDefinitions, view],
        })),

      removeViewDefinition: (id) =>
        set((state) => ({
          viewDefinitions: state.viewDefinitions.filter((v) => v.id !== id),
        })),

      // Error Handling
      errors: [],

      addError: (step, message) =>
        set((state) => ({
          errors: [
            ...state.errors,
            { step, message, timestamp: Date.now() },
          ],
        })),

      clearErrors: () =>
        set({
          errors: [],
        }),
    }),
    {
      name: 'fhir-query-converter-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only non-sensitive data
        fhirServer: {
          baseUrl: state.fhirServer.baseUrl,
          projectId: state.fhirServer.projectId,
          // Do NOT persist accessToken or user
        },
        terminologyServer: {
          baseUrl: state.terminologyServer.baseUrl,
          // Do NOT persist expanded value sets (too large)
        },
        measurementPeriod: state.measurementPeriod,
        database: {
          type: state.database.type,
          // Do NOT persist connection config (may contain credentials)
        },
      }),
    }
  )
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectCurrentStep = (state: AppState) => state.workflow.currentStep;
export const selectIsStepComplete = (step: WorkflowStep) => (state: AppState) =>
  state.workflow.completedSteps.has(step);
export const selectCanProceed = (state: AppState) => state.workflow.canProceed;
export const selectFhirConnected = (state: AppState) => state.fhirServer.isConnected;
export const selectSelectedLibrary = (state: AppState) => state.selectedLibrary;
export const selectTerminologyConnected = (state: AppState) =>
  state.terminologyServer.isConnected;
export const selectDatabaseConnected = (state: AppState) => state.database.isConnected;
export const selectHasErrors = (state: AppState) => state.errors.length > 0;

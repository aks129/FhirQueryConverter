export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id?: string;
  type: string;
  entry?: Array<{
    resource: FhirResource;
  }>;
}

export interface Patient extends FhirResource {
  resourceType: "Patient";
  gender?: string;
  birthDate?: string;
  name?: Array<{
    given?: string[];
    family?: string;
  }>;
}

export interface Observation extends FhirResource {
  resourceType: "Observation";
  status: string;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
  };
}

export interface Condition extends FhirResource {
  resourceType: "Condition";
  clinicalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
    }>;
  };
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  onsetDateTime?: string;
}

export interface MeasureReport extends FhirResource {
  resourceType: "MeasureReport";
  status: string;
  type: string;
  measure: string;
  subject?: {
    reference: string;
  };
  date: string;
  reporter?: {
    reference: string;
  };
  period: {
    start: string;
    end: string;
  };
  group: Array<{
    id?: string;
    population: Array<{
      code: {
        coding: Array<{
          system: string;
          code: string;
        }>;
      };
      count: number;
    }>;
  }>;
}

export interface ExecutionResult {
  measureReport: MeasureReport;
  executionTime: number;
  memoryUsage?: number;
  logs: LogEntry[];
}

export interface SqlExecutionResult extends ExecutionResult {
  generatedSql: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
}

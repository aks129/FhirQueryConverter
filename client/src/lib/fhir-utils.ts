import { FhirBundle, FhirResource, Patient, Observation, Condition, Procedure, MedicationRequest, Encounter, DiagnosticReport } from "@/types/fhir";

export function validateFhirBundle(data: any): { isValid: boolean; errors: string[]; bundle?: FhirBundle } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid JSON format');
    return { isValid: false, errors };
  }

  if (data.resourceType !== 'Bundle') {
    errors.push('Resource type must be Bundle');
    return { isValid: false, errors };
  }

  if (!data.entry || !Array.isArray(data.entry)) {
    errors.push('Bundle must contain an entry array');
    return { isValid: false, errors };
  }

  // Validate each entry has a resource
  data.entry.forEach((entry: any, index: number) => {
    if (!entry.resource) {
      errors.push(`Entry ${index} missing resource`);
    } else if (!entry.resource.resourceType) {
      errors.push(`Entry ${index} resource missing resourceType`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    bundle: errors.length === 0 ? data as FhirBundle : undefined
  };
}

export function getBundleStats(bundle: FhirBundle): {
  totalResources: number;
  patients: number;
  observations: number;
  conditions: number;
  procedures: number;
  medicationRequests: number;
  encounters: number;
  diagnosticReports: number;
  sizeKB: number;
} {
  if (!bundle.entry) {
    return { totalResources: 0, patients: 0, observations: 0, conditions: 0, procedures: 0, medicationRequests: 0, encounters: 0, diagnosticReports: 0, sizeKB: 0 };
  }

  const stats = {
    totalResources: bundle.entry.length,
    patients: 0,
    observations: 0,
    conditions: 0,
    procedures: 0,
    medicationRequests: 0,
    encounters: 0,
    diagnosticReports: 0,
    sizeKB: Math.round(JSON.stringify(bundle).length / 1024 * 10) / 10
  };

  bundle.entry.forEach(entry => {
    switch (entry.resource.resourceType) {
      case 'Patient':
        stats.patients++;
        break;
      case 'Observation':
        stats.observations++;
        break;
      case 'Condition':
        stats.conditions++;
        break;
      case 'Procedure':
        stats.procedures++;
        break;
      case 'MedicationRequest':
        stats.medicationRequests++;
        break;
      case 'Encounter':
        stats.encounters++;
        break;
      case 'DiagnosticReport':
        stats.diagnosticReports++;
        break;
    }
  });

  return stats;
}

export function flattenBundleToViews(bundle: FhirBundle): {
  patients: Array<{
    id: string;
    gender?: string;
    birthDate?: string;
    age?: number;
  }>;
  observations: Array<{
    id: string;
    subject_id: string;
    code?: string;
    code_system?: string;
    code_text?: string;
    effective_datetime?: string;
    value_quantity?: number;
    value_unit?: string;
    status?: string;
  }>;
  conditions: Array<{
    id: string;
    subject_id: string;
    code?: string;
    code_system?: string;
    code_text?: string;
    onset_datetime?: string;
    clinical_status?: string;
    verification_status?: string;
  }>;
  procedures: Array<{
    id: string;
    subject_id: string;
    code?: string;
    code_system?: string;
    code_text?: string;
    performed_datetime?: string;
    status?: string;
  }>;
  medicationRequests: Array<{
    id: string;
    subject_id: string;
    medication_code?: string;
    medication_system?: string;
    medication_text?: string;
    authored_on?: string;
    status?: string;
    intent?: string;
  }>;
  encounters: Array<{
    id: string;
    subject_id: string;
    class_code?: string;
    type_text?: string;
    period_start?: string;
    period_end?: string;
    status?: string;
  }>;
  diagnosticReports: Array<{
    id: string;
    subject_id: string;
    code?: string;
    code_system?: string;
    code_text?: string;
    effective_datetime?: string;
    issued?: string;
    status?: string;
  }>;
} {
  if (!bundle.entry) {
    return { patients: [], observations: [], conditions: [], procedures: [], medicationRequests: [], encounters: [], diagnosticReports: [] };
  }

  const patients: any[] = [];
  const observations: any[] = [];
  const conditions: any[] = [];
  const procedures: any[] = [];
  const medicationRequests: any[] = [];
  const encounters: any[] = [];
  const diagnosticReports: any[] = [];

  const currentYear = new Date().getFullYear();

  bundle.entry.forEach(entry => {
    const resource = entry.resource;

    switch (resource.resourceType) {
      case 'Patient':
        const patient = resource as Patient;
        const age = patient.birthDate ? 
          currentYear - new Date(patient.birthDate).getFullYear() : undefined;
        
        patients.push({
          id: patient.id,
          gender: patient.gender,
          birthDate: patient.birthDate,
          age
        });
        break;

      case 'Observation':
        const obs = resource as Observation;
        observations.push({
          id: obs.id,
          subject_id: obs.subject.reference.replace('Patient/', ''),
          code: obs.code.coding?.[0]?.code,
          code_system: obs.code.coding?.[0]?.system,
          code_text: obs.code.text || obs.code.coding?.[0]?.display,
          effective_datetime: obs.effectiveDateTime,
          value_quantity: obs.valueQuantity?.value,
          value_unit: obs.valueQuantity?.unit,
          status: obs.status
        });
        break;

      case 'Condition':
        const condition = resource as Condition;
        conditions.push({
          id: condition.id,
          subject_id: condition.subject.reference.replace('Patient/', ''),
          code: condition.code.coding?.[0]?.code,
          code_system: condition.code.coding?.[0]?.system,
          code_text: condition.code.text || condition.code.coding?.[0]?.display,
          onset_datetime: condition.onsetDateTime,
          clinical_status: condition.clinicalStatus?.coding?.[0]?.code,
          verification_status: condition.verificationStatus?.coding?.[0]?.code
        });
        break;

      case 'Procedure':
        const procedure = resource as Procedure;
        procedures.push({
          id: procedure.id,
          subject_id: procedure.subject.reference.replace('Patient/', ''),
          code: procedure.code.coding?.[0]?.code,
          code_system: procedure.code.coding?.[0]?.system,
          code_text: procedure.code.text || procedure.code.coding?.[0]?.display,
          performed_datetime: procedure.performedDateTime || procedure.performedPeriod?.start,
          status: procedure.status
        });
        break;

      case 'MedicationRequest':
        const medReq = resource as MedicationRequest;
        medicationRequests.push({
          id: medReq.id,
          subject_id: medReq.subject.reference.replace('Patient/', ''),
          medication_code: medReq.medicationCodeableConcept?.coding?.[0]?.code,
          medication_system: medReq.medicationCodeableConcept?.coding?.[0]?.system,
          medication_text: medReq.medicationCodeableConcept?.text ||
                          medReq.medicationCodeableConcept?.coding?.[0]?.display,
          authored_on: medReq.authoredOn,
          status: medReq.status,
          intent: medReq.intent
        });
        break;

      case 'Encounter':
        const encounter = resource as Encounter;
        encounters.push({
          id: encounter.id,
          subject_id: encounter.subject.reference.replace('Patient/', ''),
          class_code: encounter.class.code,
          type_text: encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display,
          period_start: encounter.period?.start,
          period_end: encounter.period?.end,
          status: encounter.status
        });
        break;

      case 'DiagnosticReport':
        const report = resource as DiagnosticReport;
        diagnosticReports.push({
          id: report.id,
          subject_id: report.subject.reference.replace('Patient/', ''),
          code: report.code.coding?.[0]?.code,
          code_system: report.code.coding?.[0]?.system,
          code_text: report.code.text || report.code.coding?.[0]?.display,
          effective_datetime: report.effectiveDateTime || report.effectivePeriod?.start,
          issued: report.issued,
          status: report.status
        });
        break;
    }
  });

  return { patients, observations, conditions, procedures, medicationRequests, encounters, diagnosticReports };
}

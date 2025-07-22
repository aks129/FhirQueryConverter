import { FhirBundle, FhirResource, Patient, Observation, Condition } from "@/types/fhir";

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
  sizeKB: number;
} {
  if (!bundle.entry) {
    return { totalResources: 0, patients: 0, observations: 0, conditions: 0, sizeKB: 0 };
  }

  const stats = {
    totalResources: bundle.entry.length,
    patients: 0,
    observations: 0,
    conditions: 0,
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
    code_text?: string;
    effective_datetime?: string;
    value_quantity?: number;
    value_unit?: string;
  }>;
  conditions: Array<{
    id: string;
    subject_id: string;
    code_text?: string;
    onset_datetime?: string;
    clinical_status?: string;
  }>;
} {
  if (!bundle.entry) {
    return { patients: [], observations: [], conditions: [] };
  }

  const patients: any[] = [];
  const observations: any[] = [];
  const conditions: any[] = [];

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
          code_text: obs.code.text || obs.code.coding?.[0]?.display,
          effective_datetime: obs.effectiveDateTime,
          value_quantity: obs.valueQuantity?.value,
          value_unit: obs.valueQuantity?.unit
        });
        break;

      case 'Condition':
        const condition = resource as Condition;
        conditions.push({
          id: condition.id,
          subject_id: condition.subject.reference.replace('Patient/', ''),
          code_text: condition.code.text || condition.code.coding?.[0]?.display,
          onset_datetime: condition.onsetDateTime,
          clinical_status: condition.clinicalStatus?.coding?.[0]?.code
        });
        break;
    }
  });

  return { patients, observations, conditions };
}

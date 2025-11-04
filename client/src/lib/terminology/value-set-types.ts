/**
 * Value Set and Code System Types
 * Following HL7 FHIR Terminology Service specification
 */

export interface ValueSetReference {
  /** Canonical URL of the value set */
  url: string;
  /** Version of the value set (optional) */
  version?: string;
  /** Display name for documentation */
  display?: string;
}

export interface CodeSystemReference {
  /** Canonical URL of the code system */
  url: string;
  /** Version of the code system (optional) */
  version?: string;
}

export interface Coding {
  /** Code system URL (e.g., "http://loinc.org") */
  system: string;
  /** Code value (e.g., "8867-4") */
  code: string;
  /** Display name */
  display?: string;
  /** Version of the code system */
  version?: string;
}

export interface ValueSetExpansion {
  /** Canonical URL of the value set */
  valueSetUrl: string;
  /** Version */
  version?: string;
  /** Expansion timestamp */
  timestamp: string;
  /** Total number of concepts */
  total: number;
  /** Expanded codes */
  contains: Coding[];
}

/**
 * Known code systems with their canonical URLs
 */
export const KNOWN_CODE_SYSTEMS: { [key: string]: string } = {
  'LOINC': 'http://loinc.org',
  'SNOMED': 'http://snomed.info/sct',
  'SNOMED-CT': 'http://snomed.info/sct',
  'RxNorm': 'http://www.nlm.nih.gov/research/umls/rxnorm',
  'CPT': 'http://www.ama-assn.org/go/cpt',
  'ICD-10-CM': 'http://hl7.org/fhir/sid/icd-10-cm',
  'ICD-10': 'http://hl7.org/fhir/sid/icd-10',
  'CVX': 'http://hl7.org/fhir/sid/cvx',
  'NDC': 'http://hl7.org/fhir/sid/ndc',
};

/**
 * Parse a value set URL from various formats
 */
export function parseValueSetUrl(input: string): ValueSetReference {
  // Handle various formats:
  // 1. Full URL: "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001"
  // 2. OID: "2.16.840.1.113883.3.464.1003.103.12.1001"
  // 3. Short name: "Diabetes"

  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Full URL
    return { url: input };
  }

  if (/^\d+(\.\d+)+$/.test(input)) {
    // OID format - convert to VSAC URL
    return {
      url: `http://cts.nlm.nih.gov/fhir/ValueSet/${input}`,
    };
  }

  // Short name - assume it's a local value set
  return {
    url: input,
    display: input,
  };
}

/**
 * Utility to check if a string is a canonical URL
 */
export function isCanonicalUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('urn:');
}

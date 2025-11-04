/**
 * Database Schema Initialization
 * Creates tables for FHIR resources and terminology
 */

export const FHIR_SCHEMA_SQL = `
-- Value Set Expansion Table for terminology services
CREATE TABLE IF NOT EXISTS ValueSetExpansion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value_set_url TEXT NOT NULL,
  version TEXT,
  code TEXT NOT NULL,
  system TEXT NOT NULL,
  display TEXT,
  UNIQUE(value_set_url, code, system)
);

CREATE INDEX IF NOT EXISTS idx_vse_url ON ValueSetExpansion(value_set_url);
CREATE INDEX IF NOT EXISTS idx_vse_code ON ValueSetExpansion(code, system);

-- Enhanced Patient table with proper columns
CREATE TABLE IF NOT EXISTS Patient (
  id TEXT PRIMARY KEY,
  gender TEXT,
  birthDate TEXT,
  age INTEGER
);

-- Enhanced Observation table with code system support
CREATE TABLE IF NOT EXISTS Observation (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  code TEXT,
  code_system TEXT,
  code_text TEXT,
  effective_datetime TEXT,
  value_quantity REAL,
  value_unit TEXT,
  status TEXT DEFAULT 'final',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_obs_subject ON Observation(subject_id);
CREATE INDEX IF NOT EXISTS idx_obs_code ON Observation(code, code_system);
CREATE INDEX IF NOT EXISTS idx_obs_status ON Observation(status);

-- Enhanced Condition table
CREATE TABLE IF NOT EXISTS Condition (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  code TEXT,
  code_system TEXT,
  code_text TEXT,
  onset_datetime TEXT,
  clinical_status TEXT DEFAULT 'active',
  verification_status TEXT DEFAULT 'confirmed',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_cond_subject ON Condition(subject_id);
CREATE INDEX IF NOT EXISTS idx_cond_code ON Condition(code, code_system);
CREATE INDEX IF NOT EXISTS idx_cond_status ON Condition(clinical_status);

-- Enhanced Procedure table
CREATE TABLE IF NOT EXISTS Procedure (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  code TEXT,
  code_system TEXT,
  code_text TEXT,
  performed_datetime TEXT,
  status TEXT DEFAULT 'completed',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_proc_subject ON Procedure(subject_id);
CREATE INDEX IF NOT EXISTS idx_proc_code ON Procedure(code, code_system);
CREATE INDEX IF NOT EXISTS idx_proc_status ON Procedure(status);

-- Enhanced MedicationRequest table
CREATE TABLE IF NOT EXISTS MedicationRequest (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  medication_code TEXT,
  medication_system TEXT,
  medication_text TEXT,
  authored_on TEXT,
  status TEXT DEFAULT 'active',
  intent TEXT DEFAULT 'order',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_med_subject ON MedicationRequest(subject_id);
CREATE INDEX IF NOT EXISTS idx_med_code ON MedicationRequest(medication_code, medication_system);

-- Enhanced Encounter table
CREATE TABLE IF NOT EXISTS Encounter (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  class_code TEXT,
  type_text TEXT,
  period_start TEXT,
  period_end TEXT,
  status TEXT DEFAULT 'finished',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_enc_subject ON Encounter(subject_id);
CREATE INDEX IF NOT EXISTS idx_enc_status ON Encounter(status);

-- Enhanced DiagnosticReport table
CREATE TABLE IF NOT EXISTS DiagnosticReport (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  code TEXT,
  code_system TEXT,
  code_text TEXT,
  effective_datetime TEXT,
  issued TEXT,
  status TEXT DEFAULT 'final',
  FOREIGN KEY (subject_id) REFERENCES Patient(id)
);

CREATE INDEX IF NOT EXISTS idx_diag_subject ON DiagnosticReport(subject_id);
CREATE INDEX IF NOT EXISTS idx_diag_code ON DiagnosticReport(code, code_system);
`;

/**
 * Sample value set expansions for common code systems
 */
export const SAMPLE_VALUE_SET_EXPANSIONS = `
-- Heart Rate codes (LOINC and SNOMED)
INSERT OR IGNORE INTO ValueSetExpansion (value_set_url, code, system, display)
VALUES
  ('http://example.org/fhir/ValueSet/heart-rate-codes', '8867-4', 'http://loinc.org', 'Heart rate'),
  ('http://example.org/fhir/ValueSet/heart-rate-codes', '364075005', 'http://snomed.info/sct', 'Heart rate (observable entity)'),
  ('http://example.org/fhir/ValueSet/heart-rate-codes', '8893-0', 'http://loinc.org', 'Heart rate by Pulse oximetry');

-- Diabetes Value Set (SNOMED)
INSERT OR IGNORE INTO ValueSetExpansion (value_set_url, version, code, system, display)
VALUES
  ('http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001', '20210220', '44054006', 'http://snomed.info/sct', 'Diabetes mellitus type 2 (disorder)'),
  ('http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001', '20210220', '46635009', 'http://snomed.info/sct', 'Diabetes mellitus type 1 (disorder)'),
  ('http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001', '20210220', '73211009', 'http://snomed.info/sct', 'Diabetes mellitus (disorder)');

-- BMI codes (LOINC)
INSERT OR IGNORE INTO ValueSetExpansion (value_set_url, code, system, display)
VALUES
  ('http://example.org/fhir/ValueSet/bmi-codes', '39156-5', 'http://loinc.org', 'Body mass index (BMI) [Ratio]');

-- Colonoscopy codes (SNOMED and CPT)
INSERT OR IGNORE INTO ValueSetExpansion (value_set_url, code, system, display)
VALUES
  ('http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.108.12.1020', '73761001', 'http://snomed.info/sct', 'Colonoscopy (procedure)'),
  ('http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.108.12.1020', '44388', 'http://www.ama-assn.org/go/cpt', 'Colonoscopy through stoma');
`;

/**
 * Initialize database with schema and sample data
 */
export async function initializeDatabase(db: any): Promise<void> {
  // Create schema
  await db.exec(FHIR_SCHEMA_SQL);

  // Load sample value set expansions
  await db.exec(SAMPLE_VALUE_SET_EXPANSIONS);
}

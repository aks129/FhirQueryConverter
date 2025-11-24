-- Create All Bronze Layer Tables
-- Run this after setup-catalog.sql

USE CATALOG fhir_analytics;
USE SCHEMA bronze;

-- ============================================
-- Patient Table
-- ============================================
CREATE TABLE IF NOT EXISTS patient (
  id STRING NOT NULL COMMENT 'FHIR Resource ID',
  identifier_system STRING COMMENT 'Identifier system (e.g., MRN)',
  identifier_value STRING COMMENT 'Identifier value',
  name_family STRING COMMENT 'Family name (last name)',
  name_given ARRAY<STRING> COMMENT 'Given names (first, middle)',
  gender STRING COMMENT 'Administrative gender',
  birthdate DATE COMMENT 'Date of birth',
  deceased_boolean BOOLEAN COMMENT 'Deceased indicator',
  deceased_datetime TIMESTAMP COMMENT 'Date/time of death',
  address_line ARRAY<STRING> COMMENT 'Street address lines',
  address_city STRING COMMENT 'City',
  address_state STRING COMMENT 'State/Province',
  address_postal_code STRING COMMENT 'Postal/ZIP code',
  address_country STRING COMMENT 'Country',
  telecom_phone STRING COMMENT 'Phone number',
  telecom_email STRING COMMENT 'Email address',
  active BOOLEAN COMMENT 'Whether record is active',
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'ETL load timestamp',
  CONSTRAINT patient_pk PRIMARY KEY(id)
)
COMMENT 'Flattened Patient resources from Medplum FHIR server'
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- ============================================
-- Encounter Table
-- ============================================
CREATE TABLE IF NOT EXISTS encounter (
  id STRING NOT NULL COMMENT 'FHIR Resource ID',
  patient_id STRING NOT NULL COMMENT 'Reference to Patient',
  status STRING COMMENT 'planned | arrived | triaged | in-progress | finished | cancelled',
  class_system STRING COMMENT 'Classification system',
  class_code STRING COMMENT 'Classification code (e.g., AMB, IMP)',
  class_display STRING COMMENT 'Classification display text',
  type_system STRING COMMENT 'Type code system',
  type_code STRING COMMENT 'Type code (e.g., CPT)',
  type_display STRING COMMENT 'Type display text',
  period_start TIMESTAMP COMMENT 'Start time',
  period_end TIMESTAMP COMMENT 'End time',
  service_provider_reference STRING COMMENT 'Service provider reference',
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'ETL load timestamp',
  CONSTRAINT encounter_pk PRIMARY KEY(id),
  CONSTRAINT encounter_patient_fk FOREIGN KEY(patient_id) REFERENCES patient(id)
)
COMMENT 'Flattened Encounter resources from Medplum FHIR server'
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- ============================================
-- Observation Table
-- ============================================
CREATE TABLE IF NOT EXISTS observation (
  id STRING NOT NULL COMMENT 'FHIR Resource ID',
  patient_id STRING NOT NULL COMMENT 'Reference to Patient',
  status STRING COMMENT 'registered | preliminary | final | amended | corrected | cancelled',
  category_system STRING COMMENT 'Category code system',
  category_code STRING COMMENT 'Category code (e.g., laboratory, imaging)',
  category_display STRING COMMENT 'Category display text',
  code_system STRING COMMENT 'Observation code system (LOINC, SNOMED)',
  code_code STRING NOT NULL COMMENT 'Observation code',
  code_display STRING COMMENT 'Observation code display text',
  effective_datetime TIMESTAMP COMMENT 'Clinically relevant time',
  effective_period_start TIMESTAMP COMMENT 'Period start',
  effective_period_end TIMESTAMP COMMENT 'Period end',
  value_string STRING COMMENT 'String value',
  value_quantity_value DECIMAL(18,6) COMMENT 'Numeric value',
  value_quantity_unit STRING COMMENT 'Unit of measure',
  value_codeable_concept_system STRING COMMENT 'Coded value system',
  value_codeable_concept_code STRING COMMENT 'Coded value code',
  value_codeable_concept_display STRING COMMENT 'Coded value display',
  interpretation_system STRING COMMENT 'Interpretation code system',
  interpretation_code STRING COMMENT 'Interpretation code',
  interpretation_display STRING COMMENT 'Interpretation display',
  body_site_system STRING COMMENT 'Body site code system',
  body_site_code STRING COMMENT 'Body site code',
  body_site_display STRING COMMENT 'Body site display',
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'ETL load timestamp',
  CONSTRAINT observation_pk PRIMARY KEY(id),
  CONSTRAINT observation_patient_fk FOREIGN KEY(patient_id) REFERENCES patient(id)
)
COMMENT 'Flattened Observation resources from Medplum FHIR server'
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- ============================================
-- Coverage Table
-- ============================================
CREATE TABLE IF NOT EXISTS coverage (
  id STRING NOT NULL COMMENT 'FHIR Resource ID',
  patient_id STRING NOT NULL COMMENT 'Reference to Patient',
  status STRING COMMENT 'active | cancelled | draft | entered-in-error',
  type_system STRING COMMENT 'Coverage type system',
  type_code STRING COMMENT 'Coverage type code',
  type_display STRING COMMENT 'Coverage type display',
  subscriber_id STRING COMMENT 'Subscriber identifier',
  period_start DATE COMMENT 'Coverage start date',
  period_end DATE COMMENT 'Coverage end date',
  payor_display STRING COMMENT 'Payor display name',
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'ETL load timestamp',
  CONSTRAINT coverage_pk PRIMARY KEY(id),
  CONSTRAINT coverage_patient_fk FOREIGN KEY(patient_id) REFERENCES patient(id)
)
COMMENT 'Flattened Coverage resources from Medplum FHIR server'
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- ============================================
-- Terminology Schema - ValueSet Expansion Table
-- ============================================
USE SCHEMA terminology;

CREATE TABLE IF NOT EXISTS valueset_expansion (
  valueset_oid STRING NOT NULL COMMENT 'ValueSet OID (e.g., 2.16.840.1.113883...)',
  valueset_name STRING COMMENT 'ValueSet name',
  valueset_title STRING COMMENT 'ValueSet title',
  code_system STRING NOT NULL COMMENT 'Code system URI (e.g., http://loinc.org)',
  code STRING NOT NULL COMMENT 'Code value',
  display STRING COMMENT 'Code display text',
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'ETL load timestamp',
  CONSTRAINT valueset_expansion_pk PRIMARY KEY(valueset_oid, code_system, code)
)
COMMENT 'Expanded codes from VSAC ValueSets for use in measure calculations'
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- ============================================
-- Verify Table Creation
-- ============================================
USE SCHEMA bronze;
SHOW TABLES;

USE SCHEMA terminology;
SHOW TABLES;

SELECT 'All tables created successfully!' AS status;

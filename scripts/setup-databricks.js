#!/usr/bin/env node

/**
 * Set up Databricks Unity Catalog, Tables, and Views
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

async function executeSqlStatement(sql, description) {
  console.log(`\n📝 ${description}...`);

  const response = await fetch(`https://${DATABRICKS_HOST}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: DATABRICKS_WAREHOUSE,
      statement: sql,
      wait_timeout: '30s',
    }),
  });

  const result = await response.json();

  if (result.status?.state === 'SUCCEEDED') {
    console.log(`✓ ${description} completed`);
    return result;
  } else if (result.status?.state === 'FAILED') {
    console.log(`❌ ${description} failed:`);
    console.log(result.status?.error?.message || JSON.stringify(result, null, 2));
    throw new Error(result.status?.error?.message || 'SQL execution failed');
  } else {
    console.log(`⚠️  ${description} status: ${result.status?.state}`);
    return result;
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Set up Databricks for FHIR Analytics');
  console.log('==========================================');

  if (!DATABRICKS_HOST || !DATABRICKS_TOKEN || !DATABRICKS_WAREHOUSE) {
    console.error('\n❌ ERROR: Missing Databricks configuration');
    console.error('Please set:');
    console.error('  DATABRICKS_HOST');
    console.error('  DATABRICKS_TOKEN');
    console.error('  DATABRICKS_WAREHOUSE');
    process.exit(1);
  }

  console.log(`\nHost: ${DATABRICKS_HOST}`);
  console.log(`Warehouse: ${DATABRICKS_WAREHOUSE}`);

  try {
    // Step 1: Create catalog
    console.log('\n==========================================');
    console.log('STEP 1: Create Catalog Structure');
    console.log('==========================================');

    await executeSqlStatement(
      'CREATE CATALOG IF NOT EXISTS fhir_analytics',
      'Create catalog fhir_analytics'
    );

    await executeSqlStatement(
      'USE CATALOG fhir_analytics',
      'Switch to fhir_analytics catalog'
    );

    await executeSqlStatement(
      "CREATE SCHEMA IF NOT EXISTS bronze COMMENT 'Raw flattened FHIR data'",
      'Create bronze schema'
    );

    await executeSqlStatement(
      "CREATE SCHEMA IF NOT EXISTS silver COMMENT 'Cleaned and validated data'",
      'Create silver schema'
    );

    await executeSqlStatement(
      "CREATE SCHEMA IF NOT EXISTS gold COMMENT 'Measure calculation views'",
      'Create gold schema'
    );

    await executeSqlStatement(
      "CREATE SCHEMA IF NOT EXISTS terminology COMMENT 'ValueSet expansions'",
      'Create terminology schema'
    );

    // Step 2: Create bronze tables
    console.log('\n==========================================');
    console.log('STEP 2: Create Bronze Layer Tables');
    console.log('==========================================');

    await executeSqlStatement(
      'USE SCHEMA bronze',
      'Switch to bronze schema'
    );

    //Patient table
    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS patient (
        id STRING NOT NULL COMMENT 'FHIR Resource ID',
        identifier_system STRING COMMENT 'Identifier system',
        identifier_value STRING COMMENT 'Identifier value',
        name_family STRING COMMENT 'Family name',
        name_given ARRAY<STRING> COMMENT 'Given names',
        gender STRING COMMENT 'Administrative gender',
        birthdate DATE COMMENT 'Date of birth',
        deceased_boolean BOOLEAN COMMENT 'Deceased indicator',
        deceased_datetime TIMESTAMP COMMENT 'Date/time of death',
        address_line ARRAY<STRING> COMMENT 'Street address lines',
        address_city STRING COMMENT 'City',
        address_state STRING COMMENT 'State/Province',
        address_postal_code STRING COMMENT 'Postal code',
        address_country STRING COMMENT 'Country',
        telecom_phone STRING COMMENT 'Phone number',
        telecom_email STRING COMMENT 'Email address',
        active BOOLEAN COMMENT 'Whether record is active',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Flattened Patient resources from Medplum FHIR server'
    `,
      'Create patient table'
    );

    // Encounter table
    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS encounter (
        id STRING NOT NULL COMMENT 'FHIR Resource ID',
        patient_id STRING NOT NULL COMMENT 'Reference to Patient',
        status STRING COMMENT 'Encounter status',
        class_system STRING COMMENT 'Classification system',
        class_code STRING COMMENT 'Classification code',
        class_display STRING COMMENT 'Classification display text',
        type_system STRING COMMENT 'Type code system',
        type_code STRING COMMENT 'Type code',
        type_display STRING COMMENT 'Type display text',
        period_start TIMESTAMP COMMENT 'Start time',
        period_end TIMESTAMP COMMENT 'End time',
        service_provider_reference STRING COMMENT 'Service provider reference',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Flattened Encounter resources from Medplum FHIR server'
    `,
      'Create encounter table'
    );

    // Observation table
    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS observation (
        id STRING NOT NULL COMMENT 'FHIR Resource ID',
        patient_id STRING NOT NULL COMMENT 'Reference to Patient',
        status STRING COMMENT 'Observation status',
        category_system STRING COMMENT 'Category code system',
        category_code STRING COMMENT 'Category code',
        category_display STRING COMMENT 'Category display text',
        code_system STRING COMMENT 'Observation code system',
        code_code STRING NOT NULL COMMENT 'Observation code',
        code_display STRING COMMENT 'Observation code display text',
        effective_datetime TIMESTAMP COMMENT 'Clinically relevant time',
        effective_period_start TIMESTAMP COMMENT 'Period start',
        effective_period_end TIMESTAMP COMMENT 'Period end',
        value_string STRING COMMENT 'String value',
        value_quantity_value DECIMAL(18,6) COMMENT 'Numeric value',
        value_quantity_unit STRING COMMENT 'Unit of measure',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Flattened Observation resources from Medplum FHIR server'
    `,
      'Create observation table'
    );

    // Coverage table
    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS coverage (
        id STRING NOT NULL COMMENT 'FHIR Resource ID',
        patient_id STRING NOT NULL COMMENT 'Reference to Patient',
        status STRING COMMENT 'Coverage status',
        type_system STRING COMMENT 'Coverage type system',
        type_code STRING COMMENT 'Coverage type code',
        type_display STRING COMMENT 'Coverage type display',
        subscriber_id STRING COMMENT 'Subscriber identifier',
        period_start DATE COMMENT 'Coverage start date',
        period_end DATE COMMENT 'Coverage end date',
        payor_display STRING COMMENT 'Payor display name',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Flattened Coverage resources from Medplum FHIR server'
    `,
      'Create coverage table'
    );

    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS procedure (
        id STRING NOT NULL COMMENT 'FHIR Resource ID',
        patient_id STRING NOT NULL COMMENT 'Reference to Patient',
        status STRING COMMENT 'Procedure status',
        code_system STRING COMMENT 'Procedure code system',
        code_code STRING COMMENT 'Procedure code',
        code_display STRING COMMENT 'Procedure display name',
        performed_datetime TIMESTAMP COMMENT 'Procedure performed date/time',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Flattened Procedure resources from Medplum FHIR server'
    `,
      'Create procedure table'
    );

    // ValueSet expansion table
    await executeSqlStatement(
      'USE SCHEMA terminology',
      'Switch to terminology schema'
    );

    await executeSqlStatement(`
      CREATE TABLE IF NOT EXISTS valueset_expansion (
        valueset_oid STRING NOT NULL COMMENT 'ValueSet OID',
        valueset_name STRING COMMENT 'ValueSet name',
        valueset_title STRING COMMENT 'ValueSet title',
        code_system STRING NOT NULL COMMENT 'Code system URI',
        code STRING NOT NULL COMMENT 'Code value',
        display STRING COMMENT 'Code display text',
        loaded_at TIMESTAMP COMMENT 'ETL load timestamp'
      )
      COMMENT 'Expanded codes from VSAC ValueSets for use in measure calculations'
    `,
      'Create valueset_expansion table'
    );

    console.log('\n==========================================');
    console.log('✅ Databricks setup complete!');
    console.log('==========================================\n');
    console.log('Created:');
    console.log('  - Catalog: fhir_analytics');
    console.log('  - Schemas: bronze, silver, gold, terminology');
    console.log('  - Tables: patient, encounter, observation, coverage, valueset_expansion\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

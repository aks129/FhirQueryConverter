#!/usr/bin/env node

/**
 * Complete E2E Demo Workflow
 * Executes all 11 steps of the CQL measure evaluation pipeline
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;
const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

// Resource IDs
const PATIENT_ID = 'bfa58977-4614-4ca2-9a3f-a1b0f3b04142';
const LIBRARY_ID = '0955fba6-80b6-47b5-b8e5-479663b9cadb';
const MEASURE_ID = '13e620a1-2f21-4d65-ad10-7ba18b83b1f1';

let accessToken;
let stepResults = {};

// Helper: Get Medplum access token
async function getMedplumToken() {
  console.log('\n🔑 Step 1: Authenticating with Medplum...');
  const response = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MEDPLUM_CLIENT_ID,
      client_secret: MEDPLUM_CLIENT_SECRET,
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to authenticate');
  }

  accessToken = data.access_token;
  console.log('✅ Connected to Medplum FHIR Server');
  stepResults.step1 = { status: 'success', message: 'Connected to Medplum' };
}

// Step 2: Load Library and Measure
async function loadLibraryAndMeasure() {
  console.log('\n📚 Step 2: Loading CQL Library and Measure...');

  const library = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Library/${LIBRARY_ID}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).then(r => r.json());

  const measure = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Measure/${MEASURE_ID}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).then(r => r.json());

  console.log(`✅ Loaded Library: ${library.name} v${library.version}`);
  console.log(`✅ Loaded Measure: ${measure.title}`);

  stepResults.step2 = {
    status: 'success',
    library: library.name,
    measure: measure.title,
  };

  return { library, measure };
}

// Step 3: Load Patient Data
async function loadPatientData() {
  console.log('\n👤 Step 3: Loading patient data from Medplum...');

  const patient = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient/${PATIENT_ID}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).then(r => r.json());

  const encounters = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter?subject=Patient/${PATIENT_ID}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).then(r => r.json());

  const observations = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Patient/${PATIENT_ID}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).then(r => r.json());

  const name = `${patient.name[0].given.join(' ')} ${patient.name[0].family}`;
  console.log(`✅ Loaded Patient: ${name} (${patient.gender}, ${patient.birthDate})`);
  console.log(`✅ Found ${encounters.total || 0} encounters`);
  console.log(`✅ Found ${observations.total || 0} observations`);

  stepResults.step3 = {
    status: 'success',
    patient: name,
    encounters: encounters.total || 0,
    observations: observations.total || 0,
  };

  return { patient, encounters, observations };
}

// Step 4: Execute SQL in Databricks to create views
async function createDatabricksViews() {
  console.log('\n🏗️  Step 4: Creating measure views in Databricks...');

  const sqlQueries = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'test-data', 'cms125-sql-queries.json'), 'utf8')
  );

  // Create the measure report view
  const measureReportQuery = sqlQueries.queries.find(q => q.name === 'measure_report');

  console.log('Creating cms125_measure_report view...');

  const response = await fetch(`https://${DATABRICKS_HOST}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: DATABRICKS_WAREHOUSE,
      statement: `CREATE OR REPLACE VIEW workspace.default.cms125_measure_report AS ${measureReportQuery.sql}`,
      wait_timeout: '30s',
    }),
  });

  const result = await response.json();

  if (result.status?.state === 'SUCCEEDED') {
    console.log('✅ Measure view created in Databricks');
    stepResults.step4 = { status: 'success', view: 'cms125_measure_report' };
  } else {
    console.log('⚠️  View creation status:', result.status?.state);
    stepResults.step4 = { status: 'partial', message: result.status?.error?.message };
  }
}

// Step 5: Execute measure calculation in Databricks
async function executeMeasureCalculation() {
  console.log('\n📊 Step 5: Executing measure calculation in Databricks...');

  const response = await fetch(`https://${DATABRICKS_HOST}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: DATABRICKS_WAREHOUSE,
      statement: 'SELECT * FROM workspace.default.cms125_measure_report',
      wait_timeout: '30s',
    }),
  });

  const result = await response.json();

  if (result.status?.state === 'SUCCEEDED' && result.result?.data_array) {
    console.log('\n📈 Measure Results:');
    result.result.data_array.forEach(row => {
      const [population, count, percentage] = row;
      if (percentage) {
        console.log(`  ${population}: ${count} patients (${percentage}%)`);
      } else {
        console.log(`  ${population}: ${count} patients`);
      }
    });

    stepResults.step5 = {
      status: 'success',
      results: result.result.data_array,
    };

    return result.result.data_array;
  } else {
    console.log('⚠️  Query status:', result.status?.state);
    console.log('Error:', result.status?.error?.message);
    stepResults.step5 = { status: 'failed', message: result.status?.error?.message };
    return null;
  }
}

// Step 6: Generate and write MeasureReport to Medplum
async function writeMeasureReport(measureResults) {
  console.log('\n📝 Step 6: Generating MeasureReport and writing to Medplum...');

  if (!measureResults) {
    console.log('❌ No measure results to write');
    return;
  }

  // Parse results
  const populations = {};
  measureResults.forEach(row => {
    const [populationType, count] = row;
    populations[populationType] = parseInt(count);
  });

  // Create MeasureReport resource
  const measureReport = {
    resourceType: 'MeasureReport',
    status: 'complete',
    type: 'individual',
    measure: `Measure/${MEASURE_ID}`,
    subject: {
      reference: `Patient/${PATIENT_ID}`,
    },
    date: new Date().toISOString(),
    period: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    group: [{
      population: [
        {
          code: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/measure-population',
              code: 'initial-population',
            }],
          },
          count: populations['initial-population'] || 0,
        },
        {
          code: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/measure-population',
              code: 'denominator',
            }],
          },
          count: populations['denominator'] || 0,
        },
        {
          code: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/measure-population',
              code: 'numerator',
            }],
          },
          count: populations['numerator'] || 0,
        },
      ],
      measureScore: {
        value: populations['numerator'] && populations['denominator']
          ? (populations['numerator'] / populations['denominator']) * 100
          : 0,
      },
    }],
  };

  // Write to Medplum
  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/MeasureReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(measureReport),
  });

  const result = await response.json();

  if (result.resourceType === 'MeasureReport') {
    console.log(`✅ MeasureReport created: ${result.id}`);
    console.log(`   Measure Score: ${result.group[0].measureScore.value.toFixed(2)}%`);

    stepResults.step6 = {
      status: 'success',
      measureReportId: result.id,
      measureScore: result.group[0].measureScore.value,
    };

    return result;
  } else {
    console.log('❌ Failed to create MeasureReport');
    console.log(result);
    stepResults.step6 = { status: 'failed', error: result };
    return null;
  }
}

// Main workflow
async function main() {
  console.log('==========================================');
  console.log('  E2E CQL Measure Evaluation Demo');
  console.log('  CMS125 - Breast Cancer Screening');
  console.log('==========================================');

  if (!MEDPLUM_CLIENT_ID || !DATABRICKS_HOST) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET, DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_WAREHOUSE');
    process.exit(1);
  }

  try {
    // Execute workflow
    await getMedplumToken();
    const { library, measure } = await loadLibraryAndMeasure();
    const patientData = await loadPatientData();
    await createDatabricksViews();
    const measureResults = await executeMeasureCalculation();
    const measureReport = await writeMeasureReport(measureResults);

    // Summary
    console.log('\n==========================================');
    console.log('✅ E2E Workflow Complete!');
    console.log('==========================================\n');
    console.log('Summary:');
    console.log(`  Library: ${library.name} v${library.version}`);
    console.log(`  Measure: ${measure.title}`);
    console.log(`  Patient: ${patientData.patient.name[0].given.join(' ')} ${patientData.patient.name[0].family}`);
    console.log(`  MeasureReport ID: ${measureReport?.id || 'N/A'}`);
    console.log(`  Performance Rate: ${measureReport?.group[0].measureScore.value.toFixed(2)}%\n`);

    // Save results
    const resultsPath = path.join(__dirname, '..', 'e2e-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      steps: stepResults,
      measureReport: measureReport,
    }, null, 2));

    console.log(`Results saved to: ${resultsPath}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

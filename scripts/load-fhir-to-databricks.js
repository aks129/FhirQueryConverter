#!/usr/bin/env node

/**
 * ETL: Load FHIR data from Medplum to Databricks
 */

import fs from 'fs';
import path from 'path';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;
const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

// Load all patient IDs from file
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PATIENT_IDS = [];

let accessToken;

async function getMedplumToken() {
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
  accessToken = data.access_token;
}

async function executeDatabricksSQL(sql, description) {
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
    console.log(`✅ ${description} completed`);
    return result;
  } else {
    console.log(`❌ ${description} failed:`);
    console.log(result.status?.error?.message);
    throw new Error(result.status?.error?.message);
  }
}

async function loadPatients() {
  console.log('\n👤 Loading patient data...');

  for (const patientId of PATIENT_IDS) {
    const patient = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.json());

    const sql = `
      INSERT INTO workspace.default.patient (
        id, name_family, name_given, gender, birthdate, active, telecom_phone, telecom_email, loaded_at
      ) VALUES (
        '${patient.id}',
        '${patient.name[0].family}',
        array('${patient.name[0].given.join("', '")}'),
        '${patient.gender}',
        '${patient.birthDate}',
        ${patient.active},
        '${patient.telecom?.find(t => t.system === 'phone')?.value || ''}',
        '${patient.telecom?.find(t => t.system === 'email')?.value || ''}',
        CURRENT_TIMESTAMP()
      )
    `;

    await executeDatabricksSQL(sql, `Insert patient ${patient.id}`);
    console.log(`✅ Loaded patient: ${patient.name[0].given.join(' ')} ${patient.name[0].family}`);
  }
}

async function loadEncounters() {
  console.log('\n🏥 Loading encounters...');

  let totalEncounters = 0;

  for (const patientId of PATIENT_IDS) {
    const bundle = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.json());

    if (!bundle.entry || bundle.entry.length === 0) {
      continue;
    }

    for (const entry of bundle.entry) {
      const enc = entry.resource;
      const patientRef = enc.subject.reference.split('/')[1];

      const sql = `
        INSERT INTO workspace.default.encounter (
          id, patient_id, status, class_code, type_code, type_display, period_start, period_end, loaded_at
        ) VALUES (
          '${enc.id}',
          '${patientRef}',
          '${enc.status}',
          '${enc.class?.code || ''}',
          '${enc.type?.[0]?.coding?.[0]?.code || ''}',
          '${enc.type?.[0]?.coding?.[0]?.display || ''}',
          '${enc.period?.start}',
          '${enc.period?.end || enc.period?.start}',
          CURRENT_TIMESTAMP()
        )
      `;

      await executeDatabricksSQL(sql, `Insert encounter ${enc.id}`);
      totalEncounters++;
    }
  }

  console.log(`✅ Loaded ${totalEncounters} encounter(s)`);
}

async function loadObservations() {
  console.log('\n🔬 Loading observations...');

  let totalObservations = 0;

  for (const patientId of PATIENT_IDS) {
    const bundle = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.json());

    if (!bundle.entry || bundle.entry.length === 0) {
      continue;
    }

    for (const entry of bundle.entry) {
      const obs = entry.resource;
      const patientRef = obs.subject.reference.split('/')[1];

      const sql = `
        INSERT INTO workspace.default.observation (
          id, patient_id, status, code_system, code_code, code_display, effective_datetime, value_string, loaded_at
        ) VALUES (
          '${obs.id}',
          '${patientRef}',
          '${obs.status}',
          '${obs.code.coding[0].system}',
          '${obs.code.coding[0].code}',
          '${obs.code.coding[0].display}',
          '${obs.effectiveDateTime}',
          '${(obs.valueString || '').replace(/'/g, "''")}',
          CURRENT_TIMESTAMP()
        )
      `;

      await executeDatabricksSQL(sql, `Insert observation ${obs.id}`);
      totalObservations++;
    }
  }

  console.log(`✅ Loaded ${totalObservations} observation(s)`);
}

async function loadCoverage() {
  console.log('\n💳 Loading coverage...');

  let totalCoverage = 0;

  for (const patientId of PATIENT_IDS) {
    const bundle = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Coverage?beneficiary=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.json());

    if (!bundle.entry || bundle.entry.length === 0) {
      continue;
    }

    for (const entry of bundle.entry) {
      const cov = entry.resource;
      const patientRef = cov.beneficiary.reference.split('/')[1];

      const sql = `
        INSERT INTO workspace.default.coverage (
          id, patient_id, status, type_code, type_display, subscriber_id, period_start, period_end, payor_display, loaded_at
        ) VALUES (
          '${cov.id}',
          '${patientRef}',
          '${cov.status}',
          '${cov.type?.coding?.[0]?.code || ''}',
          '${cov.type?.coding?.[0]?.display || ''}',
          '${cov.subscriberId || ''}',
          '${cov.period?.start}',
          '${cov.period?.end}',
          '${cov.payor?.[0]?.display || ''}',
          CURRENT_TIMESTAMP()
        )
      `;

      await executeDatabricksSQL(sql, `Insert coverage ${cov.id}`);
      totalCoverage++;
    }
  }

  console.log(`✅ Loaded ${totalCoverage} coverage(s)`);
}

async function loadProcedures() {
  console.log('\n⚕️  Loading procedures...');

  let totalProcedures = 0;

  for (const patientId of PATIENT_IDS) {
    const bundle = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Procedure?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }).then(r => r.json());

    if (!bundle.entry || bundle.entry.length === 0) {
      continue;
    }

    for (const entry of bundle.entry) {
      const proc = entry.resource;
      const patientRef = proc.subject.reference.split('/')[1];

      const sql = `
        INSERT INTO workspace.default.procedure (
          id, patient_id, status, code_system, code_code, code_display, performed_datetime, loaded_at
        ) VALUES (
          '${proc.id}',
          '${patientRef}',
          '${proc.status}',
          '${proc.code?.coding?.[0]?.system || ''}',
          '${proc.code?.coding?.[0]?.code || ''}',
          '${proc.code?.coding?.[0]?.display || ''}',
          '${proc.performedDateTime || ''}',
          CURRENT_TIMESTAMP()
        )
      `;

      await executeDatabricksSQL(sql, `Insert procedure ${proc.id}`);
      totalProcedures++;
    }
  }

  console.log(`✅ Loaded ${totalProcedures} procedure(s)`);
}

async function loadValueSetExpansion() {
  console.log('\n📖 Loading ValueSet expansion...');

  // Load from local file since VSAC API has auth issues
  const vsPath = new URL('../test-data/valuesets/Mammography.json', import.meta.url);
  const { default: mammographyVS } = await import(vsPath, { with: { type: 'json' } });

  const oid = '2.16.840.1.113883.3.464.1003.198.12.1011';
  const vsName = mammographyVS.name;

  for (const concept of mammographyVS.expansion.contains) {
    const sql = `
      INSERT INTO workspace.default.valueset_expansion (
        valueset_oid, valueset_name, code_system, code, display, loaded_at
      ) VALUES (
        '${oid}',
        '${vsName}',
        '${concept.system}',
        '${concept.code}',
        '${concept.display.replace(/'/g, "''")}',
        CURRENT_TIMESTAMP()
      )
    `;

    await executeDatabricksSQL(sql, `Insert code ${concept.code}`);
  }

  console.log(`✅ Loaded ${mammographyVS.expansion.contains.length} codes from Mammography ValueSet`);
}

async function main() {
  console.log('==========================================');
  console.log('  ETL: Medplum → Databricks');
  console.log('==========================================');

  try {
    // Load patient IDs from file
    const idsPath = path.join(__dirname, '..', 'test-data', 'patient-ids.json');
    if (!fs.existsSync(idsPath)) {
      throw new Error('Patient IDs file not found. Please run load-multiple-patients.js first.');
    }

    const patientIdsData = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
    PATIENT_IDS = Object.values(patientIdsData);

    console.log(`\n📋 Loading data for ${PATIENT_IDS.length} patients...`);
    console.log(`   Patient IDs: ${PATIENT_IDS.join(', ')}`);

    console.log('\n🔑 Authenticating with Medplum...');
    await getMedplumToken();
    console.log('✅ Authenticated');

    await loadPatients();
    await loadEncounters();
    await loadObservations();
    await loadCoverage();
    await loadProcedures();
    await loadValueSetExpansion();

    console.log('\n==========================================');
    console.log('✅ ETL Complete!');
    console.log('==========================================\n');
    console.log('Data loaded to Databricks:');
    console.log(`  - ${PATIENT_IDS.length} patients`);
    console.log('  - Encounters, Observations, Coverage');
    console.log('  - ValueSet expansion (7 codes)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

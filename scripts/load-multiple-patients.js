#!/usr/bin/env node

/**
 * Batch load multiple test patients to Medplum
 * Loads Patient 001, 002, and 003 with all related resources
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

let accessToken;
const loadedPatients = [];

async function getMedplumToken() {
  console.log('\n🔑 Authenticating with Medplum...');
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
    throw new Error('Failed to authenticate with Medplum');
  }

  accessToken = data.access_token;
  console.log('✅ Authenticated successfully');
}

async function createResource(resourceType, resource) {
  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/${resourceType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ${resourceType}: ${error}`);
  }

  return await response.json();
}

async function loadPatientBundle(bundlePath, patientLabel) {
  console.log(`\n📦 Loading ${patientLabel} from bundle...`);

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const createdResources = {};

  // Process each entry in the bundle
  for (const entry of bundle.entry) {
    const resource = entry.resource;
    const fullUrl = entry.fullUrl;

    // Replace references to temporary UUIDs with actual IDs
    const resourceStr = JSON.stringify(resource);
    let updatedResourceStr = resourceStr;

    for (const [tempId, actualId] of Object.entries(createdResources)) {
      updatedResourceStr = updatedResourceStr.replace(
        new RegExp(tempId, 'g'),
        actualId
      );
    }

    const updatedResource = JSON.parse(updatedResourceStr);

    // Create the resource
    try {
      const created = await createResource(resource.resourceType, updatedResource);
      createdResources[fullUrl] = `${resource.resourceType}/${created.id}`;

      console.log(`  ✅ Created ${resource.resourceType}: ${created.id}`);

      // Store patient ID for later use
      if (resource.resourceType === 'Patient') {
        loadedPatients.push({
          id: created.id,
          name: `${created.name[0].given.join(' ')} ${created.name[0].family}`,
          birthDate: created.birthDate,
          gender: created.gender,
        });
      }
    } catch (error) {
      console.error(`  ❌ Failed to create ${resource.resourceType}:`, error.message);
    }
  }

  console.log(`✅ ${patientLabel} loaded successfully`);
  return createdResources;
}

async function main() {
  console.log('==========================================');
  console.log('  Batch Load Multiple Test Patients');
  console.log('==========================================');

  if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    await getMedplumToken();

    // Load Patient 002 (in denominator, not numerator - no mammography)
    const bundle002Path = path.join(__dirname, '..', 'test-data', 'patient-002-bundle.json');
    await loadPatientBundle(bundle002Path, 'Patient 002 (No Mammography)');

    // Load Patient 003 (denominator exclusion - bilateral mastectomy)
    const bundle003Path = path.join(__dirname, '..', 'test-data', 'patient-003-bundle.json');
    await loadPatientBundle(bundle003Path, 'Patient 003 (Bilateral Mastectomy)');

    // Summary
    console.log('\n==========================================');
    console.log('✅ Batch Loading Complete!');
    console.log('==========================================\n');
    console.log('Loaded Patients:');
    loadedPatients.forEach((patient, index) => {
      console.log(`  ${index + 1}. ${patient.name} (${patient.gender}, ${patient.birthDate})`);
      console.log(`     ID: ${patient.id}`);
    });

    // Save patient IDs to file
    const idsPath = path.join(__dirname, '..', 'test-data', 'patient-ids.json');
    const existingIds = fs.existsSync(idsPath)
      ? JSON.parse(fs.readFileSync(idsPath, 'utf8'))
      : { patient001: 'bfa58977-4614-4ca2-9a3f-a1b0f3b04142' };

    const allPatientIds = {
      ...existingIds,
      patient002: loadedPatients[0]?.id,
      patient003: loadedPatients[1]?.id,
    };

    fs.writeFileSync(idsPath, JSON.stringify(allPatientIds, null, 2));
    console.log(`\nPatient IDs saved to: ${idsPath}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

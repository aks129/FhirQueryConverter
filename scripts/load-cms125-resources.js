#!/usr/bin/env node

/**
 * Load CMS125 Library, Measure, and ViewDefinition resources to Medplum
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

async function getAccessToken() {
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
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function uploadResource(accessToken, resourceType, resource) {
  const resourceId = resource.id;
  console.log(`\n📤 Uploading ${resourceType}/${resourceId || 'new'}...`);

  // Remove id to let Medplum generate it
  const resourceCopy = { ...resource };
  delete resourceCopy.id;

  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/${resourceType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(resourceCopy),
  });

  const result = await response.json();

  if (result.resourceType === resourceType) {
    console.log(`✓ ${resourceType}/${result.id} uploaded successfully`);
    console.log(`  Original ID: ${resourceId}, New ID: ${result.id}`);
    return result;
  } else if (result.resourceType === 'OperationOutcome') {
    console.log(`❌ Failed to upload ${resourceType}:`);
    console.log(JSON.stringify(result, null, 2));
    throw new Error(`Failed to upload ${resourceType}`);
  } else {
    console.log(`⚠️  Unexpected response:`, result);
    return result;
  }
}

async function uploadBundle(accessToken, bundle) {
  console.log(`\n📦 Uploading bundle with ${bundle.entry.length} resources...`);

  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(bundle),
  });

  const result = await response.json();

  if (result.resourceType === 'Bundle' && result.type === 'transaction-response') {
    console.log(`✓ Bundle uploaded successfully - ${result.entry.length} resources processed`);
    return result;
  } else {
    console.log(`❌ Failed to upload bundle:`);
    console.log(JSON.stringify(result, null, 2));
    throw new Error('Failed to upload bundle');
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Load CMS125 Measure Resources');
  console.log('==========================================');

  if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
    console.error('\n❌ ERROR: Missing Medplum credentials');
    process.exit(1);
  }

  try {
    // Get access token
    console.log('\n📡 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✓ Access token obtained');

    // Load Library
    console.log('\n--- Loading CQL Library ---');
    const libraryPath = path.join(__dirname, '..', 'test-data', 'cms125-library.json');
    const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    await uploadResource(accessToken, 'Library', library);

    // Load Measure
    console.log('\n--- Loading Measure ---');
    const measurePath = path.join(__dirname, '..', 'test-data', 'cms125-measure.json');
    const measure = JSON.parse(fs.readFileSync(measurePath, 'utf8'));
    await uploadResource(accessToken, 'Measure', measure);

    // Load ViewDefinitions
    console.log('\n--- Loading ViewDefinitions ---');
    const viewDefsPath = path.join(__dirname, '..', 'test-data', 'cms125-viewdefinitions.json');
    const viewDefsBundle = JSON.parse(fs.readFileSync(viewDefsPath, 'utf8'));
    await uploadBundle(accessToken, viewDefsBundle);

    console.log('\n==========================================');
    console.log('✅ All CMS125 resources loaded!');
    console.log('==========================================\n');
    console.log('Uploaded resources:');
    console.log('  - Library/BCSComponent');
    console.log('  - Measure/CMS125');
    console.log('  - Basic/patient-view-definition');
    console.log('  - Basic/encounter-view-definition');
    console.log('  - Basic/observation-view-definition\n');
    console.log('Next steps:');
    console.log('  1. Use Medplum $cql operation to evaluate CQL');
    console.log('  2. Convert CQL to SQL using the transpiler');
    console.log('  3. Store SQL queries in Databricks');
    console.log('  4. Use ViewDefinitions for SQL on FHIR evaluation\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

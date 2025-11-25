#!/usr/bin/env node

/**
 * Upload SQL on FHIR ViewDefinitions to Medplum
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

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
    throw new Error('Failed to authenticate');
  }

  console.log('✅ Authenticated');
  return data.access_token;
}

async function uploadViewDefinition(accessToken, viewDef) {
  const viewName = viewDef.name;
  console.log(`\n📤 Uploading ViewDefinition: ${viewName}...`);

  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/ViewDefinition`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(viewDef),
  });

  const result = await response.json();

  if (result.resourceType === 'ViewDefinition') {
    console.log(`✅ ViewDefinition uploaded: ${result.id}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Resource: ${result.resource}`);
    console.log(`   Columns: ${result.select[0].column.length}`);
    return result;
  } else if (result.resourceType === 'OperationOutcome') {
    console.log(`❌ Failed to upload ViewDefinition ${viewName}:`);
    console.log(JSON.stringify(result, null, 2));
    throw new Error(`Failed to upload ${viewName}`);
  }

  return result;
}

async function main() {
  console.log('==========================================');
  console.log('  Upload SQL on FHIR ViewDefinitions');
  console.log('==========================================');

  if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    const accessToken = await getMedplumToken();

    // Load ViewDefinitions bundle
    const bundlePath = path.join(__dirname, '..', 'test-data', 'sql-on-fhir-viewdefinitions.json');
    const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

    console.log(`\n📦 Loading ${bundle.entry.length} ViewDefinitions from bundle...`);

    const uploadedViews = [];

    // Upload each ViewDefinition
    for (const entry of bundle.entry) {
      const viewDef = entry.resource;
      const result = await uploadViewDefinition(accessToken, viewDef);
      uploadedViews.push(result);
    }

    console.log('\n==========================================');
    console.log('✅ All ViewDefinitions Uploaded!');
    console.log('==========================================\n');

    console.log('Uploaded ViewDefinitions:');
    uploadedViews.forEach((view, index) => {
      console.log(`  ${index + 1}. ${view.name} (${view.resource})`);
      console.log(`     ID: ${view.id}`);
    });

    // Save ViewDefinition IDs
    const idsPath = path.join(__dirname, '..', 'test-data', 'viewdefinition-ids.json');
    const viewDefIds = {};
    uploadedViews.forEach(view => {
      viewDefIds[view.name] = view.id;
    });

    fs.writeFileSync(idsPath, JSON.stringify(viewDefIds, null, 2));
    console.log(`\nViewDefinition IDs saved to: ${idsPath}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

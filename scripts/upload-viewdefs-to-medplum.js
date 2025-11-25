#!/usr/bin/env node

/**
 * Upload SQL on FHIR ViewDefinitions to Medplum as Basic resources
 * Following SQL on FHIR v2 specification
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
  const viewName = viewDef.extension?.find(
    e => e.url === 'http://example.org/viewdef-name'
  )?.valueString || viewDef.code.text;

  console.log(`\n📤 Uploading ViewDefinition: ${viewName}...`);

  // Remove id to let Medplum generate it
  const viewDefCopy = { ...viewDef };
  delete viewDefCopy.id;

  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Basic`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(viewDefCopy),
  });

  const result = await response.json();

  if (result.resourceType === 'Basic') {
    const resource = result.extension?.find(
      e => e.url === 'http://example.org/viewdef-resource'
    )?.valueString;

    const description = result.extension?.find(
      e => e.url === 'http://example.org/viewdef-description'
    )?.valueString;

    console.log(`✅ ViewDefinition uploaded: ${result.id}`);
    console.log(`   Name: ${viewName}`);
    console.log(`   Resource: ${resource}`);
    console.log(`   Description: ${description}`);
    return result;
  } else if (result.resourceType === 'OperationOutcome') {
    console.log(`❌ Failed to upload ViewDefinition ${viewName}:`);
    console.log(JSON.stringify(result, null, 2));
    throw new Error(`Failed to upload ${viewName}`);
  }

  return result;
}

async function queryViewDefinitions(accessToken) {
  console.log('\n🔍 Querying uploaded ViewDefinitions...');

  const response = await fetch(
    `${MEDPLUM_BASE_URL}/fhir/R4/Basic?code=http://hl7.org/fhir/uv/sql-on-fhir|ViewDefinition`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  const bundle = await response.json();

  if (bundle.total > 0) {
    console.log(`\n✅ Found ${bundle.total} ViewDefinitions in Medplum:`);
    bundle.entry?.forEach((entry, index) => {
      const viewName = entry.resource.extension?.find(
        e => e.url === 'http://example.org/viewdef-name'
      )?.valueString;

      const resource = entry.resource.extension?.find(
        e => e.url === 'http://example.org/viewdef-resource'
      )?.valueString;

      console.log(`  ${index + 1}. ${viewName} (${resource})`);
      console.log(`     ID: ${entry.resource.id}`);
      console.log(`     URL: ${MEDPLUM_BASE_URL}/fhir/R4/Basic/${entry.resource.id}`);
    });
  }

  return bundle;
}

async function main() {
  console.log('==========================================');
  console.log('  Upload SQL on FHIR ViewDefinitions');
  console.log('  (as Basic resources)');
  console.log('==========================================');

  if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    const accessToken = await getMedplumToken();

    // Load ViewDefinitions bundle
    const bundlePath = path.join(__dirname, '..', 'test-data', 'viewdefs-simple.json');
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
    console.log('==========================================');

    // Query to verify
    await queryViewDefinitions(accessToken);

    // Save ViewDefinition IDs
    const idsPath = path.join(__dirname, '..', 'test-data', 'viewdefinition-ids.json');
    const viewDefIds = {};
    uploadedViews.forEach(view => {
      const viewName = view.extension?.find(
        e => e.url === 'http://example.org/viewdef-name'
      )?.valueString;
      if (viewName) {
        viewDefIds[viewName] = view.id;
      }
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

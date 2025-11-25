#!/usr/bin/env node

/**
 * Load Test Data to Medplum FHIR Server
 * Uses Node.js instead of bash+jq for better Windows compatibility
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

async function main() {
  console.log('==========================================');
  console.log('  Load Test Data to Medplum');
  console.log('==========================================');
  console.log();

  // Check credentials
  if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
    console.error('❌ ERROR: Missing required environment variables');
    console.error('Please set:');
    console.error('  MEDPLUM_CLIENT_ID');
    console.error('  MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    // Step 1: Get access token
    console.log('📡 Getting access token...');
    const tokenResponse = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: MEDPLUM_CLIENT_ID,
        client_secret: MEDPLUM_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ Failed to get access token');
      console.error(tokenData);
      process.exit(1);
    }

    const accessToken = tokenData.access_token;
    console.log('✓ Access token obtained');
    console.log();

    // Step 2: Load test data bundle
    console.log('📦 Loading test patient bundle...');
    const bundlePath = path.join(__dirname, '..', 'test-data', 'patient-001-bundle.json');

    if (!fs.existsSync(bundlePath)) {
      console.error(`❌ Bundle file not found: ${bundlePath}`);
      process.exit(1);
    }

    const bundleData = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

    const bundleResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(bundleData),
    });

    const bundleResult = await bundleResponse.json();

    // Debug: Show bundle response
    console.log('Bundle response type:', bundleResult.resourceType);

    if (bundleResult.resourceType === 'OperationOutcome') {
      const hasError = bundleResult.issue?.some(i => i.severity === 'error' || i.severity === 'fatal');
      if (hasError) {
        console.error('❌ Failed to load bundle');
        console.error(JSON.stringify(bundleResult, null, 2));
        process.exit(1);
      } else {
        console.log('Warning:', JSON.stringify(bundleResult, null, 2));
      }
    }

    if (bundleResult.resourceType === 'Bundle' && bundleResult.type === 'transaction-response') {
      console.log('✓ Test data bundle loaded successfully');
      console.log(`  Created ${bundleResult.entry?.length || 0} resources`);
    } else {
      console.log('Unexpected response:', JSON.stringify(bundleResult, null, 2));
    }
    console.log();

    // Step 3: Verify resources
    console.log('🔍 Verifying loaded resources...');
    console.log();

    // Verify Patient
    console.log('  Checking Patient/test-patient-001...');
    const patientResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient/test-patient-001`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const patient = await patientResponse.json();

    if (patient.resourceType === 'Patient') {
      const name = `${patient.name[0].given.join(' ')} ${patient.name[0].family}`;
      console.log(`  ✓ Patient found: ${name} (${patient.gender}, born ${patient.birthDate})`);
    } else {
      console.log('  ❌ Patient not found');
    }

    // Verify Encounter
    console.log('  Checking Encounter/encounter-001...');
    const encounterResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter/encounter-001`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const encounter = await encounterResponse.json();

    if (encounter.resourceType === 'Encounter') {
      const type = encounter.type[0].coding[0].display;
      const date = encounter.period.start;
      console.log(`  ✓ Encounter found: ${type} on ${date}`);
    } else {
      console.log('  ❌ Encounter not found');
    }

    // Verify Observation
    console.log('  Checking Observation/mammography-001...');
    const obsResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation/mammography-001`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const observation = await obsResponse.json();

    if (observation.resourceType === 'Observation') {
      const code = observation.code.coding[0].display;
      const date = observation.effectiveDateTime;
      console.log(`  ✓ Observation found: ${code} on ${date}`);
    } else {
      console.log('  ❌ Observation not found');
    }

    // Verify Coverage
    console.log('  Checking Coverage/coverage-001...');
    const covResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Coverage/coverage-001`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const coverage = await covResponse.json();

    if (coverage.resourceType === 'Coverage') {
      const payor = coverage.payor[0].display;
      console.log(`  ✓ Coverage found: ${payor}`);
    } else {
      console.log('  ❌ Coverage not found');
    }

    console.log();
    console.log('==========================================');
    console.log('✅ Test data loaded successfully!');
    console.log('==========================================');
    console.log();
    console.log('Resources created:');
    console.log('  - Patient/test-patient-001');
    console.log('  - Encounter/encounter-001');
    console.log('  - Observation/mammography-001');
    console.log('  - Coverage/coverage-001');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

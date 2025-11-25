#!/usr/bin/env node

/**
 * Verify Medplum Resources
 */

const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

async function main() {
  console.log('🔍 Verifying Medplum resources...\n');

  // Get access token
  const tokenResponse = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MEDPLUM_CLIENT_ID,
      client_secret: MEDPLUM_CLIENT_SECRET,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Search for all patients
  console.log('Searching for patients...');
  const patientResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient?_count=10`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });
  const patientBundle = await patientResponse.json();

  if (patientBundle.entry && patientBundle.entry.length > 0) {
    console.log(`Found ${patientBundle.total || patientBundle.entry.length} patient(s):`);
    patientBundle.entry.forEach(e => {
      const p = e.resource;
      const name = p.name?.[0] ? `${p.name[0].given?.join(' ')} ${p.name[0].family}` : 'Unknown';
      console.log(`  - ${p.id}: ${name} (${p.gender}, ${p.birthDate})`);
    });
  } else {
    console.log('No patients found');
  }

  console.log('\nSearching for encounters...');
  const encounterResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter?_count=10`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });
  const encounterBundle = await encounterResponse.json();

  if (encounterBundle.entry && encounterBundle.entry.length > 0) {
    console.log(`Found ${encounterBundle.total || encounterBundle.entry.length} encounter(s):`);
    encounterBundle.entry.forEach(e => {
      const enc = e.resource;
      const type = enc.type?.[0]?.coding?.[0]?.display || 'Unknown';
      console.log(`  - ${enc.id}: ${type} (${enc.status})`);
    });
  } else {
    console.log('No encounters found');
  }

  console.log('\nSearching for observations...');
  const obsResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation?_count=10`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });
  const obsBundle = await obsResponse.json();

  if (obsBundle.entry && obsBundle.entry.length > 0) {
    console.log(`Found ${obsBundle.total || obsBundle.entry.length} observation(s):`);
    obsBundle.entry.forEach(e => {
      const obs = e.resource;
      const code = obs.code?.coding?.[0]?.display || 'Unknown';
      console.log(`  - ${obs.id}: ${code} (${obs.status})`);
    });
  } else {
    console.log('No observations found');
  }

  console.log('\nSearching for coverage...');
  const covResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Coverage?_count=10`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });
  const covBundle = await covResponse.json();

  if (covBundle.entry && covBundle.entry.length > 0) {
    console.log(`Found ${covBundle.total || covBundle.entry.length} coverage(s):`);
    covBundle.entry.forEach(e => {
      const cov = e.resource;
      const payor = cov.payor?.[0]?.display || 'Unknown';
      console.log(`  - ${cov.id}: ${payor} (${cov.status})`);
    });
  } else {
    console.log('No coverage found');
  }
}

main().catch(console.error);

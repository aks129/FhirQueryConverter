#!/usr/bin/env node

const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

async function main() {
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

  // Search for test patient by family name
  console.log('Searching for TestPatient...\n');
  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient?family=TestPatient`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });

  const bundle = await response.json();

  if (bundle.entry && bundle.entry.length > 0) {
    console.log(`Found ${bundle.entry.length} matching patient(s):\n`);
    bundle.entry.forEach(e => {
      const p = e.resource;
      const name = `${p.name[0].given.join(' ')} ${p.name[0].family}`;
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${name}`);
      console.log(`Gender: ${p.gender}`);
      console.log(`Birth Date: ${p.birthDate}`);
      console.log(`Active: ${p.active}`);
      console.log();
    });

    // Get the first patient's encounters
    const patientId = bundle.entry[0].resource.id;
    console.log(`\nSearching for encounters for patient ${patientId}...`);
    const encResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });
    const encBundle = await encResponse.json();

    if (encBundle.entry && encBundle.entry.length > 0) {
      console.log(`Found ${encBundle.entry.length} encounter(s):\n`);
      encBundle.entry.forEach(e => {
        const enc = e.resource;
        console.log(`  - ${enc.id}: ${enc.type?.[0]?.coding?.[0]?.display || 'Unknown'} (${enc.period?.start})`);
      });
    }

    // Get observations
    console.log(`\nSearching for observations for patient ${patientId}...`);
    const obsResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });
    const obsBundle = await obsResponse.json();

    if (obsBundle.entry && obsBundle.entry.length > 0) {
      console.log(`Found ${obsBundle.entry.length} observation(s):\n`);
      obsBundle.entry.forEach(e => {
        const obs = e.resource;
        console.log(`  - ${obs.id}: ${obs.code?.coding?.[0]?.display || 'Unknown'} (${obs.effectiveDateTime})`);
      });
    }

    // Get coverage
    console.log(`\nSearching for coverage for patient ${patientId}...`);
    const covResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Coverage?beneficiary=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });
    const covBundle = await covResponse.json();

    if (covBundle.entry && covBundle.entry.length > 0) {
      console.log(`Found ${covBundle.entry.length} coverage(s):\n`);
      covBundle.entry.forEach(e => {
        const cov = e.resource;
        console.log(`  - ${cov.id}: ${cov.payor?.[0]?.display || 'Unknown'} (${cov.status})`);
      });
    }

  } else {
    console.log('No matching patients found');
  }
}

main().catch(console.error);

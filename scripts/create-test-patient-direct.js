#!/usr/bin/env node

/**
 * Create test patient resources directly (not via bundle)
 */

const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

async function main() {
  console.log('==========================================');
  console.log('  Creating Test Data in Medplum');
  console.log('==========================================\n');

  // Get access token
  console.log('📡 Getting access token...');
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
  console.log('✓ Access token obtained\n');

  // Create Patient
  console.log('Creating Patient...');
  const patient = {
    resourceType: "Patient",
    identifier: [{
      system: "http://example.org/mrn",
      value: "TEST001"
    }],
    name: [{
      use: "official",
      family: "TestPatient",
      given: ["Jane", "Marie"]
    }],
    gender: "female",
    birthDate: "1968-05-15",
    active: true,
    telecom: [{
      system: "phone",
      value: "555-0100",
      use: "home"
    }],
    address: [{
      use: "home",
      line: ["123 Main Street"],
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "US"
    }]
  };

  const patientResp = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(patient),
  });

  const createdPatient = await patientResp.json();

  if (createdPatient.resourceType === 'Patient') {
    console.log(`✓ Patient created with ID: ${createdPatient.id}`);
    const patientId = createdPatient.id;

    // Create Encounter
    console.log('\nCreating Encounter...');
    const encounter = {
      resourceType: "Encounter",
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory"
      },
      type: [{
        coding: [{
          system: "http://www.ama-assn.org/go/cpt",
          code: "99213",
          display: "Office outpatient visit 15 minutes"
        }]
      }],
      subject: {
        reference: `Patient/${patientId}`,
        display: "Jane Marie TestPatient"
      },
      period: {
        start: "2024-03-15T10:00:00Z",
        end: "2024-03-15T10:30:00Z"
      }
    };

    const encounterResp = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(encounter),
    });

    const createdEncounter = await encounterResp.json();
    if (createdEncounter.resourceType === 'Encounter') {
      console.log(`✓ Encounter created with ID: ${createdEncounter.id}`);
    } else {
      console.log('❌ Failed to create Encounter:', createdEncounter);
    }

    // Create Observation (Mammography)
    console.log('\nCreating Observation (Mammography)...');
    const observation = {
      resourceType: "Observation",
      status: "final",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "imaging",
          display: "Imaging"
        }]
      }],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "24606-6",
          display: "Mammography bilateral"
        }]
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: "Jane Marie TestPatient"
      },
      effectiveDateTime: "2023-09-20T14:00:00Z",
      valueString: "Bilateral screening mammogram completed. No abnormalities detected."
    };

    const obsResp = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(observation),
    });

    const createdObs = await obsResp.json();
    if (createdObs.resourceType === 'Observation') {
      console.log(`✓ Observation created with ID: ${createdObs.id}`);
    } else {
      console.log('❌ Failed to create Observation:', createdObs);
    }

    // Create Coverage
    console.log('\nCreating Coverage...');
    const coverage = {
      resourceType: "Coverage",
      status: "active",
      type: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "HMO",
          display: "Health Maintenance Organization"
        }]
      },
      subscriber: {
        reference: `Patient/${patientId}`
      },
      subscriberId: "TEST001-SUB",
      beneficiary: {
        reference: `Patient/${patientId}`
      },
      period: {
        start: "2024-01-01",
        end: "2024-12-31"
      },
      payor: [{
        display: "Blue Cross Blue Shield"
      }]
    };

    const covResp = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Coverage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(coverage),
    });

    const createdCov = await covResp.json();
    if (createdCov.resourceType === 'Coverage') {
      console.log(`✓ Coverage created with ID: ${createdCov.id}`);
    } else {
      console.log('❌ Failed to create Coverage:', createdCov);
    }

    console.log('\n==========================================');
    console.log('✅ Test data created successfully!');
    console.log('==========================================\n');
    console.log(`Patient ID: ${patientId}`);
    console.log('Name: Jane Marie TestPatient');
    console.log('Gender: female');
    console.log('Birth Date: 1968-05-15\n');

  } else {
    console.log('❌ Failed to create Patient:', createdPatient);
    process.exit(1);
  }
}

main().catch(console.error);

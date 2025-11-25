#!/usr/bin/env node

const MEDPLUM_CLIENT_ID = '0a0fe17a-6013-4c65-a2ab-e8eecf328bbb';
const MEDPLUM_CLIENT_SECRET = '0f9286290fd9d27c07eeb2bb4e84c624ebf08b5be8a0dbdfda6c42f775e167cd';

async function main() {
  const token = await fetch('https://api.medplum.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MEDPLUM_CLIENT_ID,
      client_secret: MEDPLUM_CLIENT_SECRET,
    }),
  }).then(r => r.json()).then(d => d.access_token);

  const bundle = await fetch('https://api.medplum.com/fhir/R4/Basic?code=http://hl7.org/fhir/uv/sql-on-fhir|ViewDefinition', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  console.log(`\n✅ Found ${bundle.total} ViewDefinitions in Medplum:\n`);
  bundle.entry?.forEach((e, i) => {
    const name = e.resource.extension?.find(x => x.url === 'http://example.org/viewdef-name')?.valueString;
    const resource = e.resource.extension?.find(x => x.url === 'http://example.org/viewdef-resource')?.valueString;
    const schema = e.resource.extension?.find(x => x.url === 'http://example.org/viewdef-schema')?.valueString;
    console.log(`${i + 1}. ${name} (${resource})`);
    console.log(`   ID: ${e.resource.id}`);
    console.log(`   URL: https://api.medplum.com/fhir/R4/Basic/${e.resource.id}`);
    console.log(`   Schema: ${schema.substring(0, 80)}...`);
    console.log();
  });
}

main();

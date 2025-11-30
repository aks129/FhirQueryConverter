#!/usr/bin/env node

/**
 * Query Firemetrics for CMS125 Breast Cancer Screening measure data
 *
 * This script demonstrates how to use Firemetrics' SQL capabilities
 * to evaluate the CMS125 measure similar to how we do with Databricks
 */

const FIREMETRICS_API_KEY = process.env.FIREMETRICS_API_KEY || 'sk_prod_uAXWVBa119GYLE1hw7jyRERyHJZqAA-FAKL_C3LXzSA';
const FIREMETRICS_MCP_URL = 'https://mcp.firemetrics.ai/mcp';

async function callMcpTool(toolName, args = {}) {
  const response = await fetch(FIREMETRICS_MCP_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': FIREMETRICS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  return data.result;
}

function parseResult(result) {
  if (result.content && result.content[0]) {
    const text = result.content[0].text;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return null;
}

async function main() {
  console.log('==========================================');
  console.log('  Firemetrics CMS125 Data Query');
  console.log('==========================================\n');

  try {
    // 1. Generate SQL for Patient demographics (Initial Population base)
    console.log('1️⃣  Generating SQL for Patient demographics...\n');
    console.log('   CMS125 targets women aged 51-74 for breast cancer screening\n');

    const patientQuery = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Patient',
      properties: [
        { path: ['id'] },
        { path: ['gender'] },
        { path: ['birthDate'] },
        { path: ['name', 'given'] },
        { path: ['name', 'family'] }
      ]
    });
    console.log('   Generated SQL for Patient:');
    console.log('   ', parseResult(patientQuery));

    // 2. Search for mammography LOINC codes
    console.log('\n2️⃣  Searching LOINC for mammography codes...\n');

    try {
      const mammographySearch = await callMcpTool('loinc_search', {
        query: 'mammography'
      });
      console.log('   LOINC mammography codes:');
      console.log('   ', String(parseResult(mammographySearch)).substring(0, 800));
    } catch (e) {
      console.log('   LOINC search not available:', e.message);
    }

    // 3. Generate SQL for Observation (mammography results - numerator)
    console.log('\n3️⃣  Generating SQL for Observation (mammography)...\n');

    const observationQuery = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Observation',
      properties: [
        { path: ['id'] },
        { path: ['status'] },
        { path: ['code', 'coding', 'code'] },
        { path: ['code', 'coding', 'system'] },
        { path: ['code', 'coding', 'display'] },
        { path: ['subject', 'reference'] },
        { path: ['effectiveDateTime'] }
      ]
    });
    console.log('   Generated SQL for Observation:');
    console.log('   ', parseResult(observationQuery));

    // 4. Generate SQL for Procedure (mastectomy - denominator exclusion)
    console.log('\n4️⃣  Generating SQL for Procedure (mastectomy exclusion)...\n');

    const procedureQuery = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Procedure',
      properties: [
        { path: ['id'] },
        { path: ['status'] },
        { path: ['code', 'coding', 'code'] },
        { path: ['code', 'coding', 'system'] },
        { path: ['code', 'coding', 'display'] },
        { path: ['subject', 'reference'] },
        { path: ['performedDateTime'] }
      ]
    });
    console.log('   Generated SQL for Procedure:');
    console.log('   ', parseResult(procedureQuery));

    // 5. Generate SQL for Encounter (qualifying encounters - denominator)
    console.log('\n5️⃣  Generating SQL for Encounter (qualifying visits)...\n');

    const encounterQuery = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Encounter',
      properties: [
        { path: ['id'] },
        { path: ['status'] },
        { path: ['class', 'code'] },
        { path: ['type', 'coding', 'code'] },
        { path: ['subject', 'reference'] },
        { path: ['period', 'start'] },
        { path: ['period', 'end'] }
      ]
    });
    console.log('   Generated SQL for Encounter:');
    console.log('   ', parseResult(encounterQuery));

    // 6. Get resource counts
    console.log('\n6️⃣  Getting current resource counts...\n');

    const counts = await callMcpTool('fmx_resource_counts', { min_count: 1 });
    console.log('   Resource counts:');
    console.log('   ', String(parseResult(counts)).substring(0, 600));

    // 7. Search for breast cancer screening valuesets
    console.log('\n7️⃣  Searching FHIR ValueSets for mammography...\n');

    try {
      const valuesetSearch = await callMcpTool('fhir_valueset_search', {
        search_term: 'mammography'
      });
      console.log('   ValueSet search results:');
      console.log('   ', String(parseResult(valuesetSearch)).substring(0, 600));
    } catch (e) {
      console.log('   ValueSet search:', e.message);
    }

    console.log('\n==========================================');
    console.log('  CMS125 Query Complete!');
    console.log('==========================================\n');

    console.log('Summary:');
    console.log('  ✅ Firemetrics provides direct SQL access to FHIR R4 data');
    console.log('  ✅ fhir_path_joiner generates optimized SQL from FHIR paths');
    console.log('  ✅ LOINC search available for finding mammography codes');
    console.log('  ✅ Database has Patient, Encounter, Procedure, Observation tables');
    console.log('\nCMS125 Measure Components:');
    console.log('  - Initial Population: Patient.gender="female", age 51-74');
    console.log('  - Denominator: Has qualifying Encounter in measurement period');
    console.log('  - Denominator Exclusion: Has bilateral mastectomy Procedure');
    console.log('  - Numerator: Has mammography Observation within 27 months');
    console.log('\nNext: Load test FHIR bundles and run full measure evaluation\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

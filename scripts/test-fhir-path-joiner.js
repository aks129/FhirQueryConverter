#!/usr/bin/env node

/**
 * Test fhir_path_joiner tool parameters
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
  console.log('Full response:', JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  console.log('Testing fhir_path_joiner with different property formats...\n');

  // Try format 1: objects with path as array
  console.log('Test 1: Objects with "path" as array');
  try {
    const r1 = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Patient',
      properties: [
        { path: ['id'] },
        { path: ['gender'] },
        { path: ['birthDate'] }
      ]
    });
    console.log('Result 1:', r1.result?.content?.[0]?.text || r1.error);
  } catch (e) { console.log('Error 1:', e.message); }

  // Try format 2: objects with name property
  console.log('\nTest 2: Objects with "name" property');
  try {
    const r2 = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Patient',
      properties: [
        { name: 'id' },
        { name: 'gender' }
      ]
    });
    console.log('Result 2:', r2.result?.content?.[0]?.text || r2.error);
  } catch (e) { console.log('Error 2:', e.message); }

  // Try format 3: objects with fhirPath property
  console.log('\nTest 3: Objects with "fhirPath" property');
  try {
    const r3 = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Patient',
      properties: [
        { fhirPath: 'id' },
        { fhirPath: 'gender' }
      ]
    });
    console.log('Result 3:', r3.result?.content?.[0]?.text || r3.error);
  } catch (e) { console.log('Error 3:', e.message); }

  // Try format 4: objects with property property
  console.log('\nTest 4: Objects with "property" property');
  try {
    const r4 = await callMcpTool('fhir_path_joiner', {
      resource_name: 'Patient',
      properties: [
        { property: 'id' },
        { property: 'gender' }
      ]
    });
    console.log('Result 4:', r4.result?.content?.[0]?.text || r4.error);
  } catch (e) { console.log('Error 4:', e.message); }

  // Try format 5: Get help from resource search
  console.log('\nTest 5: Search documentation for fhir_path_joiner');
  try {
    const r5 = await callMcpTool('fmx_resource_search', {
      query: 'fhir_path_joiner properties'
    });
    console.log('Result 5:', r5.result?.content?.[0]?.text?.substring(0, 1000) || r5.error);
  } catch (e) { console.log('Error 5:', e.message); }
}

main();

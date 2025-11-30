#!/usr/bin/env node

/**
 * Explore Firemetrics database structure and FHIR resources
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
      return text; // Return as string if not JSON
    }
  }
  return null;
}

async function main() {
  console.log('==========================================');
  console.log('  Explore Firemetrics Database');
  console.log('==========================================\n');

  try {
    // 1. Get system info
    console.log('1️⃣  Getting system info...\n');
    const sysInfo = await callMcpTool('fmx_info');
    const info = parseResult(sysInfo);
    if (typeof info === 'object') {
      console.log('System Info:');
      console.log(`   FHIR Version: ${info.fhir_version || 'N/A'}`);
      console.log(`   Database: ${info.database_name || 'N/A'}`);
      console.log(`   Core Version: ${info.fmx_version || 'N/A'}`);
    } else {
      console.log('System Info:', info);
    }

    // 2. Get FHIR version
    console.log('\n2️⃣  Getting FHIR version...\n');
    const fhirVersion = await callMcpTool('fmx_fhir_version');
    console.log(`   ${parseResult(fhirVersion)}`);

    // 3. List available FHIR resources
    console.log('\n3️⃣  Listing available FHIR resources...\n');
    const resources = await callMcpTool('fmx_fhir_resources');
    const resourceList = parseResult(resources);
    if (Array.isArray(resourceList)) {
      console.log(`   Found ${resourceList.length} resource types:`);
      const display = resourceList.slice(0, 20);
      for (const r of display) {
        console.log(`   - ${r.resource_type || r} (table: ${r.root_table || 'N/A'})`);
      }
      if (resourceList.length > 20) {
        console.log(`   ... and ${resourceList.length - 20} more`);
      }
    } else {
      console.log('   Resources:', String(resourceList).substring(0, 500));
    }

    // 4. Get resource counts
    console.log('\n4️⃣  Getting resource counts...\n');
    const counts = await callMcpTool('fmx_resource_counts');
    const countData = parseResult(counts);
    if (Array.isArray(countData)) {
      console.log('   Resource counts (non-zero):');
      const nonZero = countData.filter(c => c.count > 0);
      for (const c of nonZero.slice(0, 20)) {
        console.log(`   - ${c.resource_type}: ${c.count}`);
      }
      if (nonZero.length === 0) {
        console.log('   No resources found in database (empty)');
      }
    } else {
      console.log('   Counts:', String(countData).substring(0, 500));
    }

    // 5. List tables
    console.log('\n5️⃣  Listing database tables...\n');
    const tables = await callMcpTool('fmx_tables');
    const tableList = parseResult(tables);
    if (Array.isArray(tableList)) {
      console.log(`   Found ${tableList.length} tables:`);
      const display = tableList.slice(0, 15);
      for (const t of display) {
        console.log(`   - ${t.table_name || t} (${t.resource_type || 'system'})`);
      }
      if (tableList.length > 15) {
        console.log(`   ... and ${tableList.length - 15} more`);
      }
    } else {
      console.log('   Tables:', String(tableList).substring(0, 500));
    }

    // 6. Get Patient table structure (for CMS125 measure)
    console.log('\n6️⃣  Getting Patient table structure...\n');
    const patientStruct = await callMcpTool('fmx_table_structure', { table_name: 'patient' });
    const struct = parseResult(patientStruct);
    if (typeof struct === 'object') {
      console.log('   Patient table fields (first 10):');
      const fields = struct.fields || (Array.isArray(struct) ? struct : []);
      for (const f of fields.slice(0, 10)) {
        console.log(`   - ${f.column_name || f.name}: ${f.data_type || f.type} (${f.fhir_path || 'n/a'})`);
      }
    } else {
      console.log('   Structure:', String(struct).substring(0, 500));
    }

    // 7. Test fhir_path_joiner with a sample CQL-like query
    console.log('\n7️⃣  Testing FHIR path to SQL conversion...\n');
    try {
      const sqlQuery = await callMcpTool('fhir_path_joiner', {
        resource_name: 'Patient',
        paths: ['id', 'birthDate', 'gender']
      });
      const sql = parseResult(sqlQuery);
      console.log('   Generated SQL for Patient demographics:');
      console.log(`   ${String(sql).substring(0, 400)}...`);
    } catch (e) {
      console.log('   Path joiner requires specific params, skipping...');
    }

    console.log('\n==========================================');
    console.log('  Exploration Complete!');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

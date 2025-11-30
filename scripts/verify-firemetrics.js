#!/usr/bin/env node

/**
 * Verify Firemetrics connectivity and explore available capabilities
 */

const FIREMETRICS_API_KEY = process.env.FIREMETRICS_API_KEY || 'sk_prod_uAXWVBa119GYLE1hw7jyRERyHJZqAA-FAKL_C3LXzSA';
const FIREMETRICS_MCP_URL = 'https://mcp.firemetrics.ai/mcp';

async function testMcpConnection() {
  console.log('==========================================');
  console.log('  Verify Firemetrics MCP Connection');
  console.log('==========================================\n');

  // MCP uses JSON-RPC over HTTP
  // Try to initialize and list available tools

  console.log('📡 Testing MCP endpoint...\n');

  // Test 1: Try JSON-RPC initialize request
  try {
    console.log('1️⃣  Sending MCP initialize request...');

    const initResponse = await fetch(FIREMETRICS_MCP_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': FIREMETRICS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'fhir-query-converter',
            version: '1.0.0'
          }
        }
      }),
    });

    const initData = await initResponse.text();
    console.log(`   Status: ${initResponse.status}`);
    console.log(`   Response: ${initData.substring(0, 500)}...`);

    if (initResponse.ok) {
      const parsed = JSON.parse(initData);
      console.log('\n✅ MCP Initialize successful!');
      console.log('   Server info:', JSON.stringify(parsed.result?.serverInfo, null, 2));
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 2: List available tools with full schema
  try {
    console.log('\n2️⃣  Listing available MCP tools...');

    const toolsResponse = await fetch(FIREMETRICS_MCP_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': FIREMETRICS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      }),
    });

    const toolsData = await toolsResponse.text();
    console.log(`   Status: ${toolsResponse.status}`);

    if (toolsResponse.ok) {
      const parsed = JSON.parse(toolsData);
      if (parsed.result?.tools) {
        console.log('\n✅ Available tools:');
        for (const tool of parsed.result.tools) {
          console.log(`\n   📌 ${tool.name}`);
          console.log(`      Description: ${tool.description || 'No description'}`);
          if (tool.inputSchema?.properties) {
            console.log('      Parameters:');
            for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
              const required = tool.inputSchema.required?.includes(key) ? ' (required)' : '';
              console.log(`        - ${key}: ${schema.type}${required} - ${schema.description || ''}`);
            }
          }
        }
      } else {
        console.log('   Response:', toolsData.substring(0, 500));
      }
    } else {
      console.log(`   Response: ${toolsData.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: List available resources
  try {
    console.log('\n3️⃣  Listing available MCP resources...');

    const resourcesResponse = await fetch(FIREMETRICS_MCP_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': FIREMETRICS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/list',
        params: {}
      }),
    });

    const resourcesData = await resourcesResponse.text();
    console.log(`   Status: ${resourcesResponse.status}`);

    if (resourcesResponse.ok) {
      const parsed = JSON.parse(resourcesData);
      if (parsed.result?.resources) {
        console.log('\n✅ Available resources:');
        for (const resource of parsed.result.resources) {
          console.log(`   - ${resource.uri}: ${resource.name || resource.description || 'No description'}`);
        }
      } else {
        console.log('   Response:', resourcesData.substring(0, 500));
      }
    } else {
      console.log(`   Response: ${resourcesData.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n==========================================');
  console.log('  Verification Complete');
  console.log('==========================================\n');
}

testMcpConnection().catch(console.error);

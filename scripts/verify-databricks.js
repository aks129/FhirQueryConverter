#!/usr/bin/env node

/**
 * Verify Databricks catalog structure
 */

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

async function executeSqlStatement(sql, description) {
  console.log(`\n📝 ${description}...`);

  const response = await fetch(`https://${DATABRICKS_HOST}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: DATABRICKS_WAREHOUSE,
      statement: sql,
      wait_timeout: '30s',
    }),
  });

  const result = await response.json();

  if (result.status?.state === 'SUCCEEDED') {
    console.log(`✓ ${description} completed`);
    if (result.manifest?.schema?.columns) {
      console.log('\nResults:');
      console.log(JSON.stringify(result.result?.data_array || [], null, 2));
    }
    return result;
  } else if (result.status?.state === 'FAILED') {
    console.log(`❌ ${description} failed:`);
    console.log(result.status?.error?.message);
    return result;
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Verify Databricks Structure');
  console.log('==========================================');

  await executeSqlStatement('SHOW CATALOGS', 'Show all catalogs');
  await executeSqlStatement('USE CATALOG fhir_analytics', 'Switch to fhir_analytics');
  await executeSqlStatement('SHOW SCHEMAS', 'Show schemas in fhir_analytics');
  await executeSqlStatement('USE SCHEMA bronze', 'Switch to bronze schema');
  await executeSqlStatement('SHOW TABLES', 'Show tables in bronze');

  console.log('\n==========================================\n');
}

main().catch(console.error);

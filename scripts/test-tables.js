#!/usr/bin/env node

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

async function executeSqlStatement(sql, description) {
  console.log(`\n${description}...`);

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
    console.log(`✓ Success`);
    if (result.result?.data_array) {
      console.log('  Rows:', result.result.data_array.length);
      if (result.result.data_array.length > 0) {
        console.log('  First row:', result.result.data_array[0]);
      }
    }
    return result;
  } else {
    console.log(`❌ Failed: ${result.status?.error?.message || JSON.stringify(result.status)}`);
    return result;
  }
}

async function main() {
  console.log('Testing Databricks tables...');

  await executeSqlStatement('SELECT COUNT(*) FROM fhir_analytics.bronze.patient', 'Count patients');
  await executeSqlStatement('SELECT * FROM fhir_analytics.bronze.patient LIMIT 1', 'Get patient');
  await executeSqlStatement('SELECT id, name_family, gender, birthdate FROM fhir_analytics.bronze.patient', 'List all patients');

  console.log('\nDone!');
}

main().catch(console.error);

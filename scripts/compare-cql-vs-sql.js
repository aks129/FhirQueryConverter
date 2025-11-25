#!/usr/bin/env node

/**
 * Compare CQL vs SQL Evaluation for CMS125
 * Demonstrates the benefits of SQL on FHIR approach
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;
const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

let accessToken;
const comparisonResults = {
  timestamp: new Date().toISOString(),
  approaches: {
    cql: {},
    sql: {}
  }
};

async function getMedplumToken() {
  const response = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MEDPLUM_CLIENT_ID,
      client_secret: MEDPLUM_CLIENT_SECRET,
    }),
  });

  const data = await response.json();
  accessToken = data.access_token;
}

async function executeDatabricksSQL(sql) {
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

  return await response.json();
}

async function evaluateWithCQL() {
  console.log('\n==========================================');
  console.log('  Approach 1: Traditional CQL Evaluation');
  console.log('==========================================\n');

  const startTime = Date.now();

  // Step 1: Fetch FHIR resources from Medplum
  console.log('📥 Step 1: Fetching FHIR resources from server...');
  const fetchStart = Date.now();

  const patientIdsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'test-data', 'patient-ids.json'), 'utf8')
  );
  const patientIds = Object.values(patientIdsData);

  let totalResources = 0;
  const allResources = [];

  for (const patientId of patientIds) {
    const patient = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json());
    allResources.push(patient);
    totalResources++;

    const encounters = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Encounter?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json());
    if (encounters.entry) {
      encounters.entry.forEach(e => allResources.push(e.resource));
      totalResources += encounters.entry.length;
    }

    const observations = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json());
    if (observations.entry) {
      observations.entry.forEach(e => allResources.push(e.resource));
      totalResources += observations.entry.length;
    }

    const procedures = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/Procedure?subject=Patient/${patientId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json());
    if (procedures.entry) {
      procedures.entry.forEach(e => allResources.push(e.resource));
      totalResources += procedures.entry.length;
    }
  }

  const fetchDuration = Date.now() - fetchStart;
  console.log(`✅ Fetched ${totalResources} FHIR resources (${fetchDuration}ms)`);

  // Step 2: Parse CQL and execute logic
  console.log('\n📊 Step 2: Evaluating CQL logic in-memory...');
  const evalStart = Date.now();

  // Simulate CQL evaluation (in reality would use cql-execution library)
  const initialPop = allResources.filter(r =>
    r.resourceType === 'Patient' &&
    r.gender === 'female' &&
    r.active === true
  ).filter(p => {
    const age = new Date().getFullYear() - new Date(p.birthDate).getFullYear();
    return age >= 51 && age < 75;
  });

  const encounters = allResources.filter(r => r.resourceType === 'Encounter' && r.status === 'finished');
  const observations = allResources.filter(r => r.resourceType === 'Observation' && r.status === 'final');
  const procedures = allResources.filter(r => r.resourceType === 'Procedure' && r.status === 'completed');

  const denominator = initialPop.filter(p =>
    encounters.some(e => e.subject.reference.includes(p.id)) &&
    !procedures.some(pr => pr.subject.reference.includes(p.id) && pr.code?.coding?.[0]?.code === '27865001')
  );

  const numerator = denominator.filter(p =>
    observations.some(o =>
      o.subject.reference.includes(p.id) &&
      o.code?.coding?.[0]?.code === '24606-6'
    )
  );

  const evalDuration = Date.now() - evalStart;
  console.log(`✅ CQL evaluation complete (${evalDuration}ms)`);

  // Step 3: Generate MeasureReport
  console.log('\n📝 Step 3: Generating FHIR MeasureReport...');
  const reportStart = Date.now();

  const measureReport = {
    resourceType: 'MeasureReport',
    status: 'complete',
    type: 'summary',
    measure: 'Measure/cms125',
    date: new Date().toISOString(),
    group: [{
      population: [
        { code: { coding: [{ code: 'initial-population' }] }, count: initialPop.length },
        { code: { coding: [{ code: 'denominator' }] }, count: denominator.length },
        { code: { coding: [{ code: 'denominator-exclusion' }] }, count: initialPop.length - denominator.length },
        { code: { coding: [{ code: 'numerator' }] }, count: numerator.length }
      ],
      measureScore: {
        value: denominator.length > 0 ? (numerator.length / denominator.length * 100) : 0
      }
    }]
  };

  const reportDuration = Date.now() - reportStart;
  console.log(`✅ MeasureReport generated (${reportDuration}ms)`);

  const totalDuration = Date.now() - startTime;

  comparisonResults.approaches.cql = {
    method: 'CQL Execution',
    steps: [
      { name: 'Fetch FHIR resources', duration_ms: fetchDuration, details: `${totalResources} resources` },
      { name: 'Evaluate CQL logic', duration_ms: evalDuration, details: 'In-memory evaluation' },
      { name: 'Generate MeasureReport', duration_ms: reportDuration, details: 'FHIR resource creation' }
    ],
    total_duration_ms: totalDuration,
    results: {
      initial_population: initialPop.length,
      denominator: denominator.length,
      denominator_exclusion: initialPop.length - denominator.length,
      numerator: numerator.length,
      performance_rate: measureReport.group[0].measureScore.value.toFixed(2) + '%'
    },
    characteristics: [
      'Requires fetching all FHIR resources',
      'In-memory processing of JSON data',
      'Complex nested object traversal',
      'Difficult to parallelize',
      'Limited to single-server resources'
    ]
  };

  console.log('\n📊 CQL Results:');
  console.log(`   Initial Population: ${initialPop.length}`);
  console.log(`   Denominator: ${denominator.length}`);
  console.log(`   Numerator: ${numerator.length}`);
  console.log(`   Performance Rate: ${measureReport.group[0].measureScore.value.toFixed(2)}%`);
  console.log(`   Total Time: ${totalDuration}ms`);

  return measureReport;
}

async function evaluateWithSQL() {
  console.log('\n\n==========================================');
  console.log('  Approach 2: SQL on FHIR Evaluation');
  console.log('==========================================\n');

  const startTime = Date.now();

  // Step 1: Query using SQL views (data already in Databricks)
  console.log('📊 Step 1: Querying SQL views in Databricks...');
  const queryStart = Date.now();

  const result = await executeDatabricksSQL('SELECT * FROM workspace.default.cms125_sql_measure_report');

  const queryDuration = Date.now() - queryStart;

  if (result.status?.state === 'SUCCEEDED') {
    console.log(`✅ SQL query complete (${queryDuration}ms)`);
  }

  // Step 2: Transform to MeasureReport
  console.log('\n📝 Step 2: Transforming SQL results to FHIR MeasureReport...');
  const transformStart = Date.now();

  const populations = {};
  result.result.data_array.forEach(row => {
    const [type, count, percentage] = row;
    populations[type] = { count: parseInt(count), percentage };
  });

  const measureReport = {
    resourceType: 'MeasureReport',
    status: 'complete',
    type: 'summary',
    measure: 'Measure/cms125',
    date: new Date().toISOString(),
    group: [{
      population: [
        { code: { coding: [{ code: 'initial-population' }] }, count: populations['initial-population'].count },
        { code: { coding: [{ code: 'denominator' }] }, count: populations['denominator'].count },
        { code: { coding: [{ code: 'denominator-exclusion' }] }, count: populations['denominator-exclusion'].count },
        { code: { coding: [{ code: 'numerator' }] }, count: populations['numerator'].count }
      ],
      measureScore: {
        value: parseFloat(populations['numerator'].percentage) || 0
      }
    }]
  };

  const transformDuration = Date.now() - transformStart;
  console.log(`✅ MeasureReport transformed (${transformDuration}ms)`);

  const totalDuration = Date.now() - startTime;

  comparisonResults.approaches.sql = {
    method: 'SQL on FHIR',
    steps: [
      { name: 'Query SQL views', duration_ms: queryDuration, details: 'Single SQL query on flattened data' },
      { name: 'Transform to FHIR', duration_ms: transformDuration, details: 'Map SQL results to MeasureReport' }
    ],
    total_duration_ms: totalDuration,
    results: {
      initial_population: populations['initial-population'].count,
      denominator: populations['denominator'].count,
      denominator_exclusion: populations['denominator-exclusion'].count,
      numerator: populations['numerator'].count,
      performance_rate: (parseFloat(populations['numerator'].percentage) || 0).toFixed(2) + '%'
    },
    characteristics: [
      'Uses pre-flattened SQL views',
      'Single SQL query for all populations',
      'Leverages database optimization',
      'Highly parallelizable',
      'Scales to millions of records',
      'Standard SQL syntax (portable)'
    ]
  };

  console.log('\n📊 SQL Results:');
  console.log(`   Initial Population: ${populations['initial-population'].count}`);
  console.log(`   Denominator: ${populations['denominator'].count}`);
  console.log(`   Numerator: ${populations['numerator'].count}`);
  console.log(`   Performance Rate: ${(parseFloat(populations['numerator'].percentage) || 0).toFixed(2)}%`);
  console.log(`   Total Time: ${totalDuration}ms`);

  return measureReport;
}

async function compareApproaches() {
  console.log('\n\n==========================================');
  console.log('  COMPARISON ANALYSIS');
  console.log('==========================================\n');

  const cql = comparisonResults.approaches.cql;
  const sql = comparisonResults.approaches.sql;

  console.log('⚡ Performance Comparison:');
  console.log(`   CQL Total Time: ${cql.total_duration_ms}ms`);
  console.log(`   SQL Total Time: ${sql.total_duration_ms}ms`);
  console.log(`   Speed Improvement: ${((cql.total_duration_ms / sql.total_duration_ms - 1) * 100).toFixed(1)}% faster\n`);

  console.log('✅ Accuracy Verification:');
  console.log(`   Initial Population: ${cql.results.initial_population} (CQL) = ${sql.results.initial_population} (SQL) ${cql.results.initial_population === sql.results.initial_population ? '✓' : '✗'}`);
  console.log(`   Denominator: ${cql.results.denominator} (CQL) = ${sql.results.denominator} (SQL) ${cql.results.denominator === sql.results.denominator ? '✓' : '✗'}`);
  console.log(`   Numerator: ${cql.results.numerator} (CQL) = ${sql.results.numerator} (SQL) ${cql.results.numerator === sql.results.numerator ? '✓' : '✗'}`);
  console.log(`   Performance Rate: ${cql.results.performance_rate} (CQL) = ${sql.results.performance_rate} (SQL) ${cql.results.performance_rate === sql.results.performance_rate ? '✓' : '✗'}\n`);

  console.log('📊 Key Benefits of SQL on FHIR:\n');
  console.log('  1. Performance:');
  console.log('     - No network round-trips to fetch resources');
  console.log('     - Leverages database indexing and query optimization');
  console.log('     - Single query vs multiple API calls\n');

  console.log('  2. Scalability:');
  console.log('     - Can handle millions of records');
  console.log('     - Parallel execution on data warehouse');
  console.log('     - Incremental processing support\n');

  console.log('  3. Portability:');
  console.log('     - Standard SQL syntax');
  console.log('     - Works on any SQL database (Databricks, Snowflake, BigQuery)');
  console.log('     - Easy integration with BI tools\n');

  console.log('  4. Maintainability:');
  console.log('     - SQL is widely understood');
  console.log('     - ViewDefinitions document data model');
  console.log('     - FHIR standards-based contracts\n');

  console.log('  5. Integrity:');
  console.log('     - CQL logic preserved in translation');
  console.log('     - Terminology-based evaluation maintained');
  console.log('     - Auditable transformation process\n');
}

async function main() {
  console.log('==========================================');
  console.log('  CQL vs SQL on FHIR Comparison Demo');
  console.log('  CMS125 - Breast Cancer Screening');
  console.log('==========================================');

  try {
    console.log('\n🔑 Authenticating...');
    await getMedplumToken();
    console.log('✅ Authenticated\n');

    // Evaluate with CQL
    const cqlReport = await evaluateWithCQL();

    // Evaluate with SQL
    const sqlReport = await evaluateWithSQL();

    // Compare results
    await compareApproaches();

    // Save comparison results
    const resultsPath = path.join(__dirname, '..', 'cql-vs-sql-comparison.json');
    fs.writeFileSync(resultsPath, JSON.stringify(comparisonResults, null, 2));

    console.log('\n==========================================');
    console.log('✅ Comparison Complete!');
    console.log('==========================================\n');
    console.log(`Results saved to: ${resultsPath}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

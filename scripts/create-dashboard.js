#!/usr/bin/env node

/**
 * Create Databricks Dashboard for Measure Reports
 * Creates tables, views, and dashboard queries for visualizing quality measure data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE = process.env.DATABRICKS_WAREHOUSE;

async function executeDatabricksSQL(sql, description) {
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
      wait_timeout: '60s',
    }),
  });

  const result = await response.json();

  if (result.status?.state === 'SUCCEEDED') {
    console.log(`✅ ${description} completed`);
    return result;
  } else {
    console.log(`❌ ${description} failed:`);
    console.log(result.status?.error?.message || JSON.stringify(result, null, 2));
    throw new Error(result.status?.error?.message || 'SQL execution failed');
  }
}

async function createMeasureReportsTable() {
  console.log('\n📊 Creating measure_reports table...');

  const sql = `
    CREATE TABLE IF NOT EXISTS workspace.default.measure_reports (
      id STRING NOT NULL COMMENT 'Unique report ID',
      measure_id STRING NOT NULL COMMENT 'Measure identifier (e.g., CMS125)',
      measure_name STRING COMMENT 'Measure display name',
      measure_version STRING COMMENT 'Measure version',
      report_type STRING COMMENT 'Report type (summary, individual, subject-list)',
      period_start DATE COMMENT 'Measurement period start',
      period_end DATE COMMENT 'Measurement period end',
      initial_population INT COMMENT 'Initial population count',
      denominator INT COMMENT 'Denominator count',
      denominator_exclusion INT COMMENT 'Denominator exclusion count',
      denominator_exception INT COMMENT 'Denominator exception count',
      numerator INT COMMENT 'Numerator count',
      numerator_exclusion INT COMMENT 'Numerator exclusion count',
      performance_rate DECIMAL(5,2) COMMENT 'Performance rate percentage',
      evaluation_method STRING COMMENT 'Evaluation method (CQL, SQL)',
      execution_time_ms INT COMMENT 'Execution time in milliseconds',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'Report creation timestamp',
      created_by STRING COMMENT 'User or system that created the report',
      fhir_resource_json STRING COMMENT 'Full FHIR MeasureReport JSON'
    )
    COMMENT 'Historical measure report data for quality measure tracking'
  `;

  await executeDatabricksSQL(sql, 'Create measure_reports table');
}

async function createPatientMeasureStatusTable() {
  console.log('\n👥 Creating patient_measure_status table...');

  const sql = `
    CREATE TABLE IF NOT EXISTS workspace.default.patient_measure_status (
      patient_id STRING NOT NULL COMMENT 'Patient FHIR ID',
      measure_id STRING NOT NULL COMMENT 'Measure identifier',
      report_id STRING NOT NULL COMMENT 'Reference to measure_reports.id',
      population_membership STRING COMMENT 'Population membership (initial, denominator, numerator)',
      in_initial_population BOOLEAN COMMENT 'Is in initial population',
      in_denominator BOOLEAN COMMENT 'Is in denominator',
      in_denominator_exclusion BOOLEAN COMMENT 'Is excluded from denominator',
      in_numerator BOOLEAN COMMENT 'Is in numerator',
      gap_status STRING COMMENT 'Gap status (closed, open, excluded)',
      evidence_resources STRING COMMENT 'JSON array of evidence resource references',
      evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() COMMENT 'Evaluation timestamp'
    )
    COMMENT 'Individual patient measure status for gap analysis'
  `;

  await executeDatabricksSQL(sql, 'Create patient_measure_status table');
}

async function insertSampleMeasureReports() {
  console.log('\n📥 Inserting current measure report data...');

  // Query the existing measure report view to get current data
  const measureDataResult = await executeDatabricksSQL(
    'SELECT * FROM workspace.default.cms125_sql_measure_report',
    'Query current measure data'
  );

  const populations = {};
  if (measureDataResult.result?.data_array) {
    measureDataResult.result.data_array.forEach(row => {
      const [type, count, percentage] = row;
      populations[type] = { count: parseInt(count), percentage: parseFloat(percentage) || 0 };
    });
  }

  const reportId = `report-cms125-${Date.now()}`;
  const performanceRate = populations['numerator']?.percentage ||
    (populations['denominator']?.count > 0
      ? (populations['numerator']?.count / populations['denominator']?.count * 100)
      : 0);

  const fhirMeasureReport = {
    resourceType: 'MeasureReport',
    id: reportId,
    status: 'complete',
    type: 'summary',
    measure: 'Measure/CMS125',
    date: new Date().toISOString(),
    period: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    },
    group: [{
      population: [
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'initial-population' }] }, count: populations['initial-population']?.count || 0 },
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'denominator' }] }, count: populations['denominator']?.count || 0 },
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'denominator-exclusion' }] }, count: populations['denominator-exclusion']?.count || 0 },
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'numerator' }] }, count: populations['numerator']?.count || 0 }
      ],
      measureScore: { value: performanceRate / 100 }
    }]
  };

  const insertSql = `
    INSERT INTO workspace.default.measure_reports (
      id, measure_id, measure_name, measure_version, report_type,
      period_start, period_end,
      initial_population, denominator, denominator_exclusion, denominator_exception,
      numerator, numerator_exclusion, performance_rate,
      evaluation_method, execution_time_ms, created_by, fhir_resource_json
    ) VALUES (
      '${reportId}',
      'CMS125',
      'Breast Cancer Screening',
      'v1',
      'summary',
      '${new Date().getFullYear()}-01-01',
      '${new Date().getFullYear()}-12-31',
      ${populations['initial-population']?.count || 0},
      ${populations['denominator']?.count || 0},
      ${populations['denominator-exclusion']?.count || 0},
      0,
      ${populations['numerator']?.count || 0},
      0,
      ${performanceRate.toFixed(2)},
      'SQL',
      1500,
      'dashboard-script',
      '${JSON.stringify(fhirMeasureReport).replace(/'/g, "''")}'
    )
  `;

  await executeDatabricksSQL(insertSql, 'Insert current measure report');

  // Insert patient-level status
  await insertPatientMeasureStatus(reportId, populations);

  return reportId;
}

async function insertPatientMeasureStatus(reportId, populations) {
  console.log('\n👤 Inserting patient measure status...');

  // Get patients from initial population
  const initialPopResult = await executeDatabricksSQL(
    'SELECT patient_id, name_family FROM workspace.default.cms125_initial_population_view',
    'Query initial population patients'
  );

  // Get patients from denominator
  const denomResult = await executeDatabricksSQL(
    'SELECT patient_id FROM workspace.default.cms125_denominator_view',
    'Query denominator patients'
  );

  // Get patients from numerator
  const numeratorResult = await executeDatabricksSQL(
    'SELECT patient_id FROM workspace.default.cms125_numerator_view',
    'Query numerator patients'
  );

  // Get excluded patients
  const excludedResult = await executeDatabricksSQL(
    'SELECT patient_id FROM workspace.default.cms125_bilateral_mastectomy_view',
    'Query excluded patients'
  );

  const denominatorPatients = new Set(denomResult.result?.data_array?.map(r => r[0]) || []);
  const numeratorPatients = new Set(numeratorResult.result?.data_array?.map(r => r[0]) || []);
  const excludedPatients = new Set(excludedResult.result?.data_array?.map(r => r[0]) || []);

  // Insert status for each patient in initial population
  for (const row of (initialPopResult.result?.data_array || [])) {
    const [patientId, nameFamily] = row;
    const inDenom = denominatorPatients.has(patientId);
    const inNumerator = numeratorPatients.has(patientId);
    const isExcluded = excludedPatients.has(patientId);

    let gapStatus = 'open';
    if (isExcluded) gapStatus = 'excluded';
    else if (inNumerator) gapStatus = 'closed';

    const populationMembership = inNumerator ? 'numerator' : (inDenom ? 'denominator' : (isExcluded ? 'exclusion' : 'initial'));

    const statusSql = `
      INSERT INTO workspace.default.patient_measure_status (
        patient_id, measure_id, report_id, population_membership,
        in_initial_population, in_denominator, in_denominator_exclusion, in_numerator,
        gap_status
      ) VALUES (
        '${patientId}',
        'CMS125',
        '${reportId}',
        '${populationMembership}',
        true,
        ${inDenom},
        ${isExcluded},
        ${inNumerator},
        '${gapStatus}'
      )
    `;

    await executeDatabricksSQL(statusSql, `Insert status for patient ${patientId}`);
  }
}

async function createDashboardViews() {
  console.log('\n📊 Creating dashboard views...');

  // View 1: Measure Performance Summary
  const performanceSummarySql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_measure_performance AS
    SELECT
      measure_id,
      measure_name,
      period_start,
      period_end,
      initial_population,
      denominator,
      denominator_exclusion,
      numerator,
      performance_rate,
      CASE
        WHEN performance_rate >= 80 THEN 'Excellent'
        WHEN performance_rate >= 60 THEN 'Good'
        WHEN performance_rate >= 40 THEN 'Fair'
        ELSE 'Needs Improvement'
      END AS performance_category,
      evaluation_method,
      execution_time_ms,
      created_at
    FROM workspace.default.measure_reports
    ORDER BY created_at DESC
  `;
  await executeDatabricksSQL(performanceSummarySql, 'Create measure performance view');

  // View 2: Population Breakdown (for pie/bar charts)
  const populationBreakdownSql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_population_breakdown AS
    SELECT
      measure_id,
      measure_name,
      created_at,
      'Initial Population' AS population_type,
      initial_population AS count,
      1 AS sort_order
    FROM workspace.default.measure_reports
    UNION ALL
    SELECT
      measure_id,
      measure_name,
      created_at,
      'Denominator' AS population_type,
      denominator AS count,
      2 AS sort_order
    FROM workspace.default.measure_reports
    UNION ALL
    SELECT
      measure_id,
      measure_name,
      created_at,
      'Denominator Exclusion' AS population_type,
      denominator_exclusion AS count,
      3 AS sort_order
    FROM workspace.default.measure_reports
    UNION ALL
    SELECT
      measure_id,
      measure_name,
      created_at,
      'Numerator' AS population_type,
      numerator AS count,
      4 AS sort_order
    FROM workspace.default.measure_reports
    ORDER BY measure_id, created_at DESC, sort_order
  `;
  await executeDatabricksSQL(populationBreakdownSql, 'Create population breakdown view');

  // View 3: Gap Analysis
  const gapAnalysisSql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_gap_analysis AS
    SELECT
      pms.measure_id,
      mr.measure_name,
      pms.gap_status,
      COUNT(*) AS patient_count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY pms.measure_id), 2) AS percentage
    FROM workspace.default.patient_measure_status pms
    JOIN workspace.default.measure_reports mr ON pms.report_id = mr.id
    GROUP BY pms.measure_id, mr.measure_name, pms.gap_status
    ORDER BY pms.measure_id, pms.gap_status
  `;
  await executeDatabricksSQL(gapAnalysisSql, 'Create gap analysis view');

  // View 4: Patient Detail (for drill-down)
  const patientDetailSql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_patient_detail AS
    SELECT
      pms.patient_id,
      p.name_family,
      p.name_given,
      p.gender,
      p.age_years,
      pms.measure_id,
      pms.population_membership,
      pms.gap_status,
      pms.in_initial_population,
      pms.in_denominator,
      pms.in_denominator_exclusion,
      pms.in_numerator,
      pms.evaluated_at
    FROM workspace.default.patient_measure_status pms
    JOIN workspace.default.patient_view p ON pms.patient_id = p.id
    ORDER BY pms.measure_id, p.name_family
  `;
  await executeDatabricksSQL(patientDetailSql, 'Create patient detail view');

  // View 5: Performance Trend (for time-series chart)
  const performanceTrendSql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_performance_trend AS
    SELECT
      measure_id,
      measure_name,
      DATE(created_at) AS report_date,
      performance_rate,
      denominator,
      numerator,
      ROW_NUMBER() OVER (PARTITION BY measure_id ORDER BY created_at) AS report_sequence
    FROM workspace.default.measure_reports
    ORDER BY measure_id, created_at
  `;
  await executeDatabricksSQL(performanceTrendSql, 'Create performance trend view');

  // View 6: Measure Comparison (for comparing multiple measures)
  const measureComparisonSql = `
    CREATE OR REPLACE VIEW workspace.default.dashboard_measure_comparison AS
    WITH latest_reports AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY measure_id ORDER BY created_at DESC) AS rn
      FROM workspace.default.measure_reports
    )
    SELECT
      measure_id,
      measure_name,
      initial_population,
      denominator,
      numerator,
      performance_rate,
      denominator - numerator AS care_gaps,
      ROUND((denominator - numerator) * 100.0 / NULLIF(denominator, 0), 2) AS gap_percentage,
      evaluation_method,
      created_at AS last_evaluated
    FROM latest_reports
    WHERE rn = 1
    ORDER BY performance_rate DESC
  `;
  await executeDatabricksSQL(measureComparisonSql, 'Create measure comparison view');
}

async function generateDashboardQueries() {
  console.log('\n📋 Generating dashboard query examples...');

  const dashboardQueries = {
    name: "Quality Measure Dashboard Queries",
    description: "SQL queries for Databricks dashboard widgets",
    widgets: [
      {
        name: "Performance Score Card",
        type: "counter",
        description: "Shows current performance rate for selected measure",
        sql: `
SELECT
  performance_rate AS "Performance Rate %",
  performance_category AS "Status"
FROM workspace.default.dashboard_measure_performance
WHERE measure_id = 'CMS125'
ORDER BY created_at DESC
LIMIT 1`
      },
      {
        name: "Population Funnel",
        type: "bar_chart",
        description: "Horizontal bar chart showing population progression",
        sql: `
SELECT
  population_type,
  count
FROM workspace.default.dashboard_population_breakdown
WHERE measure_id = 'CMS125'
ORDER BY sort_order`
      },
      {
        name: "Gap Status Distribution",
        type: "pie_chart",
        description: "Pie chart showing gap status breakdown",
        sql: `
SELECT
  gap_status AS "Status",
  patient_count AS "Patients",
  percentage AS "Percentage"
FROM workspace.default.dashboard_gap_analysis
WHERE measure_id = 'CMS125'`
      },
      {
        name: "Patient List with Gaps",
        type: "table",
        description: "Table showing patients with open care gaps",
        sql: `
SELECT
  name_family AS "Last Name",
  name_given AS "First Name",
  gender AS "Gender",
  age_years AS "Age",
  gap_status AS "Gap Status",
  population_membership AS "Population"
FROM workspace.default.dashboard_patient_detail
WHERE measure_id = 'CMS125'
  AND gap_status = 'open'
ORDER BY name_family`
      },
      {
        name: "Measure Comparison",
        type: "table",
        description: "Compare all measures side by side",
        sql: `
SELECT
  measure_id AS "Measure",
  measure_name AS "Name",
  denominator AS "Eligible",
  numerator AS "Compliant",
  care_gaps AS "Gaps",
  CONCAT(performance_rate, '%') AS "Rate",
  evaluation_method AS "Method"
FROM workspace.default.dashboard_measure_comparison
ORDER BY performance_rate DESC`
      },
      {
        name: "Performance Over Time",
        type: "line_chart",
        description: "Line chart showing performance trend",
        sql: `
SELECT
  report_date,
  performance_rate,
  measure_id
FROM workspace.default.dashboard_performance_trend
WHERE measure_id = 'CMS125'
ORDER BY report_date`
      },
      {
        name: "Population Details Table",
        type: "table",
        description: "Detailed breakdown of all populations",
        sql: `
SELECT
  measure_name AS "Measure",
  initial_population AS "Initial Pop",
  denominator AS "Denominator",
  denominator_exclusion AS "Exclusions",
  numerator AS "Numerator",
  CONCAT(performance_rate, '%') AS "Performance",
  evaluation_method AS "Method",
  DATE(created_at) AS "Evaluated"
FROM workspace.default.dashboard_measure_performance
ORDER BY created_at DESC`
      },
      {
        name: "Care Gap Summary",
        type: "counter_group",
        description: "Key metrics for care gap management",
        sql: `
SELECT
  SUM(CASE WHEN gap_status = 'closed' THEN patient_count ELSE 0 END) AS "Gaps Closed",
  SUM(CASE WHEN gap_status = 'open' THEN patient_count ELSE 0 END) AS "Open Gaps",
  SUM(CASE WHEN gap_status = 'excluded' THEN patient_count ELSE 0 END) AS "Excluded"
FROM workspace.default.dashboard_gap_analysis
WHERE measure_id = 'CMS125'`
      }
    ]
  };

  // Save queries to file
  const queriesPath = path.join(__dirname, '..', 'databricks', 'dashboard-queries.json');

  // Ensure directory exists
  const databricksDir = path.join(__dirname, '..', 'databricks');
  if (!fs.existsSync(databricksDir)) {
    fs.mkdirSync(databricksDir, { recursive: true });
  }

  fs.writeFileSync(queriesPath, JSON.stringify(dashboardQueries, null, 2));
  console.log(`✅ Dashboard queries saved to: ${queriesPath}`);

  return dashboardQueries;
}

async function createDashboardSQL() {
  console.log('\n📄 Creating dashboard SQL file...');

  const dashboardSQL = `-- ============================================
-- Quality Measure Dashboard SQL
-- Created: ${new Date().toISOString()}
-- ============================================

-- ==========================================
-- WIDGET 1: Performance Score Card
-- Type: Counter/KPI
-- ==========================================
SELECT
  measure_name,
  performance_rate,
  CASE
    WHEN performance_rate >= 80 THEN '🟢 Excellent'
    WHEN performance_rate >= 60 THEN '🟡 Good'
    WHEN performance_rate >= 40 THEN '🟠 Fair'
    ELSE '🔴 Needs Improvement'
  END AS status
FROM workspace.default.dashboard_measure_performance
WHERE measure_id = 'CMS125'
ORDER BY created_at DESC
LIMIT 1;

-- ==========================================
-- WIDGET 2: Population Funnel Chart
-- Type: Horizontal Bar Chart
-- ==========================================
SELECT
  population_type,
  count,
  CONCAT(ROUND(count * 100.0 / MAX(count) OVER (), 1), '%') AS percentage_of_initial
FROM workspace.default.dashboard_population_breakdown
WHERE measure_id = 'CMS125'
ORDER BY sort_order;

-- ==========================================
-- WIDGET 3: Gap Status Pie Chart
-- Type: Pie/Donut Chart
-- ==========================================
SELECT
  CASE gap_status
    WHEN 'closed' THEN '✅ Compliant'
    WHEN 'open' THEN '⚠️ Gap Open'
    WHEN 'excluded' THEN '➖ Excluded'
  END AS status,
  patient_count,
  CONCAT(percentage, '%') AS pct
FROM workspace.default.dashboard_gap_analysis
WHERE measure_id = 'CMS125';

-- ==========================================
-- WIDGET 4: Patient Gaps Table
-- Type: Table with Drill-Down
-- ==========================================
SELECT
  patient_id,
  CONCAT(name_given, ' ', name_family) AS patient_name,
  gender,
  age_years AS age,
  gap_status,
  population_membership
FROM workspace.default.dashboard_patient_detail
WHERE measure_id = 'CMS125'
ORDER BY
  CASE gap_status WHEN 'open' THEN 1 WHEN 'excluded' THEN 2 ELSE 3 END,
  name_family;

-- ==========================================
-- WIDGET 5: All Measures Comparison
-- Type: Table
-- ==========================================
SELECT
  measure_id,
  measure_name,
  denominator AS eligible_patients,
  numerator AS compliant_patients,
  care_gaps,
  CONCAT(performance_rate, '%') AS performance,
  CONCAT(gap_percentage, '%') AS gap_rate
FROM workspace.default.dashboard_measure_comparison;

-- ==========================================
-- WIDGET 6: Key Metrics Summary
-- Type: Counter Cards
-- ==========================================
SELECT
  'Total Patients' AS metric,
  SUM(initial_population) AS value
FROM workspace.default.measure_reports
WHERE measure_id = 'CMS125'

UNION ALL

SELECT
  'Compliant Patients' AS metric,
  SUM(numerator) AS value
FROM workspace.default.measure_reports
WHERE measure_id = 'CMS125'

UNION ALL

SELECT
  'Open Care Gaps' AS metric,
  SUM(denominator - numerator) AS value
FROM workspace.default.measure_reports
WHERE measure_id = 'CMS125';

-- ==========================================
-- WIDGET 7: Detailed Population Breakdown
-- Type: Stacked Bar or Table
-- ==========================================
SELECT
  measure_id,
  measure_name,
  'In Numerator' AS category,
  numerator AS count,
  CONCAT(ROUND(numerator * 100.0 / NULLIF(denominator, 0), 1), '%') AS rate
FROM workspace.default.dashboard_measure_performance
WHERE measure_id = 'CMS125'

UNION ALL

SELECT
  measure_id,
  measure_name,
  'Gap (In Denom, Not Numer)' AS category,
  denominator - numerator AS count,
  CONCAT(ROUND((denominator - numerator) * 100.0 / NULLIF(denominator, 0), 1), '%') AS rate
FROM workspace.default.dashboard_measure_performance
WHERE measure_id = 'CMS125'

UNION ALL

SELECT
  measure_id,
  measure_name,
  'Excluded' AS category,
  denominator_exclusion AS count,
  CONCAT(ROUND(denominator_exclusion * 100.0 / NULLIF(initial_population, 0), 1), '%') AS rate
FROM workspace.default.dashboard_measure_performance
WHERE measure_id = 'CMS125';
`;

  const sqlPath = path.join(__dirname, '..', 'databricks', 'dashboard.sql');
  fs.writeFileSync(sqlPath, dashboardSQL);
  console.log(`✅ Dashboard SQL saved to: ${sqlPath}`);
}

async function verifyDashboard() {
  console.log('\n🔍 Verifying dashboard setup...');

  // Test each dashboard view
  const views = [
    'dashboard_measure_performance',
    'dashboard_population_breakdown',
    'dashboard_gap_analysis',
    'dashboard_patient_detail',
    'dashboard_measure_comparison'
  ];

  console.log('\n📊 Dashboard View Data Preview:\n');

  for (const view of views) {
    try {
      const result = await executeDatabricksSQL(
        `SELECT * FROM workspace.default.${view} LIMIT 5`,
        `Query ${view}`
      );

      if (result.result?.data_array?.length > 0) {
        console.log(`\n   ${view}:`);
        console.log(`   Columns: ${result.manifest?.schema?.columns?.map(c => c.name).join(', ')}`);
        console.log(`   Sample rows: ${result.result.data_array.length}`);
      }
    } catch (error) {
      console.log(`   ⚠️ ${view}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Create Databricks Dashboard');
  console.log('  Quality Measure Visualization');
  console.log('==========================================');

  if (!DATABRICKS_HOST || !DATABRICKS_TOKEN || !DATABRICKS_WAREHOUSE) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_WAREHOUSE');
    process.exit(1);
  }

  try {
    // Step 1: Create tables
    console.log('\n📋 Step 1: Creating tables...');
    await createMeasureReportsTable();
    await createPatientMeasureStatusTable();

    // Step 2: Insert current measure data
    console.log('\n📥 Step 2: Populating measure data...');
    const reportId = await insertSampleMeasureReports();
    console.log(`   Report ID: ${reportId}`);

    // Step 3: Create dashboard views
    console.log('\n📊 Step 3: Creating dashboard views...');
    await createDashboardViews();

    // Step 4: Generate dashboard queries
    console.log('\n📋 Step 4: Generating dashboard queries...');
    await generateDashboardQueries();
    await createDashboardSQL();

    // Step 5: Verify
    console.log('\n✅ Step 5: Verifying dashboard...');
    await verifyDashboard();

    console.log('\n==========================================');
    console.log('✅ Dashboard Created Successfully!');
    console.log('==========================================\n');

    console.log('Created Resources:');
    console.log('  Tables:');
    console.log('    - measure_reports (historical measure data)');
    console.log('    - patient_measure_status (patient-level gaps)');
    console.log('\n  Dashboard Views:');
    console.log('    - dashboard_measure_performance');
    console.log('    - dashboard_population_breakdown');
    console.log('    - dashboard_gap_analysis');
    console.log('    - dashboard_patient_detail');
    console.log('    - dashboard_performance_trend');
    console.log('    - dashboard_measure_comparison');
    console.log('\n  Files:');
    console.log('    - databricks/dashboard-queries.json');
    console.log('    - databricks/dashboard.sql');
    console.log('\n📊 To create the dashboard in Databricks:');
    console.log('   1. Go to Databricks SQL → Dashboards → Create Dashboard');
    console.log('   2. Add widgets using queries from dashboard.sql');
    console.log('   3. Configure visualizations (bar, pie, table, counter)');
    console.log('   4. Set auto-refresh interval as needed\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

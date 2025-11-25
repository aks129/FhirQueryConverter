#!/usr/bin/env node

/**
 * Create SQL on FHIR views in Databricks
 * Creates views that match the ViewDefinition schemas
 */

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
      wait_timeout: '30s',
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

async function createPatientView() {
  const sql = `
    CREATE OR REPLACE VIEW workspace.default.patient_view AS
    SELECT
      id,
      gender,
      birthdate,
      name_family,
      name_given,
      active,
      telecom_phone,
      telecom_email,
      TIMESTAMPDIFF(YEAR, birthdate, CURRENT_DATE()) as age_years
    FROM workspace.default.patient
  `;

  await executeDatabricksSQL(sql, 'Create patient_view');
}

async function createEncounterView() {
  const sql = `
    CREATE OR REPLACE VIEW workspace.default.encounter_view AS
    SELECT
      id,
      patient_id,
      status,
      class_code,
      type_code,
      type_display,
      type_system,
      period_start,
      period_end,
      DATEDIFF(DAY, period_start, COALESCE(period_end, period_start)) as duration_days
    FROM workspace.default.encounter
  `;

  await executeDatabricksSQL(sql, 'Create encounter_view');
}

async function createObservationView() {
  const sql = `
    CREATE OR REPLACE VIEW workspace.default.observation_view AS
    SELECT
      id,
      patient_id,
      status,
      code_system,
      code_code,
      code_display,
      effective_datetime,
      value_string,
      DATEDIFF(MONTH, effective_datetime, CURRENT_DATE()) as months_since_observation
    FROM workspace.default.observation
  `;

  await executeDatabricksSQL(sql, 'Create observation_view');
}

async function createProcedureView() {
  const sql = `
    CREATE OR REPLACE VIEW workspace.default.procedure_view AS
    SELECT
      id,
      patient_id,
      status,
      code_system,
      code_code,
      code_display,
      performed_datetime,
      DATEDIFF(MONTH, performed_datetime, CURRENT_DATE()) as months_since_procedure
    FROM workspace.default.procedure
  `;

  await executeDatabricksSQL(sql, 'Create procedure_view');
}

async function createCoverageView() {
  const sql = `
    CREATE OR REPLACE VIEW workspace.default.coverage_view AS
    SELECT
      id,
      patient_id,
      status,
      type_code,
      type_display,
      subscriber_id,
      period_start,
      period_end,
      payor_display,
      CASE
        WHEN period_start <= CURRENT_DATE() AND period_end >= CURRENT_DATE() THEN true
        ELSE false
      END as is_active
    FROM workspace.default.coverage
  `;

  await executeDatabricksSQL(sql, 'Create coverage_view');
}

async function createMeasureEvaluationViews() {
  console.log('\n📊 Creating measure evaluation views...');

  // Initial Population View
  const initialPopSql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_initial_population_view AS
    SELECT DISTINCT
      p.id AS patient_id,
      p.name_family,
      p.gender,
      p.birthdate,
      p.age_years
    FROM workspace.default.patient_view p
    WHERE p.gender = 'female'
      AND p.age_years >= 51
      AND p.age_years < 75
      AND p.active = true
  `;
  await executeDatabricksSQL(initialPopSql, 'Create initial population view');

  // Qualifying Encounters View
  const encountersSql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_qualifying_encounters_view AS
    SELECT DISTINCT
      e.patient_id,
      e.id AS encounter_id,
      e.type_code,
      e.type_display,
      e.period_start
    FROM workspace.default.encounter_view e
    WHERE e.status = 'finished'
      AND e.period_start >= ADD_MONTHS(CURRENT_DATE(), -24)
  `;
  await executeDatabricksSQL(encountersSql, 'Create qualifying encounters view');

  // Mammography View
  const mammographySql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_mammography_view AS
    SELECT DISTINCT
      o.patient_id,
      o.id AS observation_id,
      o.code_code,
      o.code_display,
      o.effective_datetime,
      o.months_since_observation
    FROM workspace.default.observation_view o
    WHERE o.status = 'final'
      AND o.code_system = 'http://loinc.org'
      AND o.code_code = '24606-6'
      AND o.effective_datetime >= ADD_MONTHS(CURRENT_DATE(), -27)
  `;
  await executeDatabricksSQL(mammographySql, 'Create mammography view');

  // Bilateral Mastectomy View
  const mastectomySql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_bilateral_mastectomy_view AS
    SELECT DISTINCT
      pr.patient_id,
      pr.id AS procedure_id,
      pr.code_display,
      pr.performed_datetime
    FROM workspace.default.procedure_view pr
    WHERE pr.status = 'completed'
      AND pr.code_system = 'http://snomed.info/sct'
      AND pr.code_code = '27865001'
  `;
  await executeDatabricksSQL(mastectomySql, 'Create bilateral mastectomy view');

  // Denominator View (with exclusions)
  const denominatorSql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_denominator_view AS
    SELECT DISTINCT
      ip.patient_id,
      ip.name_family,
      ip.age_years
    FROM workspace.default.cms125_initial_population_view ip
    INNER JOIN workspace.default.cms125_qualifying_encounters_view qe
      ON ip.patient_id = qe.patient_id
    LEFT JOIN workspace.default.cms125_bilateral_mastectomy_view ex
      ON ip.patient_id = ex.patient_id
    WHERE ex.patient_id IS NULL
  `;
  await executeDatabricksSQL(denominatorSql, 'Create denominator view');

  // Numerator View
  const numeratorSql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_numerator_view AS
    SELECT DISTINCT
      d.patient_id,
      d.name_family,
      d.age_years,
      m.observation_id,
      m.effective_datetime
    FROM workspace.default.cms125_denominator_view d
    INNER JOIN workspace.default.cms125_mammography_view m
      ON d.patient_id = m.patient_id
  `;
  await executeDatabricksSQL(numeratorSql, 'Create numerator view');

  // Final Measure Report View
  const measureReportSql = `
    CREATE OR REPLACE VIEW workspace.default.cms125_sql_measure_report AS
    WITH population_counts AS (
      SELECT 'initial-population' AS population_type,
             COUNT(DISTINCT patient_id) AS count,
             1 AS sort_order
      FROM workspace.default.cms125_initial_population_view

      UNION ALL

      SELECT 'denominator' AS population_type,
             COUNT(DISTINCT patient_id) AS count,
             2 AS sort_order
      FROM workspace.default.cms125_denominator_view

      UNION ALL

      SELECT 'denominator-exclusion' AS population_type,
             COUNT(DISTINCT patient_id) AS count,
             3 AS sort_order
      FROM workspace.default.cms125_bilateral_mastectomy_view

      UNION ALL

      SELECT 'numerator' AS population_type,
             COUNT(DISTINCT patient_id) AS count,
             4 AS sort_order
      FROM workspace.default.cms125_numerator_view
    )
    SELECT
      population_type,
      count,
      CASE
        WHEN population_type = 'numerator' THEN
          ROUND(count * 100.0 / NULLIF(
            (SELECT count FROM population_counts WHERE population_type = 'denominator'),
            0
          ), 2)
        ELSE NULL
      END AS percentage
    FROM population_counts
    ORDER BY sort_order
  `;
  await executeDatabricksSQL(measureReportSql, 'Create SQL measure report view');
}

async function main() {
  console.log('==========================================');
  console.log('  Create SQL on FHIR Views in Databricks');
  console.log('==========================================');

  if (!DATABRICKS_HOST || !DATABRICKS_TOKEN || !DATABRICKS_WAREHOUSE) {
    console.error('\n❌ Missing required environment variables');
    console.error('Required: DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_WAREHOUSE');
    process.exit(1);
  }

  try {
    console.log('\n📋 Creating base resource views...');
    await createPatientView();
    await createEncounterView();
    await createObservationView();
    await createProcedureView();
    await createCoverageView();

    await createMeasureEvaluationViews();

    console.log('\n==========================================');
    console.log('✅ All Views Created Successfully!');
    console.log('==========================================\n');

    console.log('Created Views:');
    console.log('  Base Resource Views:');
    console.log('    - patient_view');
    console.log('    - encounter_view');
    console.log('    - observation_view');
    console.log('    - procedure_view');
    console.log('    - coverage_view');
    console.log('\n  Measure Evaluation Views:');
    console.log('    - cms125_initial_population_view');
    console.log('    - cms125_qualifying_encounters_view');
    console.log('    - cms125_mammography_view');
    console.log('    - cms125_bilateral_mastectomy_view');
    console.log('    - cms125_denominator_view');
    console.log('    - cms125_numerator_view');
    console.log('    - cms125_sql_measure_report\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

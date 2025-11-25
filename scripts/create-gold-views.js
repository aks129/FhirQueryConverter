#!/usr/bin/env node

/**
 * Create Gold Layer Views for CMS125 Measure
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
    return result;
  } else if (result.status?.state === 'FAILED') {
    console.log(`❌ ${description} failed:`);
    console.log(result.status?.error?.message || JSON.stringify(result, null, 2));
    throw new Error(result.status?.error?.message || 'SQL execution failed');
  } else {
    console.log(`⚠️  ${description} status: ${result.status?.state}`);
    return result;
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Create CMS125 Measure Views');
  console.log('==========================================\n');

  await executeSqlStatement('USE CATALOG fhir_analytics', 'Switch to catalog');
  await executeSqlStatement('USE SCHEMA gold', 'Switch to gold schema');

  // Initial Population
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_initial_population AS
    SELECT DISTINCT
      p.id AS patient_id,
      p.name_family,
      p.name_given,
      p.gender,
      p.birthdate,
      TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE()) AS age_years,
      p.active
    FROM fhir_analytics.bronze.patient p
    WHERE p.gender = 'female'
      AND TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE()) >= 51
      AND TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE()) < 75
      AND p.active = true
  `, 'Create initial population view');

  // Qualifying Encounters
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_qualifying_encounters AS
    SELECT DISTINCT
      e.patient_id,
      e.id AS encounter_id,
      e.type_code,
      e.type_display,
      e.period_start,
      e.period_end,
      DATEDIFF(DAY, e.period_start, CURRENT_DATE()) AS days_since_encounter
    FROM fhir_analytics.bronze.encounter e
    WHERE e.status = 'finished'
      AND e.period_start >= ADD_MONTHS(CURRENT_DATE(), -24)
  `, 'Create qualifying encounters view');

  // Mammography Performed
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_mammography_performed AS
    SELECT DISTINCT
      o.patient_id,
      o.id AS observation_id,
      o.code_system,
      o.code_code,
      o.code_display,
      o.effective_datetime,
      DATEDIFF(MONTH, o.effective_datetime, CURRENT_DATE()) AS months_since_mammography
    FROM fhir_analytics.bronze.observation o
    WHERE o.status = 'final'
      AND o.code_system = 'http://loinc.org'
      AND o.code_code = '24606-6'
      AND o.effective_datetime >= ADD_MONTHS(CURRENT_DATE(), -27)
  `, 'Create mammography performed view');

  // Denominator
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_denominator AS
    SELECT DISTINCT
      ip.patient_id,
      ip.name_family,
      ip.name_given,
      ip.age_years
    FROM cms125_initial_population ip
    INNER JOIN cms125_qualifying_encounters qe
      ON ip.patient_id = qe.patient_id
  `, 'Create denominator view');

  // Numerator
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_numerator AS
    SELECT DISTINCT
      d.patient_id,
      d.name_family,
      d.name_given,
      d.age_years
    FROM cms125_denominator d
    INNER JOIN cms125_mammography_performed mp
      ON d.patient_id = mp.patient_id
  `, 'Create numerator view');

  // Measure Report
  await executeSqlStatement(`
    CREATE OR REPLACE VIEW cms125_measure_report AS
    WITH population_counts AS (
      SELECT
        'initial-population' AS population_type,
        COUNT(DISTINCT patient_id) AS count,
        1 AS sort_order
      FROM cms125_initial_population

      UNION ALL

      SELECT
        'denominator' AS population_type,
        COUNT(DISTINCT patient_id) AS count,
        2 AS sort_order
      FROM cms125_denominator

      UNION ALL

      SELECT
        'numerator' AS population_type,
        COUNT(DISTINCT patient_id) AS count,
        3 AS sort_order
      FROM cms125_numerator
    )
    SELECT
      population_type,
      count,
      CASE
        WHEN population_type = 'numerator' THEN
          ROUND(count * 100.0 / NULLIF((
            SELECT count FROM population_counts WHERE population_type = 'denominator'
          ), 0), 2)
        ELSE NULL
      END AS percentage
    FROM population_counts
    ORDER BY sort_order
  `, 'Create measure report view');

  console.log('\n==========================================');
  console.log('✅ Gold layer views created successfully!');
  console.log('==========================================\n');
  console.log('Created views:');
  console.log('  - cms125_initial_population');
  console.log('  - cms125_qualifying_encounters');
  console.log('  - cms125_mammography_performed');
  console.log('  - cms125_denominator');
  console.log('  - cms125_numerator');
  console.log('  - cms125_measure_report\n');
}

main().catch(console.error);

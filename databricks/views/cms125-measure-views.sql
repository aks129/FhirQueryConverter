-- CMS125: Breast Cancer Screening
-- Measure Views for Population Calculations
--
-- Run this after tables are created and data is loaded

USE CATALOG fhir_analytics;
USE SCHEMA gold;

-- ============================================
-- Initial Population
-- Women aged 51-74 years
-- ============================================
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
COMMENT 'CMS125 Initial Population: Women aged 51-74 years';

-- Test query
-- SELECT * FROM cms125_initial_population;

-- ============================================
-- Qualifying Encounters
-- Encounters within the last 2 years
-- ============================================
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
COMMENT 'CMS125 Qualifying Encounters: Finished encounters within 24 months';

-- Test query
-- SELECT * FROM cms125_qualifying_encounters ORDER BY period_start DESC;

-- ============================================
-- Mammography Performed
-- Mammography procedures within the last 27 months
-- Uses ValueSet: 2.16.840.1.113883.3.464.1003.198.12.1011
-- ============================================
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
INNER JOIN fhir_analytics.terminology.valueset_expansion vse
  ON vse.valueset_oid = '2.16.840.1.113883.3.464.1003.198.12.1011'
  AND vse.code = o.code_code
  AND vse.code_system = o.code_system
WHERE o.status = 'final'
  AND o.effective_datetime >= ADD_MONTHS(CURRENT_DATE(), -27)
COMMENT 'CMS125 Mammography Performed: Mammography within 27 months per ValueSet';

-- Test query
-- SELECT * FROM cms125_mammography_performed ORDER BY effective_datetime DESC;

-- ============================================
-- Bilateral Mastectomy (Exclusions)
-- Procedures indicating bilateral mastectomy
-- Uses ValueSet: 2.16.840.1.113883.3.526.3.1285
-- ============================================
CREATE OR REPLACE VIEW cms125_bilateral_mastectomy AS
SELECT DISTINCT
  o.patient_id,
  o.id AS observation_id,
  o.code_code,
  o.code_display,
  o.effective_datetime
FROM fhir_analytics.bronze.observation o
INNER JOIN fhir_analytics.terminology.valueset_expansion vse
  ON vse.valueset_oid = '2.16.840.1.113883.3.526.3.1285'
  AND vse.code = o.code_code
  AND vse.code_system = o.code_system
WHERE o.status = 'final'
COMMENT 'CMS125 Bilateral Mastectomy: Exclusion criteria per ValueSet';

-- Test query
-- SELECT * FROM cms125_bilateral_mastectomy;

-- ============================================
-- Denominator
-- Initial Population with Qualifying Encounters
-- Excludes patients with Bilateral Mastectomy
-- ============================================
CREATE OR REPLACE VIEW cms125_denominator AS
SELECT DISTINCT
  ip.patient_id,
  ip.name_family,
  ip.name_given,
  ip.age_years
FROM cms125_initial_population ip
INNER JOIN cms125_qualifying_encounters qe
  ON ip.patient_id = qe.patient_id
LEFT JOIN cms125_bilateral_mastectomy bm
  ON ip.patient_id = bm.patient_id
WHERE bm.patient_id IS NULL  -- Exclude patients with bilateral mastectomy
COMMENT 'CMS125 Denominator: Initial population with encounters, excluding bilateral mastectomy';

-- Test query
-- SELECT * FROM cms125_denominator ORDER BY name_family;

-- ============================================
-- Numerator
-- Denominator patients with Mammography Performed
-- ============================================
CREATE OR REPLACE VIEW cms125_numerator AS
SELECT DISTINCT
  d.patient_id,
  d.name_family,
  d.name_given,
  d.age_years
FROM cms125_denominator d
INNER JOIN cms125_mammography_performed mp
  ON d.patient_id = mp.patient_id
COMMENT 'CMS125 Numerator: Denominator patients with mammography performed';

-- Test query
-- SELECT * FROM cms125_numerator ORDER BY name_family;

-- ============================================
-- Denominator Exclusions
-- Patients excluded from denominator
-- ============================================
CREATE OR REPLACE VIEW cms125_denominator_exclusions AS
SELECT DISTINCT
  ip.patient_id,
  ip.name_family,
  ip.name_given,
  ip.age_years,
  'Bilateral Mastectomy' AS exclusion_reason
FROM cms125_initial_population ip
INNER JOIN cms125_qualifying_encounters qe
  ON ip.patient_id = qe.patient_id
INNER JOIN cms125_bilateral_mastectomy bm
  ON ip.patient_id = bm.patient_id
COMMENT 'CMS125 Denominator Exclusions: Patients excluded due to bilateral mastectomy';

-- Test query
-- SELECT * FROM cms125_denominator_exclusions;

-- ============================================
-- Measure Report Summary
-- Population counts and performance rate
-- ============================================
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

  UNION ALL

  SELECT
    'denominator-exclusion' AS population_type,
    COUNT(DISTINCT patient_id) AS count,
    4 AS sort_order
  FROM cms125_denominator_exclusions
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
COMMENT 'CMS125 Measure Report: Population counts and performance rate';

-- ============================================
-- Patient-Level Measure Report
-- Detailed report showing each patient's status
-- ============================================
CREATE OR REPLACE VIEW cms125_patient_level_report AS
SELECT
  ip.patient_id,
  CONCAT(ip.name_given[0], ' ', ip.name_family) AS patient_name,
  ip.age_years,
  CASE WHEN d.patient_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS in_denominator,
  CASE WHEN n.patient_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS in_numerator,
  CASE WHEN ex.patient_id IS NOT NULL THEN ex.exclusion_reason ELSE NULL END AS exclusion_reason,
  qe.encounter_id,
  qe.period_start AS encounter_date,
  mp.observation_id AS mammography_id,
  mp.effective_datetime AS mammography_date,
  mp.months_since_mammography
FROM cms125_initial_population ip
LEFT JOIN cms125_denominator d ON ip.patient_id = d.patient_id
LEFT JOIN cms125_numerator n ON ip.patient_id = n.patient_id
LEFT JOIN cms125_denominator_exclusions ex ON ip.patient_id = ex.patient_id
LEFT JOIN cms125_qualifying_encounters qe ON ip.patient_id = qe.patient_id
LEFT JOIN cms125_mammography_performed mp ON ip.patient_id = mp.patient_id
ORDER BY patient_name
COMMENT 'CMS125 Patient-Level Report: Detailed status for each patient';

-- ============================================
-- Verify All Views Created
-- ============================================
SHOW VIEWS IN fhir_analytics.gold;

-- ============================================
-- Run Sample Measure Calculation
-- ============================================
SELECT
  'CMS125: Breast Cancer Screening' AS measure_name,
  'Measurement Period: Last 2 years' AS period,
  CURRENT_DATE() AS calculation_date;

SELECT * FROM cms125_measure_report;

SELECT
  CONCAT(
    'Performance Rate: ',
    CAST((SELECT percentage FROM cms125_measure_report WHERE population_type = 'numerator') AS STRING),
    '%'
  ) AS result;

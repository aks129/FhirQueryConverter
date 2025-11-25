-- ============================================
-- Quality Measure Dashboard SQL
-- Run these queries in Databricks SQL to create dashboard
-- ============================================

-- ==========================================
-- STEP 1: CREATE TABLES
-- ==========================================

-- Table to store historical measure reports
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
COMMENT 'Historical measure report data for quality measure tracking';

-- Table to store patient-level measure status
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
COMMENT 'Individual patient measure status for gap analysis';

-- ==========================================
-- STEP 2: INSERT CURRENT DATA FROM VIEWS
-- ==========================================

-- Insert measure report from existing SQL evaluation views
INSERT INTO workspace.default.measure_reports (
  id, measure_id, measure_name, measure_version, report_type,
  period_start, period_end,
  initial_population, denominator, denominator_exclusion, denominator_exception,
  numerator, numerator_exclusion, performance_rate,
  evaluation_method, execution_time_ms, created_by
)
SELECT
  CONCAT('report-cms125-', UNIX_TIMESTAMP()) AS id,
  'CMS125' AS measure_id,
  'Breast Cancer Screening' AS measure_name,
  'v1' AS measure_version,
  'summary' AS report_type,
  DATE_TRUNC('YEAR', CURRENT_DATE()) AS period_start,
  LAST_DAY(ADD_MONTHS(DATE_TRUNC('YEAR', CURRENT_DATE()), 11)) AS period_end,
  (SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_initial_population_view) AS initial_population,
  (SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_denominator_view) AS denominator,
  (SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_bilateral_mastectomy_view) AS denominator_exclusion,
  0 AS denominator_exception,
  (SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_numerator_view) AS numerator,
  0 AS numerator_exclusion,
  ROUND(
    (SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_numerator_view) * 100.0 /
    NULLIF((SELECT COUNT(DISTINCT patient_id) FROM workspace.default.cms125_denominator_view), 0),
    2
  ) AS performance_rate,
  'SQL' AS evaluation_method,
  1500 AS execution_time_ms,
  'dashboard-manual' AS created_by;

-- Insert patient-level status
INSERT INTO workspace.default.patient_measure_status (
  patient_id, measure_id, report_id, population_membership,
  in_initial_population, in_denominator, in_denominator_exclusion, in_numerator,
  gap_status
)
SELECT
  ip.patient_id,
  'CMS125' AS measure_id,
  (SELECT MAX(id) FROM workspace.default.measure_reports WHERE measure_id = 'CMS125') AS report_id,
  CASE
    WHEN n.patient_id IS NOT NULL THEN 'numerator'
    WHEN d.patient_id IS NOT NULL THEN 'denominator'
    WHEN ex.patient_id IS NOT NULL THEN 'exclusion'
    ELSE 'initial'
  END AS population_membership,
  TRUE AS in_initial_population,
  d.patient_id IS NOT NULL AS in_denominator,
  ex.patient_id IS NOT NULL AS in_denominator_exclusion,
  n.patient_id IS NOT NULL AS in_numerator,
  CASE
    WHEN ex.patient_id IS NOT NULL THEN 'excluded'
    WHEN n.patient_id IS NOT NULL THEN 'closed'
    ELSE 'open'
  END AS gap_status
FROM workspace.default.cms125_initial_population_view ip
LEFT JOIN workspace.default.cms125_denominator_view d ON ip.patient_id = d.patient_id
LEFT JOIN workspace.default.cms125_numerator_view n ON ip.patient_id = n.patient_id
LEFT JOIN workspace.default.cms125_bilateral_mastectomy_view ex ON ip.patient_id = ex.patient_id;

-- ==========================================
-- STEP 3: CREATE DASHBOARD VIEWS
-- ==========================================

-- View 1: Measure Performance Summary
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
ORDER BY created_at DESC;

-- View 2: Population Breakdown (for pie/bar charts)
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
ORDER BY measure_id, created_at DESC, sort_order;

-- View 3: Gap Analysis
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
ORDER BY pms.measure_id, pms.gap_status;

-- View 4: Patient Detail (for drill-down)
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
ORDER BY pms.measure_id, p.name_family;

-- View 5: Performance Trend (for time-series chart)
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
ORDER BY measure_id, created_at;

-- View 6: Measure Comparison (for comparing multiple measures)
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
ORDER BY performance_rate DESC;

-- ==========================================
-- DASHBOARD WIDGET QUERIES
-- ==========================================

-- WIDGET 1: Performance Score Card (Counter/KPI)
-- SELECT
--   measure_name,
--   performance_rate,
--   CASE
--     WHEN performance_rate >= 80 THEN 'Excellent'
--     WHEN performance_rate >= 60 THEN 'Good'
--     WHEN performance_rate >= 40 THEN 'Fair'
--     ELSE 'Needs Improvement'
--   END AS status
-- FROM workspace.default.dashboard_measure_performance
-- WHERE measure_id = 'CMS125'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- WIDGET 2: Population Funnel (Horizontal Bar Chart)
-- SELECT
--   population_type,
--   count,
--   CONCAT(ROUND(count * 100.0 / MAX(count) OVER (), 1), '%') AS percentage_of_initial
-- FROM workspace.default.dashboard_population_breakdown
-- WHERE measure_id = 'CMS125'
-- ORDER BY sort_order;

-- WIDGET 3: Gap Status (Pie/Donut Chart)
-- SELECT
--   CASE gap_status
--     WHEN 'closed' THEN 'Compliant'
--     WHEN 'open' THEN 'Gap Open'
--     WHEN 'excluded' THEN 'Excluded'
--   END AS status,
--   patient_count,
--   CONCAT(percentage, '%') AS pct
-- FROM workspace.default.dashboard_gap_analysis
-- WHERE measure_id = 'CMS125';

-- WIDGET 4: Patient Gaps Table
-- SELECT
--   patient_id,
--   CONCAT(name_given, ' ', name_family) AS patient_name,
--   gender,
--   age_years AS age,
--   gap_status,
--   population_membership
-- FROM workspace.default.dashboard_patient_detail
-- WHERE measure_id = 'CMS125'
-- ORDER BY
--   CASE gap_status WHEN 'open' THEN 1 WHEN 'excluded' THEN 2 ELSE 3 END,
--   name_family;

-- WIDGET 5: All Measures Comparison Table
-- SELECT
--   measure_id,
--   measure_name,
--   denominator AS eligible_patients,
--   numerator AS compliant_patients,
--   care_gaps,
--   CONCAT(performance_rate, '%') AS performance,
--   CONCAT(gap_percentage, '%') AS gap_rate
-- FROM workspace.default.dashboard_measure_comparison;

-- WIDGET 6: Key Metrics Summary (Counter Cards)
-- SELECT
--   'Total Patients' AS metric,
--   SUM(initial_population) AS value
-- FROM workspace.default.measure_reports
-- WHERE measure_id = 'CMS125'
--
-- UNION ALL
--
-- SELECT
--   'Compliant Patients' AS metric,
--   SUM(numerator) AS value
-- FROM workspace.default.measure_reports
-- WHERE measure_id = 'CMS125'
--
-- UNION ALL
--
-- SELECT
--   'Open Care Gaps' AS metric,
--   SUM(denominator - numerator) AS value
-- FROM workspace.default.measure_reports
-- WHERE measure_id = 'CMS125';

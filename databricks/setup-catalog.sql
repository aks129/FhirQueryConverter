-- Databricks Unity Catalog Setup for FHIR Analytics
-- Run this in Databricks SQL Editor
--
-- Prerequisites:
-- - SQL Warehouse created and running
-- - Unity Catalog enabled

-- Create main catalog
CREATE CATALOG IF NOT EXISTS fhir_analytics
  COMMENT 'FHIR quality measure analytics and CQL evaluation';

USE CATALOG fhir_analytics;

-- Create bronze schema (raw data from FHIR server)
CREATE SCHEMA IF NOT EXISTS bronze
  COMMENT 'Raw flattened FHIR resources from Medplum';

-- Create silver schema (cleaned and validated data)
CREATE SCHEMA IF NOT EXISTS silver
  COMMENT 'Cleaned and transformed FHIR data with business rules applied';

-- Create gold schema (aggregated views for measures)
CREATE SCHEMA IF NOT EXISTS gold
  COMMENT 'Measure population views and quality metric calculations';

-- Create terminology schema (ValueSets and code systems)
CREATE SCHEMA IF NOT EXISTS terminology
  COMMENT 'ValueSet expansions and terminology mappings from VSAC';

-- Verify creation
SHOW SCHEMAS IN fhir_analytics;

-- Display success message
SELECT 'Catalog structure created successfully!' AS status;

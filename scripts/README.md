# Scripts Directory

This directory contains operational scripts for the end-to-end CQL measure evaluation pipeline.

## Overview

The scripts automate the process of:
1. Loading test data to Medplum FHIR server
2. Retrieving ValueSets from NLM VSAC
3. Running ETL pipelines from Medplum to Databricks
4. Executing measure calculations

## Prerequisites

### Required Tools
- `bash` - For running shell scripts
- `curl` - For API calls
- `jq` - For JSON processing (`brew install jq` or `apt-get install jq`)

### Required Accounts & Credentials

**Medplum** (https://app.medplum.com)
- Create project
- Generate OAuth2 client credentials
- Set environment variables:
  ```bash
  export MEDPLUM_CLIENT_ID='your-client-id'
  export MEDPLUM_CLIENT_SECRET='your-client-secret'
  ```

**NLM VSAC** (https://uts.nlm.nih.gov/uts/)
- Register for UMLS account
- Generate API key
- Set environment variable:
  ```bash
  export VSAC_API_KEY='your-api-key'
  ```

**Databricks** (https://databricks.com)
- Create workspace
- Create SQL Warehouse
- Generate personal access token
- Set environment variables:
  ```bash
  export DATABRICKS_HOST='your-workspace.cloud.databricks.com'
  export DATABRICKS_TOKEN='dapi...'
  export DATABRICKS_WAREHOUSE='warehouse-id'
  ```

## Scripts

### 1. load-test-data.sh

Loads test patient data bundle to Medplum FHIR server.

**Usage:**
```bash
./scripts/load-test-data.sh
```

**What it does:**
- Authenticates with Medplum using OAuth2 client credentials
- Loads `test-data/patient-001-bundle.json` as a transaction bundle
- Creates 4 FHIR resources:
  - Patient/test-patient-001
  - Encounter/encounter-001
  - Observation/mammography-001
  - Coverage/coverage-001
- Verifies each resource was created successfully

**Output:**
```
========================================
  Load Test Data to Medplum
========================================

📡 Getting access token...
✓ Access token obtained

📦 Loading test patient bundle...
✓ Test data bundle loaded successfully

🔍 Verifying loaded resources...

  Checking Patient/test-patient-001...
  ✓ Patient found: Jane Marie TestPatient (female, born 1968-05-15)
  Checking Encounter/encounter-001...
  ✓ Encounter found: Office outpatient visit 15 minutes on 2024-03-15T10:00:00Z
  Checking Observation/mammography-001...
  ✓ Observation found: Mammography bilateral on 2023-09-20T14:00:00Z
  Checking Coverage/coverage-001...
  ✓ Coverage found: Blue Cross Blue Shield

========================================
✅ Test data loaded successfully!
========================================
```

### 2. retrieve-valuesets.sh

Retrieves ValueSet expansions from NLM VSAC API.

**Usage:**
```bash
./scripts/retrieve-valuesets.sh
```

**What it does:**
- Retrieves 3 ValueSets required for CMS125:
  - Mammography (2.16.840.1.113883.3.464.1003.198.12.1011)
  - Bilateral Mastectomy (2.16.840.1.113883.3.526.3.1285)
  - Patient Characteristic Payer (2.16.840.1.113883.3.464.1003.101.12.1061)
- Saves XML responses to `test-data/valuesets/`
- Counts concepts in each ValueSet

**Output:**
```
========================================
  Retrieve ValueSets from NLM VSAC
========================================

📋 ValueSets to retrieve:
  - Mammography: 2.16.840.1.113883.3.464.1003.198.12.1011
  - BilateralMastectomy: 2.16.840.1.113883.3.526.3.1285
  - PatientCharacteristicPayer: 2.16.840.1.113883.3.464.1003.101.12.1061

📥 Retrieving Mammography (2.16.840.1.113883.3.464.1003.198.12.1011)...
  ✓ Retrieved 34 codes
    Saved to: test-data/valuesets/Mammography.xml

📥 Retrieving BilateralMastectomy (2.16.840.1.113883.3.526.3.1285)...
  ✓ Retrieved 18 codes
    Saved to: test-data/valuesets/BilateralMastectomy.xml

📥 Retrieving PatientCharacteristicPayer (2.16.840.1.113883.3.464.1003.101.12.1061)...
  ✓ Retrieved 21 codes
    Saved to: test-data/valuesets/PatientCharacteristicPayer.xml

========================================
✅ ValueSet retrieval complete!
========================================
```

## Test Data

### patient-001-bundle.json

Complete FHIR R4 transaction bundle containing test patient data for CMS125 (Breast Cancer Screening) measure.

**Patient Profile:**
- Name: Jane Marie TestPatient
- Gender: Female
- Date of Birth: May 15, 1968 (age 56)
- Status: Active

**Clinical Data:**
- **Encounter**: Office visit on March 15, 2024 (within 2 years)
- **Observation**: Bilateral screening mammogram on September 20, 2023 (within 27 months)
- **Coverage**: Blue Cross Blue Shield HMO (active 2024)

**Expected Measure Results:**
- Initial Population: ✓ (female, age 51-74)
- Denominator: ✓ (has qualifying encounter)
- Numerator: ✓ (has mammography within 27 months)
- Performance Rate: 100%

## Databricks SQL Scripts

Located in `databricks/` directory:

### setup-catalog.sql
Creates Unity Catalog structure:
- `fhir_analytics` catalog
- `bronze` schema (raw data)
- `silver` schema (cleaned data)
- `gold` schema (measure views)
- `terminology` schema (ValueSets)

**Run in:** Databricks SQL Editor

### tables/create-all-tables.sql
Creates bronze layer tables:
- `patient` - Demographics and identifiers
- `encounter` - Clinical encounters
- `observation` - Observations and procedures
- `coverage` - Insurance coverage
- `terminology.valueset_expansion` - Expanded codes

**Run in:** Databricks SQL Editor (after setup-catalog.sql)

### views/cms125-measure-views.sql
Creates gold layer views for CMS125 measure:
- `cms125_initial_population` - Women 51-74 years
- `cms125_qualifying_encounters` - Encounters within 2 years
- `cms125_mammography_performed` - Mammography within 27 months
- `cms125_bilateral_mastectomy` - Exclusion criteria
- `cms125_denominator` - Initial population with encounters
- `cms125_numerator` - Denominator with mammography
- `cms125_measure_report` - Summary with performance rate
- `cms125_patient_level_report` - Patient-level details

**Run in:** Databricks SQL Editor (after tables created and data loaded)

## Workflow

### Complete Setup Flow

1. **Set up Medplum**
   ```bash
   export MEDPLUM_CLIENT_ID='...'
   export MEDPLUM_CLIENT_SECRET='...'
   ./scripts/load-test-data.sh
   ```

2. **Retrieve ValueSets**
   ```bash
   export VSAC_API_KEY='...'
   ./scripts/retrieve-valuesets.sh
   ```

3. **Set up Databricks**
   - Run `databricks/setup-catalog.sql` in SQL Editor
   - Run `databricks/tables/create-all-tables.sql` in SQL Editor

4. **Load Data to Databricks**
   - Manual ETL or use Databricks notebook
   - Load patient, encounter, observation, coverage
   - Load valueset_expansion codes

5. **Create Measure Views**
   - Run `databricks/views/cms125-measure-views.sql` in SQL Editor

6. **Calculate Measure**
   ```sql
   SELECT * FROM fhir_analytics.gold.cms125_measure_report;
   ```

## Troubleshooting

### Common Issues

**load-test-data.sh fails with 401**
- Verify client ID and secret are correct
- Check client has proper access policy
- Try regenerating credentials

**retrieve-valuesets.sh fails with 401**
- Verify VSAC API key is valid
- Check UMLS license is active
- Try regenerating API key

**jq command not found**
- Install jq: `brew install jq` (Mac) or `apt-get install jq` (Linux)
- Or use online JSON parser manually

**Databricks SQL fails**
- Verify SQL Warehouse is running
- Check catalog and schema names
- Confirm access token has permissions

## Next Steps

After running these scripts successfully:

1. **Verify in E2E Demo**
   - Navigate to `/e2e-config`
   - Enter all credentials
   - Test connections
   - Launch demo workflow

2. **Scale Up**
   - Generate additional test patients
   - Load 10-100 patients for performance testing
   - Optimize queries and indexes

3. **Production Deployment**
   - Set up CI/CD pipeline
   - Configure secrets management
   - Enable monitoring and alerting

## Support

For issues or questions:
- Check `docs/E2E_OPERATIONALIZATION_PLAN.md` for detailed guidance
- Review `/faq` page in the web application
- Open GitHub issue with logs and error messages

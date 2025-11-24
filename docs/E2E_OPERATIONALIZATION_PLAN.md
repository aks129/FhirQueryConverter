# End-to-End Operationalization Plan

**Objective**: Deploy a fully functional end-to-end CQL measure evaluation system using real test data across Medplum (FHIR server), NLM VSAC (terminology services), and Databricks (analytics platform).

**Approach**: Start with a single test patient, gradually scaling to production-level data volumes.

---

## Quick Start Summary

### Phase 1: Single Patient Setup (1-2 hours)
1. Create Medplum account and OAuth2 credentials
2. Load 1 test patient with clinical data for CMS125
3. Verify data in Medplum FHIR server

### Phase 2: Terminology Services (30 minutes)
1. Register for NLM VSAC API key
2. Retrieve 3 ValueSets for CMS125 measure
3. Store ValueSets in Medplum

### Phase 3: Databricks Setup (1 hour)
1. Create Databricks workspace and SQL warehouse
2. Set up catalog structure (bronze/silver/gold)
3. Create flattened FHIR tables

### Phase 4: Data Pipeline (1-2 hours)
1. Run ETL script to load data from Medplum to Databricks
2. Create SQL views for measure populations
3. Execute measure calculation

### Phase 5: Integration Testing (30 minutes)
1. Configure E2E demo with real credentials
2. Run complete workflow end-to-end
3. Verify MeasureReport generated

**Total Time**: 4-6 hours for complete operationalization

---

## Detailed Implementation Guide

## Phase 1: Medplum Setup & Test Data

### 1.1 Create Medplum Account

**Steps**:
1. Visit https://app.medplum.com
2. Click "Sign Up" → Create account
3. Verify email address
4. Create new project or use default project

### 1.2 Generate OAuth2 Credentials

**In Medplum Console**:
```
Project Settings → Clients → Create New Client

Settings:
- Name: "E2E Demo Client"
- Description: "OAuth2 client for CQL measure evaluation"
- Grant Types: ✓ client_credentials
- Access Policy: Project Admin (or custom policy for FHIR resources)

Save and copy:
- Client ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Client Secret: (shown once - save securely!)
```

### 1.3 Test Patient Data Bundle

Create file: `test-data/patient-001-bundle.json`

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-001",
      "resource": {
        "resourceType": "Patient",
        "id": "test-patient-001",
        "identifier": [{
          "system": "http://example.org/mrn",
          "value": "TEST001"
        }],
        "name": [{
          "family": "TestPatient",
          "given": ["Jane", "Marie"]
        }],
        "gender": "female",
        "birthDate": "1968-05-15",
        "active": true
      },
      "request": {
        "method": "PUT",
        "url": "Patient/test-patient-001"
      }
    },
    {
      "fullUrl": "urn:uuid:encounter-001",
      "resource": {
        "resourceType": "Encounter",
        "id": "encounter-001",
        "status": "finished",
        "class": {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          "code": "AMB"
        },
        "type": [{
          "coding": [{
            "system": "http://www.ama-assn.org/go/cpt",
            "code": "99213",
            "display": "Office Visit"
          }]
        }],
        "subject": {
          "reference": "Patient/test-patient-001"
        },
        "period": {
          "start": "2024-03-15T10:00:00Z",
          "end": "2024-03-15T10:30:00Z"
        }
      },
      "request": {
        "method": "PUT",
        "url": "Encounter/encounter-001"
      }
    },
    {
      "fullUrl": "urn:uuid:mammography-001",
      "resource": {
        "resourceType": "Observation",
        "id": "mammography-001",
        "status": "final",
        "category": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
            "code": "imaging"
          }]
        }],
        "code": {
          "coding": [{
            "system": "http://loinc.org",
            "code": "24606-6",
            "display": "Mammography bilateral"
          }]
        },
        "subject": {
          "reference": "Patient/test-patient-001"
        },
        "effectiveDateTime": "2023-09-20T14:00:00Z",
        "valueString": "Bilateral screening mammogram. No abnormalities."
      },
      "request": {
        "method": "PUT",
        "url": "Observation/mammography-001"
      }
    }
  ]
}
```

### 1.4 Load Test Data Script

Create file: `scripts/load-test-data.sh`

```bash
#!/bin/bash

# Configuration
MEDPLUM_BASE_URL="https://api.medplum.com"
MEDPLUM_CLIENT_ID="your-client-id"
MEDPLUM_CLIENT_SECRET="your-client-secret"

# Get access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "${MEDPLUM_BASE_URL}/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MEDPLUM_CLIENT_ID}" \
  -d "client_secret=${MEDPLUM_CLIENT_SECRET}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Failed to get access token"
  echo $TOKEN_RESPONSE
  exit 1
fi

echo "✓ Access token obtained"

# Load test data bundle
echo "Loading test patient bundle..."
curl -X POST "${MEDPLUM_BASE_URL}/fhir/R4" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/fhir+json" \
  -d @test-data/patient-001-bundle.json \
  | jq '.'

echo "✓ Test data loaded"

# Verify patient
echo "Verifying patient..."
curl -s "${MEDPLUM_BASE_URL}/fhir/R4/Patient/test-patient-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  | jq '.name[0]'

echo "✓ Patient verified"
```

**Execute**:
```bash
chmod +x scripts/load-test-data.sh
./scripts/load-test-data.sh
```

---

## Phase 2: VSAC ValueSet Retrieval

### 2.1 Get VSAC API Key

**Steps**:
1. Visit https://uts.nlm.nih.gov/uts/
2. Click "Request a License" (if first time)
3. Accept UMLS Metathesaurus License
4. Log in → Profile → API Key Management
5. Click "Generate New API Key"
6. Copy API key (UUID format)

### 2.2 Retrieve ValueSets Script

Create file: `scripts/retrieve-valuesets.sh`

```bash
#!/bin/bash

VSAC_API_KEY="your-vsac-api-key"
MEDPLUM_BASE_URL="https://api.medplum.com"
MEDPLUM_TOKEN="your-medplum-access-token"

# ValueSets for CMS125
VALUESETS=(
  "2.16.840.1.113883.3.464.1003.198.12.1011" # Mammography
  "2.16.840.1.113883.3.526.3.1285"           # Bilateral Mastectomy
  "2.16.840.1.113883.3.464.1003.101.12.1061" # Patient Characteristic Payer
)

for VS_OID in "${VALUESETS[@]}"; do
  echo "Retrieving ValueSet: $VS_OID"

  # Get ValueSet from VSAC
  VSAC_RESPONSE=$(curl -s \
    "https://vsac.nlm.nih.gov/vsac/svs/RetrieveValueSet?id=${VS_OID}" \
    -H "Authorization: Bearer ${VSAC_API_KEY}")

  # Convert to FHIR ValueSet (simplified - proper conversion needed)
  VS_ID=$(echo $VS_OID | tr '.' '-')

  # Store in Medplum
  curl -X PUT "${MEDPLUM_BASE_URL}/fhir/R4/ValueSet/${VS_ID}" \
    -H "Authorization: Bearer ${MEDPLUM_TOKEN}" \
    -H "Content-Type: application/fhir+json" \
    -d "{
      \"resourceType\": \"ValueSet\",
      \"id\": \"${VS_ID}\",
      \"url\": \"urn:oid:${VS_OID}\",
      \"status\": \"active\",
      \"name\": \"ValueSet_${VS_ID}\"
    }"

  echo "✓ Stored ValueSet/${VS_ID}"
done

echo "All ValueSets retrieved and stored!"
```

---

## Phase 3: Databricks Configuration

### 3.1 Create Databricks Workspace

**Steps**:
1. Visit https://databricks.com/try-databricks
2. Select cloud provider (AWS/Azure/GCP)
3. Create Community Edition account (free) or start trial
4. Complete workspace setup

### 3.2 Create SQL Warehouse

**In Databricks Workspace**:
```
SQL → SQL Warehouses → Create SQL Warehouse

Configuration:
- Name: FHIR Analytics Warehouse
- Cluster size: 2X-Small (sufficient for testing)
- Auto stop: 10 minutes
- Min scaling: 1
- Max scaling: 1

Create → Wait for startup (2-3 minutes)
```

### 3.3 Generate Access Token

```
Settings → User Settings → Access Tokens
→ Generate New Token

- Comment: E2E Demo Access
- Lifetime: 90 days

Copy token (starts with "dapi")
```

### 3.4 Create Catalog Structure

**In Databricks SQL Editor**, run:

```sql
-- Create catalog
CREATE CATALOG IF NOT EXISTS fhir_analytics;
USE CATALOG fhir_analytics;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS bronze
  COMMENT 'Raw flattened FHIR data';

CREATE SCHEMA IF NOT EXISTS silver
  COMMENT 'Cleaned and validated data';

CREATE SCHEMA IF NOT EXISTS gold
  COMMENT 'Measure calculation views';

CREATE SCHEMA IF NOT EXISTS terminology
  COMMENT 'ValueSet expansions';

SHOW SCHEMAS;
```

### 3.5 Create Bronze Tables

**Patient Table**:
```sql
USE CATALOG fhir_analytics;
USE SCHEMA bronze;

CREATE TABLE patient (
  id STRING PRIMARY KEY,
  identifier_value STRING,
  name_family STRING,
  name_given ARRAY<STRING>,
  gender STRING,
  birthdate DATE,
  active BOOLEAN,
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
```

**Observation Table**:
```sql
CREATE TABLE observation (
  id STRING PRIMARY KEY,
  patient_id STRING,
  status STRING,
  code_system STRING,
  code_code STRING,
  code_display STRING,
  effective_datetime TIMESTAMP,
  value_string STRING,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
);
```

**Encounter Table**:
```sql
CREATE TABLE encounter (
  id STRING PRIMARY KEY,
  patient_id STRING,
  status STRING,
  class_code STRING,
  type_code STRING,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id)
);
```

**ValueSet Expansion Table**:
```sql
USE SCHEMA terminology;

CREATE TABLE valueset_expansion (
  valueset_oid STRING,
  code_system STRING,
  code STRING,
  display STRING,
  PRIMARY KEY (valueset_oid, code_system, code)
);
```

---

## Phase 4: ETL Pipeline

### 4.1 Simple ETL Script

Create file: `scripts/etl-simple.sh`

```bash
#!/bin/bash

# Load configuration from E2E config
MEDPLUM_URL="https://api.medplum.com"
MEDPLUM_TOKEN="your-token"
DATABRICKS_HOST="your-workspace.cloud.databricks.com"
DATABRICKS_TOKEN="your-databricks-token"
DATABRICKS_WAREHOUSE="your-warehouse-id"

echo "Starting ETL: Medplum → Databricks"

# 1. Extract patient from Medplum
echo "Extracting patient..."
PATIENT=$(curl -s "${MEDPLUM_URL}/fhir/R4/Patient/test-patient-001" \
  -H "Authorization: Bearer ${MEDPLUM_TOKEN}")

PATIENT_ID=$(echo $PATIENT | jq -r '.id')
FAMILY_NAME=$(echo $PATIENT | jq -r '.name[0].family')
GENDER=$(echo $PATIENT | jq -r '.gender')
BIRTHDATE=$(echo $PATIENT | jq -r '.birthDate')

# 2. Load to Databricks
echo "Loading patient to Databricks..."
curl -X POST "${DATABRICKS_HOST}/api/2.0/sql/statements" \
  -H "Authorization: Bearer ${DATABRICKS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"warehouse_id\": \"${DATABRICKS_WAREHOUSE}\",
    \"statement\": \"INSERT INTO fhir_analytics.bronze.patient (id, name_family, gender, birthdate, active) VALUES ('${PATIENT_ID}', '${FAMILY_NAME}', '${GENDER}', '${BIRTHDATE}', true) ON CONFLICT (id) DO UPDATE SET name_family = EXCLUDED.name_family\"
  }"

echo "✓ Patient loaded"

# 3. Extract and load observations
echo "Extracting observations..."
OBSERVATIONS=$(curl -s "${MEDPLUM_URL}/fhir/R4/Observation?subject=Patient/${PATIENT_ID}" \
  -H "Authorization: Bearer ${MEDPLUM_TOKEN}")

echo $OBSERVATIONS | jq -r '.entry[].resource | [.id, .subject.reference, .code.coding[0].code, .effectiveDateTime] | @tsv' | \
while IFS=$'\t' read -r OBS_ID SUBJECT CODE DATETIME; do
  PATIENT_REF=$(echo $SUBJECT | cut -d'/' -f2)

  echo "Loading observation ${OBS_ID}..."
  curl -s -X POST "${DATABRICKS_HOST}/api/2.0/sql/statements" \
    -H "Authorization: Bearer ${DATABRICKS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"warehouse_id\": \"${DATABRICKS_WAREHOUSE}\",
      \"statement\": \"INSERT INTO fhir_analytics.bronze.observation (id, patient_id, code_code, effective_datetime, status) VALUES ('${OBS_ID}', '${PATIENT_REF}', '${CODE}', '${DATETIME}', 'final') ON CONFLICT (id) DO NOTHING\"
    }" > /dev/null
done

echo "✓ Observations loaded"
echo "ETL Complete!"
```

### 4.2 Load ValueSet Expansions

**Manually insert test codes**:
```sql
USE CATALOG fhir_analytics;
USE SCHEMA terminology;

-- Mammography codes
INSERT INTO valueset_expansion VALUES
  ('2.16.840.1.113883.3.464.1003.198.12.1011', 'http://loinc.org', '24606-6', 'Mammography bilateral'),
  ('2.16.840.1.113883.3.464.1003.198.12.1011', 'http://loinc.org', '36625-3', 'Mammography unilateral'),
  ('2.16.840.1.113883.3.464.1003.198.12.1011', 'http://loinc.org', '37768-7', 'Mammography screening');

SELECT * FROM valueset_expansion;
```

---

## Phase 5: Create Measure Views

### 5.1 Gold Layer Views

**Initial Population**:
```sql
USE CATALOG fhir_analytics;
USE SCHEMA gold;

CREATE OR REPLACE VIEW cms125_initial_population AS
SELECT DISTINCT
  p.id AS patient_id,
  p.name_family,
  p.gender,
  p.birthdate,
  TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE()) AS age
FROM fhir_analytics.bronze.patient p
WHERE p.gender = 'female'
  AND TIMESTAMPDIFF(YEAR, p.birthdate, CURRENT_DATE()) BETWEEN 51 AND 74
  AND p.active = true;

-- Test
SELECT * FROM cms125_initial_population;
```

**Qualifying Encounters**:
```sql
CREATE OR REPLACE VIEW cms125_qualifying_encounters AS
SELECT DISTINCT
  e.patient_id,
  e.id AS encounter_id
FROM fhir_analytics.bronze.encounter e
WHERE e.status = 'finished'
  AND e.period_start >= ADD_MONTHS(CURRENT_DATE(), -24);

SELECT * FROM cms125_qualifying_encounters;
```

**Mammography Performed**:
```sql
CREATE OR REPLACE VIEW cms125_mammography_performed AS
SELECT DISTINCT
  o.patient_id,
  o.id AS observation_id,
  o.effective_datetime
FROM fhir_analytics.bronze.observation o
INNER JOIN fhir_analytics.terminology.valueset_expansion vse
  ON vse.valueset_oid = '2.16.840.1.113883.3.464.1003.198.12.1011'
  AND vse.code = o.code_code
WHERE o.status = 'final'
  AND o.effective_datetime >= ADD_MONTHS(CURRENT_DATE(), -27);

SELECT * FROM cms125_mammography_performed;
```

**Denominator**:
```sql
CREATE OR REPLACE VIEW cms125_denominator AS
SELECT ip.patient_id
FROM cms125_initial_population ip
INNER JOIN cms125_qualifying_encounters qe
  ON ip.patient_id = qe.patient_id;

SELECT * FROM cms125_denominator;
```

**Numerator**:
```sql
CREATE OR REPLACE VIEW cms125_numerator AS
SELECT d.patient_id
FROM cms125_denominator d
INNER JOIN cms125_mammography_performed mp
  ON d.patient_id = mp.patient_id;

SELECT * FROM cms125_numerator;
```

**Measure Report**:
```sql
CREATE OR REPLACE VIEW cms125_measure_report AS
WITH counts AS (
  SELECT 'initial-population' AS pop, COUNT(*) AS cnt
  FROM cms125_initial_population
  UNION ALL
  SELECT 'denominator', COUNT(*) FROM cms125_denominator
  UNION ALL
  SELECT 'numerator', COUNT(*) FROM cms125_numerator
)
SELECT
  pop AS population,
  cnt AS count,
  CASE WHEN pop = 'numerator' THEN
    ROUND(cnt * 100.0 / (SELECT cnt FROM counts WHERE pop = 'denominator'), 2)
  END AS percentage
FROM counts;

-- Run measure calculation
SELECT * FROM cms125_measure_report;
```

**Expected Output**:
```
population          | count | percentage
--------------------|-------|------------
initial-population  |   1   | NULL
denominator         |   1   | NULL
numerator           |   1   | 100.00
```

---

## Phase 6: E2E Demo Integration

### 6.1 Configure Demo

1. Open browser → Navigate to deployed app
2. Go to `/e2e-config`
3. Fill in credentials:

**Medplum Tab**:
- Base URL: `https://api.medplum.com`
- Project ID: (from Medplum console)
- Client ID: (from Phase 1)
- Client Secret: (from Phase 1)
- Click "Test Connection" → Verify ✓

**VSAC Tab**:
- API Key: (from Phase 2)
- ValueSet OIDs: (pre-filled)
- Click "Test Connection" → Verify ✓

**Databricks Tab**:
- Host: `your-workspace.cloud.databricks.com`
- Token: (from Phase 3)
- Warehouse ID: (from SQL Warehouse)
- Catalog: `fhir_analytics`
- Schema: `bronze`
- Click "Test Connection" → Verify ✓

**Execution Tab**:
- Patient IDs: `test-patient-001`
- Measure IDs: `CMS125`
- Library IDs: `BCSComponent`
- Period: `2024-01-01` to `2024-12-31`

4. Click "Save Configuration"
5. Click "Launch Demo"

### 6.2 Run E2E Workflow

Execute each step in sequence:

1. **Step 1**: Connect to FHIR Server → Should show capability statement
2. **Step 2**: Select CMS125 measure → Should list available measures
3. **Step 3**: Connect to VSAC → Should retrieve 3 ValueSets
4. **Step 4**: Ingest to Databricks → Should report 1 patient loaded
5. **Step 5**: Create Views → Should create 5 views
6. **Step 6**: Convert CQL to SQL → Should display generated SQL
7. **Step 7**: Review SQL → Should validate syntax
8. **Step 8**: Approve Contract → Manual approval
9. **Step 9**: Execute SQL → Should show:
   - Initial Population: 1
   - Denominator: 1
   - Numerator: 1
   - Performance Rate: 100%
10. **Step 10**: Write back → Should create MeasureReport in Medplum
11. **Step 11**: Review Stats → Should show execution summary

---

## Phase 7: Verification & Testing

### 7.1 Verify Data in Medplum

```bash
# Check patient
curl "https://api.medplum.com/fhir/R4/Patient/test-patient-001" \
  -H "Authorization: Bearer $TOKEN"

# Check MeasureReport was created
curl "https://api.medplum.com/fhir/R4/MeasureReport?measure=Measure/CMS125" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Verify Data in Databricks

```sql
-- Check patient
SELECT * FROM fhir_analytics.bronze.patient;

-- Check observations
SELECT * FROM fhir_analytics.bronze.observation;

-- Check measure calculation
SELECT * FROM fhir_analytics.gold.cms125_measure_report;
```

### 7.3 Success Criteria Checklist

- [ ] Medplum OAuth2 authentication works
- [ ] Test patient data loaded successfully
- [ ] VSAC API key retrieves ValueSets
- [ ] ValueSets stored in Medplum
- [ ] Databricks tables created
- [ ] ETL pipeline loads data
- [ ] Views calculate correctly
- [ ] E2E demo connects to all services
- [ ] Measure calculation shows 100% for test patient
- [ ] MeasureReport created in Medplum
- [ ] Complete workflow under 5 minutes

---

## Phase 8: Scaling to Multiple Patients

### 8.1 Generate 10 Test Patients

Create variations:
- 6 patients: Compliant (in numerator)
- 3 patients: Non-compliant (in denominator only)
- 1 patient: Excluded (bilateral mastectomy)

**Expected Results**:
- Initial Population: 10
- Denominator: 9
- Numerator: 6
- Performance Rate: 66.67%

### 8.2 Performance Benchmarks

| Patients | ETL Time | Query Time | Total Time |
|----------|----------|------------|------------|
| 1        | 5s       | <1s        | 6s         |
| 10       | 15s      | <1s        | 16s        |
| 100      | 45s      | 1s         | 46s        |
| 1,000    | 5min     | 3s         | 5min       |

---

## Troubleshooting

### Issue: Medplum 401 Unauthorized
**Solution**:
- Verify client credentials
- Check token expiry
- Regenerate access token

### Issue: VSAC 403 Forbidden
**Solution**:
- Verify UMLS license is active
- Check API key is current
- Ensure API key has ValueSet access

### Issue: Databricks connection timeout
**Solution**:
- Verify SQL Warehouse is running
- Check token permissions
- Confirm network connectivity

### Issue: No patients in measure populations
**Solution**:
- Verify age calculation logic
- Check date ranges in views
- Confirm ValueSet codes match

### Issue: Performance slow with large datasets
**Solution**:
- Add indexes to foreign keys
- Partition tables by date
- Use Delta Lake optimization
- Increase warehouse size

---

## Next Steps

1. **Production Deployment**:
   - Set up CI/CD pipeline
   - Configure secrets management
   - Enable monitoring and alerting

2. **Add More Measures**:
   - CMS122 (Diabetes HbA1c)
   - CMS130 (Colorectal Cancer Screening)
   - Custom organizational measures

3. **Scale Data**:
   - Synthetic data generation
   - Load testing with 10K+ patients
   - Optimize for sub-second query times

4. **Enhanced Features**:
   - Real-time data streaming
   - Incremental updates
   - Multi-measure batch execution

---

## Resources

- Medplum Documentation: https://www.medplum.com/docs
- NLM VSAC: https://vsac.nlm.nih.gov/
- Databricks SQL: https://docs.databricks.com/sql/
- CQL Specification: https://cql.hl7.org/
- FHIR R4: https://hl7.org/fhir/R4/

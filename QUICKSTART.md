# Quick Start Guide

Get the E2E CQL measure evaluation demo running in under 1 hour.

## Prerequisites

**You will need:**
1. ✅ Medplum account (free at https://app.medplum.com)
2. ✅ NLM VSAC account (free at https://uts.nlm.nih.gov/uts/)
3. ✅ Databricks workspace (free community edition at https://databricks.com)
4. ✅ bash, curl, jq installed on your machine

## Step-by-Step Setup

### 1. Get Medplum Credentials (5 minutes)

1. Visit https://app.medplum.com and sign up
2. Create a new project or use default
3. Go to **Project Settings → Clients**
4. Click **Create New Client**
   - Grant type: `client_credentials`
   - Access policy: Project Admin
5. **Copy the Client ID and Secret** (shown once!)

```bash
export MEDPLUM_CLIENT_ID='your-client-id-here'
export MEDPLUM_CLIENT_SECRET='your-client-secret-here'
```

### 2. Get VSAC API Key (5 minutes)

1. Visit https://uts.nlm.nih.gov/uts/
2. Sign up and accept UMLS license
3. Log in → **Profile → API Key Management**
4. Click **Generate New API Key**
5. **Copy the API key**

```bash
export VSAC_API_KEY='your-api-key-here'
```

### 3. Load Test Data to Medplum (2 minutes)

```bash
# From project root
./scripts/load-test-data.sh
```

**Expected output:**
```
✓ Access token obtained
✓ Test data bundle loaded successfully
✓ Patient found: Jane Marie TestPatient (female, born 1968-05-15)
✓ Encounter found: Office outpatient visit 15 minutes
✓ Observation found: Mammography bilateral
✓ Coverage found: Blue Cross Blue Shield
```

### 4. Retrieve ValueSets (2 minutes)

```bash
./scripts/retrieve-valuesets.sh
```

**Expected output:**
```
✓ Retrieved 34 codes (Mammography)
✓ Retrieved 18 codes (Bilateral Mastectomy)
✓ Retrieved 21 codes (Patient Characteristic Payer)
```

### 5. Set Up Databricks (10 minutes)

1. Visit https://databricks.com/try-databricks
2. Create workspace (free community edition)
3. Create **SQL Warehouse**:
   - SQL → SQL Warehouses → Create
   - Size: 2X-Small
   - Auto-stop: 10 minutes
4. Generate **Access Token**:
   - Settings → User Settings → Access Tokens
   - Generate New Token
   - Copy token (starts with `dapi`)
5. Run SQL scripts in **SQL Editor**:

```sql
-- Copy and run: databricks/setup-catalog.sql
-- Then run: databricks/tables/create-all-tables.sql
```

**Expected output:**
```
Catalog structure created successfully!
All tables created successfully!
```

### 6. Configure E2E Demo (5 minutes)

1. Start the development server:
```bash
npm run dev
```

2. Open browser → http://localhost:5173

3. Navigate to **Configuration** (`/e2e-config`)

4. Fill in all tabs:
   - **Medplum**: Paste Client ID & Secret
   - **VSAC**: Paste API Key
   - **Databricks**:
     - Host: `your-workspace.cloud.databricks.com`
     - Token: `dapi...`
     - Warehouse ID: (from SQL Warehouse details)
   - **Execution**:
     - Patient IDs: `test-patient-001`
     - Measure IDs: `CMS125`

5. Test each connection (should see ✓ Connected)

6. Click **Save Configuration**

7. Click **Launch Demo**

### 7. Run E2E Workflow (5 minutes)

Execute each step in the demo:

1. **Connect to FHIR Server** → Execute
2. **Select CQL Library & Measure** → Execute
3. **Connect to Terminology Services** → Execute
4. **Ingest Data to Databricks** → Execute *(simulated)*
5. **Create View Definitions** → Execute *(simulated)*
6. **Convert CQL to SQL** → Execute
7. **Review & Approve SQL** → Execute
8. **Approve Contract & Quality** → Execute
9. **Execute & Generate Reports** → Execute *(simulated)*
10. **Write Back to FHIR Server** → Execute *(simulated)*
11. **Review Statistics** → See results!

**Expected Results:**
```
Initial Population: 1 patient
Denominator: 1 patient
Numerator: 1 patient
Performance Rate: 100.00%
```

### 8. Verify in Databricks (Optional)

For actual data loading (not simulated), you would:

1. Create ETL script to load data from Medplum to Databricks
2. Run view creation: `databricks/views/cms125-measure-views.sql`
3. Query results:

```sql
USE CATALOG fhir_analytics;
USE SCHEMA gold;

SELECT * FROM cms125_measure_report;
```

## What You've Accomplished

✅ Complete FHIR R4 test patient loaded to Medplum
✅ 3 ValueSets retrieved from NLM VSAC (73 codes)
✅ Databricks catalog and tables created
✅ E2E demo configured and tested
✅ CQL measure calculation demonstrated
✅ MeasureReport generation simulated

## Next Steps

### Scale Up
- Load 10-100 test patients
- Run actual ETL pipeline
- Execute real SQL in Databricks
- Generate actual MeasureReports

### Add More Measures
- CMS122: Diabetes HbA1c Control
- CMS130: Colorectal Cancer Screening
- Custom organizational measures

### Production Deployment
- Set up CI/CD pipeline
- Configure secrets management
- Enable monitoring and alerting
- Implement incremental data updates

## Troubleshooting

### Scripts fail with "jq: command not found"
```bash
# Mac
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via Chocolatey)
choco install jq
```

### Medplum 401 Unauthorized
- Verify client credentials are correct
- Check client has proper permissions
- Regenerate credentials if needed

### VSAC 403 Forbidden
- Verify UMLS license is active
- Check API key is current
- Try regenerating API key

### Databricks connection fails
- Verify SQL Warehouse is running
- Check token has not expired
- Confirm correct warehouse ID

## Documentation

- **Detailed Guide**: [docs/E2E_OPERATIONALIZATION_PLAN.md](docs/E2E_OPERATIONALIZATION_PLAN.md)
- **Script Documentation**: [scripts/README.md](scripts/README.md)
- **CQL Functions**: Visit `/cql-functions` in the app
- **FAQ**: Visit `/faq` in the app

## Support

Need help?
- Review the FAQ page in the application
- Check the detailed operationalization plan
- Open a GitHub issue with error logs

---

**Total Setup Time**: ~30 minutes
**First Successful Run**: ~45 minutes
**Ready for Production**: 4-6 hours (following full plan)

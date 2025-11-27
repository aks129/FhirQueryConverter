# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start full-stack dev server (port 5000)
npm run build        # Build for production (client + server)
npm run start        # Start production server
npm run check        # TypeScript type check
npm run db:push      # Push Drizzle schema to database
```

## Architecture Overview

This is a **FHIR CQL to SQL on FHIR Converter** demonstrating dual evaluation pathways for clinical quality measures (CMS125 Breast Cancer Screening).

### System Components

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Web Application                          │
│  client/ (React + Vite)          server/ (Express)             │
│  - CQL input & validation        - /api/* endpoints            │
│  - FHIR bundle upload            - PostgreSQL via Drizzle      │
│  - Side-by-side comparison                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                    External Integrations                         │
│  Medplum (FHIR Server)    Databricks (SQL Warehouse)           │
│  - Patient/resource storage    - Flattened FHIR tables          │
│  - OAuth2 authentication       - CMS125 measure views           │
│  - FHIR R4 API                 - Dashboard analytics            │
└─────────────────────────────────────────────────────────────────┘
```

### Core Evaluation Logic (`client/src/lib/`)

- **cql-engine.ts**: Executes CQL directly against FHIR bundles in-memory
- **sql-transpiler.ts**: Transpiles CQL to SQL, flattens FHIR data, executes SQL via sql.js
- **fhir-utils.ts**: FHIR bundle parsing, validation, and statistics

Both pathways produce FHIR MeasureReport resources for comparison.

### Path Aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`

## Key Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `home.tsx` | Main CQL editor with dual evaluation |
| `/e2e-demo` | `e2e-demo.tsx` | End-to-end demo with Medplum/Databricks |
| `/e2e-config` | `e2e-config.tsx` | Configure external service credentials |
| `/cql-functions` | `cql-functions.tsx` | CQL function reference |
| `/faq` | `faq.tsx` | Architecture documentation |

## API Endpoints (`server/routes.ts`)

- `POST /api/evaluation-logs` - Store evaluation results
- `GET /api/evaluation-logs/latest` - Latest CQL/SQL comparison
- `POST /api/measure-reports` - Store FHIR MeasureReport
- `GET /api/measure-reports/latest/comparison` - Compare CQL vs SQL reports

## Scripts (`scripts/`)

### Data Loading

```bash
node scripts/load-test-data.sh           # Load test patient to Medplum
node scripts/load-multiple-patients.js   # Load 3 test patients with different outcomes
node scripts/load-fhir-to-databricks.js  # ETL: Medplum → Databricks
```

### Databricks Setup

```bash
node scripts/setup-databricks.js         # Create catalog/schema/tables
node scripts/create-databricks-views.js  # Create SQL on FHIR views
node scripts/create-dashboard.js         # Create measure reports dashboard
```

### Verification

```bash
node scripts/compare-cql-vs-sql.js       # Compare CQL vs SQL evaluation results
node scripts/verify-databricks.js        # Test Databricks connectivity
node scripts/verify-medplum.js           # Test Medplum connectivity
```

## Environment Variables

```bash
# Database (required for backend)
DATABASE_URL=postgresql://...

# Medplum FHIR Server
MEDPLUM_CLIENT_ID=...
MEDPLUM_CLIENT_SECRET=...
MEDPLUM_BASE_URL=https://api.medplum.com

# Databricks SQL Warehouse
DATABRICKS_HOST=your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_WAREHOUSE=warehouse-id

# ValueSet retrieval
VSAC_API_KEY=...
```

## Test Data Structure

```text
test-data/
├── patient-001-bundle.json      # Numerator patient (has mammogram)
├── patient-002-bundle.json      # Denominator exclusion (bilateral mastectomy)
├── patient-003-bundle.json      # Gap patient (needs mammogram)
├── cms125-library.json          # CQL Library FHIR resource
├── cms125-measure.json          # Measure FHIR resource
├── patient-ids.json             # Medplum-generated patient IDs
└── valuesets/
    └── Mammography.json         # Expanded VSAC ValueSet
```

## Databricks SQL Structure

```text
workspace.default/
├── patient, encounter, observation, procedure, coverage  (base tables)
├── patient_view, encounter_view, ...                     (flattened views)
├── cms125_initial_population_view                        (measure views)
├── cms125_denominator_view
├── cms125_numerator_view
├── cms125_sql_measure_report
├── measure_reports                                       (dashboard tables)
├── patient_measure_status
└── dashboard_* views                                     (analytics views)
```

## CMS125 Measure Logic

The breast cancer screening measure evaluates:

- **Initial Population**: Women 51-74 years old
- **Denominator**: Has qualifying encounter in past 2 years
- **Denominator Exclusion**: Bilateral mastectomy
- **Numerator**: Mammography within past 27 months

Sample expected results (3 test patients):

- Initial Population: 3
- Denominator: 2 (1 excluded)
- Numerator: 1
- Performance Rate: 50%

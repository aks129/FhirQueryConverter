# Phase 7 Implementation Plan: Production-Ready Application

## Overview

Transform the FHIR Query Converter into a production-ready clinical quality measure evaluation platform with real FHIR server integration, terminology services, and SQL database connectivity.

## User Experience Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FHIR Query Converter                            │
│                      Production Workflow                             │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Connect to FHIR Server
  ├─ Medplum FHIR Server (medplum.com)
  ├─ Authentication (OAuth2 / API Key)
  ├─ Test connection & verify access
  └─ Display available resources

Step 2: Load CQL Libraries
  ├─ Browse libraries from FHIR server (Library resources)
  ├─ Upload local .cql files
  ├─ Parse and validate CQL syntax
  ├─ Display library metadata and dependencies
  └─ Store in application state

Step 3: Connect to Terminology Server
  ├─ TX.FHIR.ORG (default) or custom
  ├─ Value set expansion via $expand operation
  ├─ Code system lookup via $lookup operation
  ├─ Cache expansions locally
  └─ Display loaded value sets

Step 4: Execute & Generate Measure Reports (CQL Path)
  ├─ Select patient cohort or population
  ├─ Execute CQL against FHIR server
  ├─ Generate FHIR MeasureReport
  ├─ Display results (population counts, scores)
  └─ Store report in FHIR server

Step 5: Translate to SQL & Execute (SQL Path)
  ├─ CQL → AST → ELM → SQL transpilation
  ├─ Display generated SQL
  ├─ Connect to SQL database (DuckDB/Databricks)
  ├─ Execute SQL query
  ├─ Generate FHIR MeasureReport from SQL results
  └─ Compare CQL vs SQL results

Step 6: Database Output Options
  ├─ DuckDB (embedded, file-based)
  ├─ Databricks (cloud data warehouse)
  ├─ Export to Parquet/CSV
  ├─ Create SQL on FHIR views
  └─ Store view definitions

Step 7: Write Back to FHIR Server
  ├─ Post MeasureReport (CQL-generated)
  ├─ Post MeasureReport (SQL-generated)
  ├─ Post ViewDefinition resources
  ├─ Display confirmation & resource IDs
  └─ Link to view in Medplum UI

Step 8: View Management
  ├─ Create SQL on FHIR ViewDefinition
  ├─ Register views in FHIR server
  ├─ Browse existing views
  ├─ Update/delete views
  └─ Export view definitions
```

## Track Breakdown

### Track 1: UX/UI Redesign ⭐ HIGH PRIORITY

**Goal**: Intuitive, wizard-like interface with clear steps

**Components**:
1. **Stepper/Wizard Navigation**
   - 8-step process with progress indicator
   - "Back" and "Next" navigation
   - Step completion checkmarks
   - Current step highlighting

2. **Connection Panels**
   - FHIR Server Connection Card
     - Server URL input (default: Medplum)
     - Authentication (email/password, OAuth2, API key)
     - Test connection button
     - Connection status indicator
   - Terminology Server Connection Card
     - Server URL input (default: TX.FHIR.ORG)
     - Test connection button
     - Value set search/browse

3. **Library Management Panel**
   - Browse FHIR Library resources
   - Upload .cql file button
   - Library list with metadata
   - Dependency visualization
   - Validation status

4. **Execution Dashboard**
   - Dual evaluation cards (CQL vs SQL)
   - Patient cohort selector
   - Measurement period picker
   - Execute buttons
   - Live progress indicators

5. **Results Comparison View**
   - Side-by-side MeasureReport display
   - Population counts comparison table
   - Score comparison
   - Execution time metrics
   - SQL query display (collapsible)

6. **Database Connection Panel**
   - DuckDB (embedded) option
   - Databricks connection form
   - Connection test
   - Schema browser

7. **Write-Back Panel**
   - Resource type selector (MeasureReport, ViewDefinition)
   - Preview before posting
   - Post to FHIR server button
   - Success confirmation with links

**Files to Create**:
- `client/src/components/wizard/StepperNav.tsx`
- `client/src/components/connections/FhirServerConnect.tsx`
- `client/src/components/connections/TerminologyConnect.tsx`
- `client/src/components/library/LibraryManager.tsx`
- `client/src/components/execution/ExecutionDashboard.tsx`
- `client/src/components/results/ResultsComparison.tsx`
- `client/src/components/database/DatabaseConnect.tsx`
- `client/src/components/writeback/WriteBackPanel.tsx`

**Design Principles**:
- Clear visual hierarchy
- Disabled states for incomplete steps
- Error handling with helpful messages
- Loading states for async operations
- Toast notifications for success/errors

### Track 2: Medplum FHIR Server Integration

**Goal**: Connect to Medplum FHIR server and perform CRUD operations

**Features**:
1. **Authentication**
   - Email/password login (gene@fhiriq.com)
   - OAuth2 flow support
   - Token storage (secure)
   - Auto-refresh tokens

2. **FHIR Operations**
   - Search for Library resources
   - Read CQL content from Library.content
   - Search for Measure resources
   - Create MeasureReport resources
   - Create ViewDefinition resources
   - Bundle operations for batch writes

3. **Medplum Client SDK**
   - Install `@medplum/core` and `@medplum/fhirtypes`
   - Create Medplum client wrapper
   - Error handling and retries
   - Type-safe FHIR operations

**Files to Create**:
- `client/src/lib/fhir/medplum-client.ts`
- `client/src/lib/fhir/fhir-auth.ts`
- `client/src/lib/fhir/library-loader.ts`
- `client/src/lib/fhir/measure-report-writer.ts`
- `client/src/lib/fhir/view-definition-writer.ts`
- `client/src/hooks/useMedplumAuth.ts`
- `client/src/hooks/useFhirResources.ts`

**API Endpoints**:
```typescript
// Authentication
POST https://api.medplum.com/auth/login
POST https://api.medplum.com/oauth2/token

// FHIR Operations
GET https://api.medplum.com/fhir/R4/Library?name=DiabetesScreening
GET https://api.medplum.com/fhir/R4/Library/{id}
POST https://api.medplum.com/fhir/R4/MeasureReport
POST https://api.medplum.com/fhir/R4/ViewDefinition
POST https://api.medplum.com/fhir/R4 (Bundle)
```

**Configuration**:
```typescript
const medplumConfig = {
  baseUrl: 'https://api.medplum.com',
  fhirUrl: 'https://api.medplum.com/fhir/R4',
  projectId: 'ad4dd83d-398c-4356-899f-c875901ceb0a',
  clientId: process.env.VITE_MEDPLUM_CLIENT_ID,
  clientSecret: process.env.VITE_MEDPLUM_CLIENT_SECRET,
};
```

### Track 3: Terminology Server Integration

**Goal**: Connect to TX.FHIR.ORG for value set expansion

**Features**:
1. **Value Set Operations**
   - $expand operation
   - $lookup operation
   - $validate-code operation
   - Cache expansions in IndexedDB

2. **Supported Servers**
   - TX.FHIR.ORG (default, public)
   - VSAC (NLM)
   - Ontoserver (CSIRO)
   - Custom terminology servers

3. **Integration**
   - Automatic expansion on CQL parse
   - Load ValueSetExpansion table
   - Display expansion UI
   - Export expansions to SQL database

**Files to Create**:
- `client/src/lib/terminology/terminology-client.ts`
- `client/src/lib/terminology/value-set-expander.ts`
- `client/src/lib/terminology/expansion-cache.ts`
- `client/src/hooks/useTerminologyServer.ts`
- `client/src/components/terminology/ValueSetBrowser.tsx`

**API Endpoints**:
```
GET https://tx.fhir.org/r4/ValueSet/$expand?url={canonical}
GET https://tx.fhir.org/r4/CodeSystem/$lookup?system={system}&code={code}
POST https://tx.fhir.org/r4/ValueSet/$validate-code
```

### Track 4: SQL Database Connectivity

**Goal**: Support DuckDB and Databricks for SQL execution

**Features**:

#### **Option 1: DuckDB (Embedded)**
- Browser-based WASM version
- File-based persistence
- SQL on FHIR views
- Fast analytics
- No server required

```typescript
import * as duckdb from '@duckdb/duckdb-wasm';

// Initialize DuckDB
const db = await duckdb.createDB();
const conn = await db.connect();

// Load FHIR data
await conn.query(`CREATE TABLE Patient AS SELECT * FROM read_json_auto('patients.json')`);

// Execute generated SQL
const result = await conn.query(generatedSQL);
```

#### **Option 2: Databricks (Cloud)**
- SQL warehouse connection
- Large-scale analytics
- JDBC/REST API
- Delta Lake tables

```typescript
// Databricks SQL API
const databricksConfig = {
  serverHostname: process.env.DATABRICKS_HOST,
  httpPath: process.env.DATABRICKS_HTTP_PATH,
  token: process.env.DATABRICKS_TOKEN,
};

// Execute SQL
POST https://{serverHostname}/api/2.0/sql/statements
```

**Files to Create**:
- `client/src/lib/database/duckdb-client.ts`
- `client/src/lib/database/databricks-client.ts`
- `client/src/lib/database/sql-executor.ts`
- `client/src/lib/database/view-manager.ts`
- `client/src/hooks/useDatabaseConnection.ts`

### Track 5: View Definition Management

**Goal**: Create and manage SQL on FHIR ViewDefinition resources

**ViewDefinition Structure**:
```json
{
  "resourceType": "ViewDefinition",
  "id": "patient-demographics-view",
  "url": "http://example.org/fhir/ViewDefinition/patient-demographics",
  "name": "PatientDemographicsView",
  "status": "active",
  "resource": "Patient",
  "select": [
    {
      "column": [
        {"path": "id", "name": "patient_id"},
        {"path": "gender", "name": "gender"},
        {"path": "birthDate", "name": "birth_date"},
        {"path": "name.given.first()", "name": "first_name"},
        {"path": "name.family", "name": "last_name"}
      ]
    }
  ],
  "where": [
    {
      "path": "active",
      "equals": true
    }
  ]
}
```

**Features**:
1. Generate ViewDefinition from CQL
2. Register views in FHIR server
3. Browse existing views
4. Execute views against database
5. Export as SQL DDL

**Files to Create**:
- `client/src/lib/fhir/view-definition-generator.ts`
- `client/src/lib/fhir/view-definition-executor.ts`
- `client/src/components/views/ViewDefinitionEditor.tsx`
- `client/src/components/views/ViewBrowser.tsx`

### Track 6: Enhanced Error Handling & Validation

**Goal**: Robust error handling throughout the pipeline

**Features**:
1. **Connection Errors**
   - Network timeouts
   - Authentication failures
   - Invalid server URLs
   - Certificate issues

2. **Validation Errors**
   - CQL syntax errors
   - Missing value sets
   - Invalid FHIR resources
   - SQL syntax errors

3. **Runtime Errors**
   - Query execution failures
   - Database connection drops
   - Resource not found
   - Permission denied

4. **User Feedback**
   - Toast notifications
   - Inline error messages
   - Error recovery suggestions
   - Detailed error logs (collapsible)

**Files to Create**:
- `client/src/lib/errors/error-handler.ts`
- `client/src/lib/errors/error-types.ts`
- `client/src/components/errors/ErrorBoundary.tsx`
- `client/src/components/errors/ErrorDisplay.tsx`

### Track 7: Testing & Quality Assurance

**Goal**: Comprehensive test coverage

**Test Types**:
1. **Unit Tests**
   - Terminology service
   - Value set expansion
   - Naming validator
   - ELM converter
   - SQL generator

2. **Integration Tests**
   - End-to-end CQL → SQL pipeline
   - FHIR server operations
   - Database connectivity
   - View definition creation

3. **E2E Tests**
   - Complete workflow (all 8 steps)
   - Authentication flow
   - Library loading
   - Measure report generation
   - Write-back to FHIR

**Files to Create**:
- `client/src/lib/terminology/__tests__/value-set-service.test.ts`
- `client/src/lib/elm/__tests__/ast-to-elm.test.ts`
- `client/src/lib/elm/__tests__/elm-to-sql.test.ts`
- `client/src/lib/fhir/__tests__/medplum-client.test.ts`
- `tests/e2e/complete-workflow.spec.ts`

### Track 8: Performance Optimization & Caching

**Goal**: Fast, responsive application

**Optimizations**:
1. **Value Set Caching**
   - IndexedDB for expansions
   - In-memory cache with TTL
   - Background refresh

2. **SQL Query Optimization**
   - Query plan analysis
   - Index suggestions
   - Materialized views

3. **FHIR Bundle Operations**
   - Batch reads
   - Transaction bundles
   - Pagination handling

4. **Code Splitting**
   - Lazy load database clients
   - Lazy load Medplum SDK
   - Route-based splitting

**Files to Create**:
- `client/src/lib/cache/expansion-cache.ts`
- `client/src/lib/cache/indexed-db.ts`
- `client/src/lib/optimization/query-optimizer.ts`

## Environment Variables

```env
# Medplum FHIR Server
VITE_MEDPLUM_BASE_URL=https://api.medplum.com
VITE_MEDPLUM_PROJECT_ID=ad4dd83d-398c-4356-899f-c875901ceb0a
VITE_MEDPLUM_CLIENT_ID=
VITE_MEDPLUM_CLIENT_SECRET=

# Terminology Server
VITE_TERMINOLOGY_SERVER_URL=https://tx.fhir.org/r4

# Databricks (Optional)
VITE_DATABRICKS_HOST=
VITE_DATABRICKS_HTTP_PATH=
VITE_DATABRICKS_TOKEN=

# Feature Flags
VITE_ENABLE_DATABRICKS=false
VITE_ENABLE_DUCKDB=true
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@medplum/core": "^3.0.0",
    "@medplum/fhirtypes": "^3.0.0",
    "@duckdb/duckdb-wasm": "^1.28.0",
    "fhir": "^4.11.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

## Timeline

- **Week 1**: Track 1 (UX/UI Redesign) + Track 2 (Medplum Integration)
- **Week 2**: Track 3 (Terminology) + Track 4 (Database Connectivity)
- **Week 3**: Track 5 (View Definitions) + Track 6 (Error Handling)
- **Week 4**: Track 7 (Testing) + Track 8 (Performance)

## Success Criteria

✅ User can complete all 8 steps without errors
✅ Both CQL and SQL evaluation produce identical results
✅ MeasureReports successfully posted to Medplum
✅ ViewDefinitions created and registered
✅ All connections tested and working
✅ Comprehensive error handling
✅ 80%+ test coverage
✅ Sub-second UI response times

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Medplum auth complexity | Use Medplum SDK, follow official docs |
| CORS issues with TX.FHIR.ORG | Proxy through backend if needed |
| DuckDB WASM size | Code splitting, lazy loading |
| Complex UX flow | User testing, iterative improvements |
| SQL injection | Parameterized queries, validation |

## References

- Medplum Docs: https://www.medplum.com/docs
- TX.FHIR.ORG: https://tx.fhir.org
- SQL on FHIR: https://build.fhir.org/ig/FHIR/sql-on-fhir-v2/
- DuckDB WASM: https://duckdb.org/docs/api/wasm
- Databricks SQL: https://docs.databricks.com/api/workspace/statementexecution

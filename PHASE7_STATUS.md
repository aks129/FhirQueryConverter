# Phase 7 Implementation Status

**Last Updated**: 2025-11-04
**Version**: Alpha v0.2
**Status**: In Progress - Step 1 Complete

---

## Overview

Phase 7 transforms the FHIR Query Converter into a production-ready application with an intuitive 8-step workflow for clinical quality measure evaluation.

## Completed Work

### ✅ Track 1: Core UX Flow (Steps 1-5 of 8 Complete)

#### 1. Planning & Architecture
- **File**: `PHASE7_PLAN.md`
- Comprehensive 8-track implementation plan
- Environment variables configuration
- Timeline and success criteria defined

#### 2. Dependencies Installed
```json
{
  "@medplum/core": "^4.5.2",
  "@medplum/fhirtypes": "^4.5.2",
  "zustand": "^5.0.8",
  "react-hook-form": "^7.66.0",
  "zod": "^3.25.76",
  "@hookform/resolvers": "^3.10.0"
}
```

#### 3. State Management
- **File**: `client/src/store/app-store.ts`
- Zustand store with complete workflow state
- 8-step workflow tracking
- FHIR server, library, terminology, database, and view definition state
- LocalStorage persistence (non-sensitive data only)
- Type-safe with full TypeScript coverage

#### 4. Wizard Navigation
- **File**: `client/src/components/wizard/StepperNav.tsx`
- `StepperNav` - Full horizontal stepper for desktop
- `CompactStepper` - Vertical progress stepper for mobile
- `StepNavigation` - Back/Next/Skip button controls
- Visual progress indicators with completion checkmarks

#### 5. Main Workflow Page
- **File**: `client/src/pages/workflow.tsx`
- 8-step workflow orchestration
- Responsive design (mobile + desktop)
- Error display and handling
- Step-by-step navigation with validation
- Placeholder components for each step

#### 6. Responsive Hook
- **File**: `client/src/hooks/useMediaQuery.ts`
- Media query hook for responsive design
- Mobile/desktop detection

#### 7. FHIR Server Connection (Step 1) ✅ COMPLETE
- **File**: `client/src/components/connections/FhirServerConnect.tsx`
- Medplum authentication with email/password
- Connection management (connect, disconnect, test)
- Form validation with React Hook Form + Zod
- Real-time status feedback
- Pre-filled defaults for quick testing
- Integrated with Zustand store
- **TypeScript compilation**: ✅ Passing

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application State (Zustand)                 │
│  - Workflow Progress (8 steps)                                  │
│  - FHIR Server Connection                                       │
│  - CQL Libraries                                                │
│  - Terminology Server                                           │
│  - SQL Translation                                              │
│  - Database Connection                                          │
│  - Posted Resources                                             │
│  - View Definitions                                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Workflow Page (workflow.tsx)               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Stepper Navigation (Desktop) / Compact (Mobile)          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Step 1: FHIR Connection        [✅ COMPLETE]            │ │
│  │  Step 2: Library Loading        [🔄 NEXT]                │ │
│  │  Step 3: Terminology Connection [⏳ PENDING]             │ │
│  │  Step 4: Execution Dashboard    [⏳ PENDING]             │ │
│  │  Step 5: SQL Translation        [⏳ PENDING]             │ │
│  │  Step 6: Database Connection    [⏳ PENDING]             │ │
│  │  Step 7: Write-Back             [⏳ PENDING]             │ │
│  │  Step 8: View Management        [⏳ PENDING]             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Navigation: [< Back] [Skip] [Next >]                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps (Priority Order)

### Immediate Tasks (Session 2)

#### 1. **Library Manager UI (Step 2)** - IN PROGRESS
**File to Create**: `client/src/components/library/LibraryManager.tsx`

**Features Needed**:
- Browse Library resources from connected FHIR server
- Upload local .cql files
- Parse and validate CQL syntax
- Display library metadata (name, version, dependencies)
- Select library for execution
- Integrated with Zustand store (`addLibrary`, `selectLibrary`)

**API Integration**:
```typescript
// Search for Library resources
GET https://api.medplum.com/fhir/R4/Library?name={libraryName}
GET https://api.medplum.com/fhir/R4/Library/{id}

// Library resource structure
{
  "resourceType": "Library",
  "name": "DiabetesScreening",
  "version": "1.0.0",
  "content": [
    {
      "contentType": "text/cql",
      "data": "<base64-encoded-cql>"
    }
  ]
}
```

**UI Components**:
- Library browser (list of available libraries from FHIR server)
- File upload button (drag & drop support)
- Library card with metadata display
- Validation status indicator
- Dependency visualization
- Select button to set as active library

---

#### 2. **Terminology Server Connection (Step 3)**
**File to Create**: `client/src/components/connections/TerminologyConnect.tsx`

**Features Needed**:
- Connect to TX.FHIR.ORG (default) or custom server
- Test connection
- Browse value sets
- $expand operation for value set expansion
- Cache expansions in Zustand store

**API Integration**:
```typescript
// Value set expansion
GET https://tx.fhir.org/r4/ValueSet/$expand?url={canonical}

// Example
GET https://tx.fhir.org/r4/ValueSet/$expand?url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001
```

---

#### 3. **Execution Dashboard (Step 4)**
**File to Create**: `client/src/components/execution/ExecutionDashboard.tsx`

**Features Needed**:
- Patient cohort selector
- Measurement period picker (start/end dates)
- Execute CQL button
- Progress indicator
- Display generated MeasureReport
- Population counts display
- Execution time metrics

**Integration**:
- Use existing CQL execution engine from Phase 6
- Generate FHIR MeasureReport resource
- Store in Zustand (`setCqlMeasureReport`)

---

#### 4. **SQL Translation Interface (Step 5)**
**File to Create**: `client/src/components/translation/SqlTranslationPanel.tsx`

**Features Needed**:
- Display selected CQL library
- "Translate to SQL" button
- Show generated SQL (syntax highlighted)
- Display ELM intermediate representation (collapsible)
- Execute SQL against sample data
- Show SQL MeasureReport
- Compare CQL vs SQL results side-by-side

**Integration**:
- Use existing AST → ELM → SQL pipeline from Phase 6
- Store SQL in Zustand (`setGeneratedSql`)
- Store SQL MeasureReport (`setSqlMeasureReport`)

---

#### 5. **Database Connection (Step 6)**
**Files to Create**:
- `client/src/components/database/DatabaseConnect.tsx`
- `client/src/lib/database/duckdb-client.ts`

**Features Needed**:
- Database type selector (DuckDB vs Databricks)
- DuckDB: Embedded WASM version, file-based persistence
- Databricks: Connection form (host, token, http path)
- Test connection button
- Schema browser
- Execute SQL query against database

**DuckDB Integration**:
```typescript
import * as duckdb from '@duckdb/duckdb-wasm';

// Initialize DuckDB
const db = await duckdb.createDB();
const conn = await db.connect();

// Load FHIR data
await conn.query(`CREATE TABLE Patient AS SELECT * FROM read_json_auto('patients.json')`);

// Execute SQL
const result = await conn.query(generatedSQL);
```

---

#### 6. **Write-Back Panel (Step 7)**
**File to Create**: `client/src/components/writeback/WriteBackPanel.tsx`

**Features Needed**:
- Display CQL MeasureReport (preview)
- Display SQL MeasureReport (preview)
- "Post to FHIR Server" buttons
- Success confirmation with resource IDs
- Links to view resources in Medplum UI

**API Integration**:
```typescript
// Post MeasureReport
POST https://api.medplum.com/fhir/R4/MeasureReport
Content-Type: application/fhir+json

{
  "resourceType": "MeasureReport",
  "status": "complete",
  "type": "summary",
  ...
}
```

---

#### 7. **View Definition Manager (Step 8)**
**File to Create**: `client/src/components/views/ViewDefinitionEditor.tsx`

**Features Needed**:
- Create ViewDefinition from SQL
- Edit existing views
- Delete views
- Post to FHIR server
- Browse existing views

**ViewDefinition Structure**:
```json
{
  "resourceType": "ViewDefinition",
  "name": "PatientDemographicsView",
  "status": "active",
  "resource": "Patient",
  "select": [...],
  "where": [...]
}
```

---

## Remaining Tracks (Phase 7)

### Track 2: Error Handling & Validation
- Comprehensive error boundaries
- Form validation across all steps
- Network error handling
- Toast notifications for success/error

### Track 3: Testing
- Unit tests for state management
- Integration tests for FHIR operations
- E2E tests for complete workflow

### Track 4: Performance Optimization
- Value set caching (IndexedDB)
- Code splitting and lazy loading
- Query optimization

---

## Environment Configuration

```env
# Medplum FHIR Server
VITE_MEDPLUM_BASE_URL=https://api.medplum.com
VITE_MEDPLUM_PROJECT_ID=ad4dd83d-398c-4356-899f-c875901ceb0a

# Terminology Server
VITE_TERMINOLOGY_SERVER_URL=https://tx.fhir.org/r4

# Feature Flags
VITE_ENABLE_DATABRICKS=false
VITE_ENABLE_DUCKDB=true
```

---

## Known Issues

### Development Server
- Windows CMD doesn't support `NODE_ENV=development` syntax
- **Workaround**: Use `npx tsx server/index.ts` directly
- **Alternative**: Install cross-env package

### Network Socket Issue
- `ENOTSUP` error on Windows when binding to 0.0.0.0:5000
- Development server may require different port binding

---

## Files Created (Phase 7)

```
PHASE7_PLAN.md                                    # Implementation roadmap
PHASE7_STATUS.md                                  # This file
client/src/store/app-store.ts                     # Zustand state management
client/src/components/wizard/StepperNav.tsx       # Stepper navigation
client/src/components/connections/FhirServerConnect.tsx  # FHIR auth
client/src/hooks/useMediaQuery.ts                 # Responsive hook
client/src/pages/workflow.tsx                     # Main workflow page
```

---

## Testing Checklist

Before proceeding to next phase:

- [ ] All TypeScript compilation passes (✅ Currently passing)
- [ ] FHIR connection works with Medplum
- [ ] Library loading from FHIR server
- [ ] Terminology server connection
- [ ] CQL execution generates MeasureReport
- [ ] SQL translation works
- [ ] Database connection (DuckDB)
- [ ] Write-back to FHIR server
- [ ] View definitions created

---

## Success Metrics (Phase 7 Complete)

✅ User can complete all 8 steps without errors
✅ Both CQL and SQL evaluation produce identical results
✅ MeasureReports successfully posted to Medplum
✅ ViewDefinitions created and registered
✅ All connections tested and working
✅ Comprehensive error handling
✅ Sub-second UI response times

---

## Quick Commands

```bash
# Install dependencies
npm install

# Type check
npm run check

# Build client
npm run build:client

# Start dev server (Windows)
npx tsx server/index.ts

# Commit changes
git add .
git commit -m "Phase 7: Implement Step 1 (FHIR Connection)"
git push
```

---

## Next Session Goals

1. Complete Library Manager UI (Step 2)
2. Implement Terminology Server Connection (Step 3)
3. Build Execution Dashboard (Step 4)
4. Test end-to-end workflow for Steps 1-4

**Estimated Time**: 2-3 hours for Steps 2-4

---

## References

- [Phase 7 Plan](./PHASE7_PLAN.md)
- [Phase 6 Implementation](./PHASE6_IMPLEMENTATION.md)
- [Medplum Docs](https://www.medplum.com/docs)
- [TX.FHIR.ORG](https://tx.fhir.org)
- [SQL on FHIR](https://build.fhir.org/ig/FHIR/sql-on-fhir-v2/)

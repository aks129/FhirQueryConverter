# Phase 6 Quick Start Guide

## What's New in Phase 6?

Phase 6 adds HL7-compliant CQL best practices and ELM (Expression Logical Model) integration to the FHIR Query Converter.

## Key Features

### 1. Value Set Support with Canonical URLs

```cql
library DiabetesScreening

valueset "Diabetes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001'

define "Patients with Diabetes":
  [Condition: "Diabetes"]
```

**What happens:**
- Recognizes canonical URL format
- Generates SQL with `EXISTS` subquery against `ValueSetExpansion` table
- Properly matches codes using system + code (not just display text)

### 2. Automatic Status Filtering

```cql
define "Recent Observations":
  [Observation: "Heart Rate"]
```

**Generated SQL automatically includes:**
```sql
WHERE o.status IN ('final', 'amended', 'corrected')
```

No need to manually filter out preliminary or cancelled data!

### 3. Naming Convention Validation

The transpiler now validates CQL naming conventions and provides suggestions:

```cql
define "initial_population": ...  ❌ Should be PascalCase

⚠️ Warning:
  - definition "initial_population": Definition names must use PascalCase
    Suggestion: InitialPopulation
```

### 4. ELM Intermediate Representation

New architecture provides a clean separation:

```
CQL → AST → ELM → SQL
```

Benefits:
- Standard HL7 representation
- Can generate multiple target languages (SQL, JavaScript, C#)
- Better optimization opportunities
- Clearer debugging

### 5. Enhanced Temporal Operators

New operators supported:
- `on or before`
- `on or after`
- `before`
- `after`
- `during`
- `starts`
- `ends`
- `overlaps`

## File Structure

```
client/src/lib/
├── terminology/
│   ├── value-set-types.ts       # Type definitions for value sets
│   └── value-set-service.ts     # Service for value set management
├── elm/
│   ├── elm-types.ts             # ELM type definitions (HL7 standard)
│   ├── ast-to-elm.ts            # Convert CQL AST to ELM
│   └── elm-to-sql.ts            # Convert ELM to SQL
├── cql-parser/
│   ├── naming-validator.ts      # Naming convention checker
│   ├── ast-to-sql.ts            # Enhanced with best practices
│   └── ast-types.ts             # Updated with new operators
└── db/
    └── schema-init.ts           # Database schema with ValueSetExpansion
```

## How to Use Value Sets

### Step 1: Register Value Set Expansion

```typescript
import { ValueSetService } from '@/lib/terminology/value-set-service';

const service = new ValueSetService();

service.registerExpansion({
  valueSetUrl: 'http://example.org/fhir/ValueSet/diabetes-codes',
  version: '1.0.0',
  contains: [
    {
      system: 'http://snomed.info/sct',
      code: '44054006',
      display: 'Diabetes mellitus type 2 (disorder)'
    },
    {
      system: 'http://snomed.info/sct',
      code: '46635009',
      display: 'Diabetes mellitus type 1 (disorder)'
    }
  ]
});
```

### Step 2: Load into Database

```typescript
import { initializeDatabase } from '@/lib/db/schema-init';

await initializeDatabase(db);
// This creates ValueSetExpansion table and loads sample value sets
```

### Step 3: Use in CQL

```cql
define "Has Diabetes":
  exists ([Condition: "http://example.org/fhir/ValueSet/diabetes-codes"])
```

### Step 4: Generated SQL

```sql
SELECT c.subject_id AS patient_id
FROM Condition_view c
WHERE c.clinical_status = 'active'
  AND EXISTS (
    SELECT 1 FROM ValueSetExpansion vse
    WHERE vse.value_set_url = 'http://example.org/fhir/ValueSet/diabetes-codes'
      AND vse.code = c.code
      AND vse.system = c.code_system
  )
```

## Using the ELM Pipeline

### Option 1: Direct AST-to-SQL (Current Default)

```typescript
import { AstToSqlTranspiler } from '@/lib/cql-parser/ast-to-sql';

const transpiler = new AstToSqlTranspiler();
const sql = transpiler.transpile(cqlAst);
```

### Option 2: AST → ELM → SQL (New)

```typescript
import { AstToElmConverter } from '@/lib/elm/ast-to-elm';
import { ElmToSqlTranspiler } from '@/lib/elm/elm-to-sql';

// Step 1: Convert AST to ELM
const elmConverter = new AstToElmConverter();
const elmLibrary = elmConverter.convertLibrary(cqlAst);

// Step 2: Convert ELM to SQL
const sqlTranspiler = new ElmToSqlTranspiler({
  measurementPeriod: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-12-31T23:59:59Z'
  }
});
const sql = sqlTranspiler.transpile(elmLibrary);
```

Benefits of ELM pipeline:
- Can inspect/modify ELM before SQL generation
- Can serialize ELM for storage/transmission
- Can generate other target languages from same ELM

## Naming Convention Rules

| Element | Convention | ✅ Good | ❌ Bad |
|---------|-----------|---------|--------|
| Library | PascalCase | `DiabetesScreening` | `diabetes_screening` |
| Define | PascalCase | `InInitialPopulation` | `in_initial_population` |
| Function | PascalCase | `CalculateAge` | `calculate_age` |
| Parameter | PascalCase | `MeasurementPeriod` | `measurement_period` |
| Variable | camelCase | `patientAge` | `PatientAge` |

## Status Filters by Resource

| Resource | Automatic Filter |
|----------|------------------|
| Observation | `status IN ('final', 'amended', 'corrected')` |
| Condition | `clinical_status = 'active'` |
| Procedure | `status = 'completed'` |
| MedicationRequest | `status IN ('active', 'completed')` |
| Encounter | `status = 'finished'` |
| DiagnosticReport | `status IN ('final', 'amended', 'corrected')` |

These filters are automatically added to every query for these resources!

## Sample Value Sets Included

The system comes with pre-loaded sample value sets:

1. **Heart Rate Codes**
   - URL: `http://example.org/fhir/ValueSet/heart-rate-codes`
   - Systems: LOINC, SNOMED

2. **Diabetes Codes**
   - URL: `http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001`
   - System: SNOMED CT

3. **BMI Codes**
   - URL: `http://example.org/fhir/ValueSet/bmi-codes`
   - System: LOINC

4. **Colonoscopy Codes**
   - URL: `http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.108.12.1020`
   - Systems: SNOMED, CPT

## Code Systems Recognized

| Code System | Canonical URL |
|-------------|---------------|
| LOINC | `http://loinc.org` |
| SNOMED CT | `http://snomed.info/sct` |
| RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| CPT | `http://www.ama-assn.org/go/cpt` |
| ICD-10-CM | `http://hl7.org/fhir/sid/icd-10-cm` |
| CVX | `http://hl7.org/fhir/sid/cvx` |

## Debugging Tips

### View Naming Violations

```typescript
const transpiler = new AstToSqlTranspiler();
const sql = transpiler.transpile(cqlAst);
const logs = transpiler.getLogs();

console.log(logs.join('\n'));
// Shows naming convention warnings and conversion steps
```

### Inspect ELM Structure

```typescript
const elmConverter = new AstToElmConverter();
const elmLibrary = elmConverter.convertLibrary(cqlAst);

console.log(JSON.stringify(elmLibrary, null, 2));
// View the complete ELM tree
```

### Check Value Set Membership

```typescript
const service = new ValueSetService();
service.loadSampleExpansions();

const isMember = service.isMemberOf(
  { system: 'http://snomed.info/sct', code: '44054006' },
  'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001'
);

console.log('Is member:', isMember);
```

## Migration Guide

### If you're using the old system:

**Before (Phase 5):**
```cql
define "Patients with Diabetes":
  [Condition] C
    where C.code.text ~ 'Diabetes'
```

**After (Phase 6):**
```cql
define "PatientsWithDiabetes":  -- PascalCase!
  [Condition: "http://cts.nlm.nih.gov/fhir/ValueSet/diabetes-codes"]
  -- No need to filter status - automatic!
  -- Uses proper code system matching
```

### Breaking Changes

**None!** Phase 6 is backward compatible:
- Legacy LIKE-based code matching still works
- Non-canonical strings continue to use display text matching
- Existing queries continue to work unchanged

### Recommended Changes

1. **Use PascalCase for definitions** to avoid warnings
2. **Use canonical URLs** for value sets when available
3. **Remove manual status filters** (now automatic)
4. **Use new temporal operators** for clarity

## References

- [Phase 6 Implementation Details](./PHASE6_IMPLEMENTATION.md)
- [Phase 6 Planning Document](./PHASE6_PLAN.md)
- [HL7 CQL Implementation Guide](http://hl7.org/fhir/us/cql/STU2/)
- [Using CQL with FHIR](https://hl7.org/fhir/uv/cql/STU2/using-cql.html)
- [ELM Specification](https://cql.hl7.org/elm.html)

## Next Steps

1. Try the examples in the main UI
2. Load custom value set expansions
3. Experiment with the ELM pipeline
4. Review the generated SQL to understand the patterns
5. Provide feedback on the HL7 compliance

---

**Phase 6 Status**: ✅ COMPLETE (Tracks 1-5, 8)

**Pending**: Track 6 (Comprehensive Test Suite), Track 7 (Performance Optimizations)

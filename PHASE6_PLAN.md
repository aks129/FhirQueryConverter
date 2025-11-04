# Phase 6: CQL Best Practices & ELM Integration - Implementation Plan

## Overview
This phase focuses on aligning the FHIR Query Converter with HL7 CQL implementation best practices and exploring ELM (Expression Logical Model) as an intermediate representation for enhanced SQL generation.

## Resources Reviewed
1. [HL7 FHIR US CQL Implementation Guide](https://hl7.org/fhir/us/cql/)
2. [HL7 Using CQL with FHIR (STU2)](https://hl7.org/fhir/uv/cql/STU2/using-cql.html)
3. [Firely CQL SDK Architecture](https://github.com/FirelyTeam/firely-cql-sdk)

---

## Track 1: Terminology & Value Set Best Practices

### Goal
Align with HL7 terminology handling standards for production-quality CQL evaluation.

### Current State
- ✅ Basic code filtering: `[Observation: "Heart Rate"]`
- ✅ LIKE-based matching for code_text columns
- ❌ No canonical URL support for value sets
- ❌ No terminology service integration
- ❌ String-based testing instead of proper membership

### Implementation Tasks

#### Task 1.1: Canonical URL Support for Value Sets
**Priority**: High
**Effort**: Medium

**Implementation**:
```typescript
// Current: [Observation: "Heart Rate"]
// Best Practice: [Observation: code in "http://example.org/fhir/ValueSet/heart-rate-codes"]

interface ValueSetReference {
  canonicalUrl: string;
  version?: string;
  expansionTimestamp?: string;
}

// Parse value set URLs in code filters
// Map to SQL queries against value set expansion tables
```

**SQL Schema Addition**:
```sql
CREATE TABLE ValueSetExpansion (
  value_set_url TEXT,
  code TEXT,
  system TEXT,
  display TEXT,
  version TEXT
);

-- Query pattern:
SELECT o.* FROM Observation_view o
WHERE EXISTS (
  SELECT 1 FROM ValueSetExpansion vse
  WHERE vse.value_set_url = 'http://example.org/fhir/ValueSet/heart-rate-codes'
    AND vse.code = o.code
    AND vse.system = o.code_system
);
```

**Benefits**:
- Standards-compliant value set references
- Multi-code system support (LOINC, SNOMED, RxNorm)
- Version-specific value set expansions

---

#### Task 1.2: Terminology Membership Operations
**Priority**: High
**Effort**: Medium

**Implementation**:
```typescript
// Support CQL terminology membership: code in ValueSet
// Parse IN operator with value set identifiers

private generateTerminologyMembership(
  codeExpr: CqlExpressionNode,
  valueSetExpr: CqlExpressionNode
): string {
  const valueSetUrl = this.extractValueSetUrl(valueSetExpr);
  const codeColumn = this.generateExpression(codeExpr);

  return `EXISTS (
    SELECT 1 FROM ValueSetExpansion vse
    WHERE vse.value_set_url = '${valueSetUrl}'
      AND vse.code = ${codeColumn}.code
      AND vse.system = ${codeColumn}.system
  )`;
}
```

**Parser Enhancement**:
- Recognize `in` operator with ValueSet identifiers
- Distinguish between `in` for lists vs. value sets
- Support qualified value set names: `"VSAC".DiabetesCodes`

---

#### Task 1.3: Code System Canonical URLs
**Priority**: Medium
**Effort**: Low

**Implementation**:
```typescript
// Support: code from "http://loinc.org" is "8867-4"
// Instead of: code.text = "Heart Rate"

interface CodeSystemReference {
  canonicalUrl: string;
  code: string;
  display?: string;
}

// Map to proper system-code matching in SQL
WHERE o.code_system = 'http://loinc.org' AND o.code = '8867-4'
```

---

## Track 2: Query Pattern Compliance

### Goal
Implement HL7-recommended CQL query patterns for FHIR resource retrieval.

### Current State
- ✅ Basic queries: `[Patient] P where P.age >= 18`
- ✅ WITH clauses for relationships
- ✅ Code filters
- ❌ Status filtering not enforced
- ❌ Temporal constraints simplified
- ❌ Missing multi-status patterns

### Implementation Tasks

#### Task 2.1: Status Filtering Enforcement
**Priority**: High
**Effort**: Low

**Implementation**:
```typescript
// Add automatic status filtering per HL7 patterns
private addDefaultStatusFilter(
  resourceType: string,
  alias: string
): string | null {
  const statusFilters: { [key: string]: string } = {
    'Observation': `${alias}.status IN ('final', 'amended', 'corrected')`,
    'Condition': `${alias}.clinical_status = 'active'`,
    'Procedure': `${alias}.status = 'completed'`,
    'MedicationRequest': `${alias}.status IN ('active', 'completed')`,
  };

  return statusFilters[resourceType] || null;
}

// Auto-inject in WHERE clause generation
// Allow override with explicit WHERE status = ...
```

**Example**:
```cql
[Observation: "BMI"] BMI
  where BMI.effective during "Measurement Period"
```

Generates:
```sql
SELECT o.id FROM Observation_view o
WHERE o.code_text LIKE '%BMI%'
  AND o.status IN ('final', 'amended', 'corrected')  -- Auto-added
  AND o.effective_datetime BETWEEN ...
```

---

#### Task 2.2: Enhanced Temporal Constraints
**Priority**: Medium
**Effort**: Medium

**Implementation**:
```typescript
// Support CQL temporal operators:
// - during, overlaps, starts, ends, meets
// - before, after, same as
// - includes, included in

interface TemporalOperator {
  operator: 'during' | 'overlaps' | 'starts' | 'ends' | 'before' | 'after';
  leftExpr: CqlExpressionNode;
  rightExpr: CqlExpressionNode;
  precision?: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
}

private generateTemporalOperation(op: TemporalOperator): string {
  switch (op.operator) {
    case 'during':
      return `${op.leftExpr} BETWEEN ${op.rightExpr.start} AND ${op.rightExpr.end}`;
    case 'overlaps':
      return `(${op.leftExpr.start} <= ${op.rightExpr.end} AND ${op.leftExpr.end} >= ${op.rightExpr.start})`;
    case 'before':
      return `${op.leftExpr} < ${op.rightExpr}`;
    // ... other operators
  }
}
```

---

#### Task 2.3: Multi-Resource Query Patterns
**Priority**: Medium
**Effort**: High

**Implementation**:
```cql
// HL7 pattern: Encounters with qualifying procedures
[Encounter: "Inpatient"] E
  with [Procedure: "Cardiac Surgery"] P
    such that P.performed during E.period
  where E.status = 'finished'
    and duration in days of E.period >= 3
```

**SQL Generation**:
```sql
SELECT e.id AS patient_id
FROM Encounter_view e
LEFT JOIN Procedure_view p ON p.subject_id = e.subject_id
  AND p.code_text LIKE '%Cardiac Surgery%'
  AND p.performed_datetime BETWEEN e.period_start AND e.period_end
WHERE e.status = 'finished'
  AND e.class_code LIKE '%Inpatient%'
  AND JULIANDAY(e.period_end) - JULIANDAY(e.period_start) >= 3
```

**Requirements**:
- Support `duration in days/hours/minutes of` expression
- Handle nested period comparisons
- Generate efficient JOIN conditions

---

## Track 3: Naming Convention Enforcement

### Goal
Enforce HL7 CQL naming standards for data types, elements, and functions.

### Current State
- ✅ Parser handles both PascalCase and camelCase
- ❌ No validation or warnings for incorrect casing
- ❌ No automatic case normalization

### Implementation Tasks

#### Task 3.1: Naming Validation
**Priority**: Low
**Effort**: Low

**Implementation**:
```typescript
class NamingValidator {
  validateDataType(name: string): ValidationResult {
    // Must be PascalCase: Patient, Observation, etc.
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      return {
        valid: false,
        message: `Data type "${name}" should use PascalCase per HL7 standards`,
        suggestion: this.toPascalCase(name),
      };
    }
    return { valid: true };
  }

  validateElement(name: string): ValidationResult {
    // Should be camelCase: birthDate, authoredOn, etc.
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
      return {
        valid: false,
        message: `Element "${name}" should use camelCase per HL7 standards`,
        suggestion: this.toCamelCase(name),
      };
    }
    return { valid: true };
  }
}

// Add to parser for warnings
// Add to SQL generator with auto-correction
```

---

#### Task 3.2: Case Normalization
**Priority**: Low
**Effort**: Low

**Implementation**:
```typescript
// Auto-correct common mistakes:
// "patient" → "Patient"
// "BirthDate" → "birthDate"
// "observationStatus" → "status" (if exists in FHIR spec)

private normalizeIdentifier(
  name: string,
  context: 'dataType' | 'element' | 'alias'
): string {
  if (context === 'dataType') {
    return this.toPascalCase(name);
  } else if (context === 'element') {
    return this.toCamelCase(name);
  }
  return name;
}
```

---

## Track 4: ELM Integration Architecture

### Goal
Introduce ELM (Expression Logical Model) as an intermediate representation between CQL parsing and SQL generation, following the Firely CQL SDK pattern.

### Current State
- ✅ Direct AST → SQL transpilation
- ❌ No ELM intermediate layer
- ❌ No expression normalization
- ❌ Limited optimization opportunities

### Architecture Proposal

```
Current:  CQL Text → AST → SQL
Proposed: CQL Text → AST → ELM → SQL
```

### Implementation Tasks

#### Task 4.1: ELM Type Definitions
**Priority**: High
**Effort**: High

**Implementation**:
```typescript
// Define ELM node types following HL7 ELM specification
// https://cql.hl7.org/elm.html

export namespace ELM {
  export interface Library {
    identifier: LibraryIdentifier;
    schemaIdentifier: VersionedIdentifier;
    usings: UsingDef[];
    includes: IncludeDef[];
    parameters: ParameterDef[];
    statements: ExpressionDef[];
  }

  export interface ExpressionDef {
    name: string;
    context: string;
    expression: Expression;
    accessLevel?: 'Public' | 'Private';
  }

  export interface Query extends Expression {
    source: AliasedQuerySource[];
    let?: LetClause[];
    relationship?: RelationshipClause[];
    where?: Expression;
    return?: ReturnClause;
    sort?: SortClause;
  }

  export interface Retrieve extends Expression {
    dataType: string;
    templateId?: string;
    codeProperty?: string;
    codes?: Expression;
    dateProperty?: string;
    dateRange?: Expression;
  }

  // ... additional ELM types
}
```

---

#### Task 4.2: AST to ELM Converter
**Priority**: High
**Effort**: High

**Implementation**:
```typescript
export class AstToElmConverter {
  convert(ast: LibraryNode): ELM.Library {
    return {
      identifier: this.convertLibraryIdentifier(ast),
      usings: ast.usings.map(u => this.convertUsing(u)),
      statements: ast.defines.map(d => this.convertDefine(d)),
      // ...
    };
  }

  private convertDefine(define: DefineNode): ELM.ExpressionDef {
    return {
      name: define.name,
      context: 'Patient',
      expression: this.convertExpression(define.expression),
      accessLevel: 'Public',
    };
  }

  private convertExpression(expr: CqlExpressionNode): ELM.Expression {
    switch (expr.type) {
      case 'Query':
        return this.convertQuery(expr);
      case 'ResourceReference':
        return this.convertResourceReference(expr);
      // ... handle all expression types
    }
  }

  private convertQuery(query: QueryNode): ELM.Query {
    return {
      type: 'Query',
      source: [{
        alias: query.alias || this.generateAlias(query.source),
        expression: this.convertRetrieve(query.source),
      }],
      where: query.where ? this.convertExpression(query.where) : undefined,
      return: query.return ? {
        expression: this.convertExpression(query.return),
        distinct: false,
      } : undefined,
    };
  }

  private convertResourceReference(ref: ResourceReferenceNode): ELM.Retrieve {
    return {
      type: 'Retrieve',
      dataType: `{http://hl7.org/fhir}${ref.resourceType}`,
      templateId: undefined,
      codeProperty: ref.codeFilter ? 'code' : undefined,
      codes: ref.codeFilter ? this.convertExpression(ref.codeFilter) : undefined,
    };
  }
}
```

**Benefits**:
- Normalized expression representation
- Easier to validate and optimize
- Multiple output targets from same ELM (SQL, C#, JavaScript)
- Better alignment with HL7 specifications

---

#### Task 4.3: ELM to SQL Generator
**Priority**: High
**Effort**: Medium

**Implementation**:
```typescript
export class ElmToSqlGenerator {
  private context: SqlGenerationContext;

  generate(elm: ELM.Library): string {
    // Build CTEs from expression definitions
    const ctes = elm.statements.map(stmt => this.generateStatement(stmt));

    // Build final query
    const finalQuery = this.generateFinalQuery(elm);

    return this.assembleSqlQuery(ctes, finalQuery);
  }

  private generateStatement(stmt: ELM.ExpressionDef): string {
    const sql = this.generateExpression(stmt.expression);
    return `${this.sanitizeName(stmt.name)} AS (\n${sql}\n)`;
  }

  private generateExpression(expr: ELM.Expression): string {
    switch (expr.type) {
      case 'Query':
        return this.generateQuery(expr as ELM.Query);
      case 'Retrieve':
        return this.generateRetrieve(expr as ELM.Retrieve);
      case 'Equal':
      case 'Greater':
      case 'Less':
        return this.generateComparison(expr);
      // ... handle all ELM expression types
    }
  }

  private generateRetrieve(retrieve: ELM.Retrieve): string {
    const resourceType = this.extractResourceType(retrieve.dataType);
    const table = `${resourceType}_view`;
    const alias = resourceType[0].toLowerCase();

    let sql = `SELECT ${alias}.id FROM ${table} ${alias}`;

    const conditions: string[] = [];

    // Add code filter
    if (retrieve.codes) {
      const codeCondition = this.generateCodeFilter(retrieve.codes, alias);
      conditions.push(codeCondition);
    }

    // Add date filter
    if (retrieve.dateRange) {
      const dateCondition = this.generateDateFilter(
        retrieve.dateProperty!,
        retrieve.dateRange,
        alias
      );
      conditions.push(dateCondition);
    }

    if (conditions.length > 0) {
      sql += `\nWHERE ${conditions.join(' AND ')}`;
    }

    return sql;
  }

  private generateQuery(query: ELM.Query): string {
    const lines: string[] = [];

    // SELECT clause
    if (query.return) {
      lines.push(`SELECT ${this.generateExpression(query.return.expression)}`);
    } else {
      lines.push(`SELECT ${query.source[0].alias}.id`);
    }

    // FROM clause with sources
    query.source.forEach((source, index) => {
      if (index === 0) {
        lines.push(`FROM ${this.generateExpression(source.expression)} ${source.alias}`);
      } else {
        lines.push(`LEFT JOIN ${this.generateExpression(source.expression)} ${source.alias} ON ...`);
      }
    });

    // WHERE clause
    if (query.where) {
      lines.push(`WHERE ${this.generateExpression(query.where)}`);
    }

    return lines.join('\n');
  }
}
```

---

#### Task 4.4: ELM Optimization Pass
**Priority**: Medium
**Effort**: High

**Implementation**:
```typescript
export class ElmOptimizer {
  optimize(elm: ELM.Library): ELM.Library {
    return {
      ...elm,
      statements: elm.statements.map(stmt => this.optimizeStatement(stmt)),
    };
  }

  private optimizeStatement(stmt: ELM.ExpressionDef): ELM.ExpressionDef {
    return {
      ...stmt,
      expression: this.optimizeExpression(stmt.expression),
    };
  }

  private optimizeExpression(expr: ELM.Expression): ELM.Expression {
    // Optimization strategies:

    // 1. Constant folding
    expr = this.foldConstants(expr);

    // 2. Dead code elimination
    expr = this.eliminateDeadCode(expr);

    // 3. Predicate pushdown
    expr = this.pushDownPredicates(expr);

    // 4. Common subexpression elimination
    expr = this.eliminateCommonSubexpressions(expr);

    return expr;
  }

  private pushDownPredicates(expr: ELM.Expression): ELM.Expression {
    // Move WHERE filters closer to data source (Retrieve)
    // This reduces intermediate result sets

    if (expr.type === 'Query') {
      const query = expr as ELM.Query;
      // Analyze WHERE clause for conditions that can be pushed to Retrieve
      // Example: WHERE P.gender = 'male' → add to Retrieve as filter
    }

    return expr;
  }

  private eliminateCommonSubexpressions(expr: ELM.Expression): ELM.Expression {
    // Find repeated expressions and extract to LET clauses
    // Example:
    // WHERE P.age >= 18 and P.age <= 65
    // → LET patientAge: P.age WHERE patientAge >= 18 and patientAge <= 65

    return expr;
  }
}
```

**Benefits**:
- Faster SQL execution through optimized queries
- Reduced redundant computations
- Better use of indexes (predicate pushdown)

---

## Track 5: Library & Expression Management

### Goal
Support reusable CQL libraries following HL7 modular design patterns.

### Current State
- ❌ No support for INCLUDE statements
- ❌ No library dependency resolution
- ❌ No qualified expression references

### Implementation Tasks

#### Task 5.1: Library Dependency Resolution
**Priority**: Medium
**Effort**: High

**Implementation**:
```typescript
interface LibraryDependency {
  name: string;
  version?: string;
  alias?: string;
}

class LibraryResolver {
  private libraryCache: Map<string, ELM.Library> = new Map();

  async resolve(
    mainLibrary: string,
    dependencies: LibraryDependency[]
  ): Promise<Map<string, ELM.Library>> {
    const resolved = new Map<string, ELM.Library>();

    // Topological sort for correct loading order
    const sorted = this.topologicalSort(dependencies);

    for (const dep of sorted) {
      const library = await this.loadLibrary(dep);
      resolved.set(dep.alias || dep.name, library);
    }

    return resolved;
  }

  private async loadLibrary(dep: LibraryDependency): Promise<ELM.Library> {
    const cacheKey = `${dep.name}|${dep.version || 'latest'}`;

    if (this.libraryCache.has(cacheKey)) {
      return this.libraryCache.get(cacheKey)!;
    }

    // Load from filesystem, URL, or database
    const cqlContent = await this.fetchLibrary(dep);
    const ast = new CqlParser().parse(cqlContent);
    const elm = new AstToElmConverter().convert(ast);

    this.libraryCache.set(cacheKey, elm);
    return elm;
  }
}
```

---

#### Task 5.2: Qualified Expression References
**Priority**: Medium
**Effort**: Medium

**Implementation**:
```cql
library MainMeasure version '1.0.0'

include CommonLogic version '2.1.0' called Common
include Terminology version '3.0.0' called Terms

define "Adult Patients":
  Common."Adults 18 and Older"

define "Diabetic Patients":
  [Condition: code in Terms."Diabetes Value Set"]
```

**SQL Generation**:
```typescript
private generateQualifiedReference(
  libraryAlias: string,
  expressionName: string
): string {
  const library = this.context.libraries.get(libraryAlias);
  const expression = library.statements.find(s => s.name === expressionName);

  // Generate inline CTE or reference existing one
  const cteName = `${libraryAlias}_${this.sanitizeName(expressionName)}`;

  if (!this.context.cteNames.has(cteName)) {
    // Generate CTE from referenced library expression
    const sql = this.generateExpression(expression.expression);
    this.context.additionalCtes.push({
      name: cteName,
      sql: sql,
    });
  }

  return cteName;
}
```

---

## Track 6: Testing & Validation

### Goal
Comprehensive test suite covering HL7 patterns and edge cases.

### Implementation Tasks

#### Task 6.1: HL7 Pattern Test Suite
**Priority**: High
**Effort**: Medium

**Test Cases**:
```typescript
describe('HL7 CQL Patterns', () => {
  it('should handle status filtering per HL7 guidelines', () => {
    const cql = `
      library Test version '1.0.0'
      using FHIR version '4.0.1'

      define "Final Observations":
        [Observation: "BMI"] O
          where O.effective during "Measurement Period"
    `;

    const sql = transpile(cql);

    expect(sql).toContain("status IN ('final', 'amended', 'corrected')");
  });

  it('should support canonical value set URLs', () => {
    const cql = `
      define "Diabetic Patients":
        [Condition: code in "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001"]
    `;

    const sql = transpile(cql);

    expect(sql).toContain('ValueSetExpansion');
    expect(sql).toContain('http://cts.nlm.nih.gov/fhir/ValueSet/');
  });

  it('should generate multi-resource queries per HL7 patterns', () => {
    const cql = `
      define "Inpatient Encounters with Surgery":
        [Encounter: "Inpatient"] E
          with [Procedure: "Cardiac Surgery"] P
            such that P.performed during E.period
          where E.status = 'finished'
    `;

    const sql = transpile(cql);

    expect(sql).toContain('LEFT JOIN Procedure_view');
    expect(sql).toContain('BETWEEN e.period_start AND e.period_end');
  });
});
```

---

#### Task 6.2: ELM Round-Trip Testing
**Priority**: High
**Effort**: Medium

**Test Cases**:
```typescript
describe('ELM Round-Trip', () => {
  it('should convert CQL → ELM → CQL without loss', () => {
    const originalCql = `
      library Test version '1.0.0'
      define "Adults": [Patient] P where P.age >= 18
    `;

    const elm = cqlToElm(originalCql);
    const regeneratedCql = elmToCql(elm);

    // Semantic equivalence, not textual
    expect(evaluate(originalCql, testData)).toEqual(
      evaluate(regeneratedCql, testData)
    );
  });

  it('should convert ELM → SQL → Results correctly', () => {
    const elm = loadElmFromJson('test-measure.json');
    const sql = elmToSql(elm);

    const elmResults = evaluateElm(elm, fhirData);
    const sqlResults = executeSql(sql, sqlDatabase);

    expect(sqlResults).toEqual(elmResults);
  });
});
```

---

#### Task 6.3: Real-World CQL Library Testing
**Priority**: High
**Effort**: High

**Test Data Sources**:
- [CMS eCQM Libraries](https://ecqi.healthit.gov/)
- [HEDIS Digital Quality Measures](https://www.ncqa.org/hedis/)
- [US Core Common Libraries](https://github.com/cqframework/cqf-us)

**Test Implementation**:
```typescript
describe('Real-World CQL Libraries', () => {
  it('should transpile CMS172v11 (Depression Screening)', async () => {
    const cql = await loadCqlLibrary('CMS172v11');
    const sql = transpile(cql);

    // Validate SQL syntax
    expect(() => parseSql(sql)).not.toThrow();

    // Execute against test database
    const results = await executeSql(sql, testDb);
    expect(results).toHaveProperty('initial_population_count');
    expect(results).toHaveProperty('numerator_count');
  });

  it('should handle US Core Common patterns', async () => {
    const cql = await loadCqlLibrary('USCoreCommon');
    const elm = cqlToElm(cql);

    // Verify all expressions can be converted
    for (const stmt of elm.statements) {
      expect(() => elmToSql(stmt.expression)).not.toThrow();
    }
  });
});
```

---

## Track 7: Performance & Optimization

### Goal
Enterprise-grade performance for large-scale measure calculation.

### Implementation Tasks

#### Task 7.1: Query Plan Analysis
**Priority**: Medium
**Effort**: Medium

**Implementation**:
```typescript
class SqlQueryAnalyzer {
  analyzeQuery(sql: string, dialect: 'sqlite' | 'postgresql'): QueryPlan {
    // Get execution plan
    const plan = dialect === 'sqlite'
      ? this.getSqlitePlan(sql)
      : this.getPostgresPlan(sql);

    // Analyze for anti-patterns
    const issues: PerformanceIssue[] = [];

    if (plan.scanType === 'SCAN') {
      issues.push({
        severity: 'warning',
        message: 'Full table scan detected',
        suggestion: 'Add index on filtered columns',
      });
    }

    if (plan.estimatedRows > 100000 && !plan.usesIndex) {
      issues.push({
        severity: 'error',
        message: 'Large result set without index',
        suggestion: 'Consider filtering earlier or adding composite index',
      });
    }

    return { plan, issues };
  }

  suggestIndexes(sql: string): IndexSuggestion[] {
    // Parse WHERE clauses, JOIN conditions
    // Recommend indexes for frequently filtered columns

    return [
      {
        table: 'Observation_view',
        columns: ['subject_id', 'code', 'effective_datetime'],
        type: 'composite',
        justification: 'Frequent filtering on code + temporal range',
      },
      // ... more suggestions
    ];
  }
}
```

---

#### Task 7.2: CTE Optimization
**Priority**: Medium
**Effort**: Medium

**Implementation**:
```typescript
class CteOptimizer {
  optimizeCtes(ctes: CteDefinition[]): CteDefinition[] {
    // 1. Inline simple CTEs (single SELECT with no complex logic)
    ctes = this.inlineSimpleCtes(ctes);

    // 2. Materialize expensive CTEs (reused multiple times)
    ctes = this.materializeReusedCtes(ctes);

    // 3. Reorder for optimal execution
    ctes = this.reorderForPerformance(ctes);

    return ctes;
  }

  private inlineSimpleCtes(ctes: CteDefinition[]): CteDefinition[] {
    // If a CTE is referenced only once and is simple, inline it
    const usageCounts = this.countCteUsages(ctes);

    return ctes.filter(cte => {
      if (usageCounts[cte.name] === 1 && this.isSimple(cte.sql)) {
        // Replace reference with inline subquery
        this.inlineCte(cte);
        return false; // Remove from CTE list
      }
      return true;
    });
  }

  private materializeReusedCtes(ctes: CteDefinition[]): CteDefinition[] {
    // For PostgreSQL, use MATERIALIZED keyword
    // For SQLite, consider temp tables for heavily reused CTEs

    const usageCounts = this.countCteUsages(ctes);

    return ctes.map(cte => {
      if (usageCounts[cte.name] > 2 && this.isExpensive(cte.sql)) {
        return {
          ...cte,
          materialized: true,
        };
      }
      return cte;
    });
  }
}
```

---

#### Task 7.3: Caching Strategy
**Priority**: Low
**Effort**: Medium

**Implementation**:
```typescript
class TranspilationCache {
  private cache: Map<string, CachedResult> = new Map();

  getCachedSql(cqlHash: string): string | null {
    const cached = this.cache.get(cqlHash);

    if (!cached) return null;

    // Check if dependencies changed
    if (this.dependenciesChanged(cached)) {
      this.cache.delete(cqlHash);
      return null;
    }

    return cached.sql;
  }

  cacheSql(cqlContent: string, sql: string, dependencies: string[]): void {
    const hash = this.hashCql(cqlContent);

    this.cache.set(hash, {
      sql,
      dependencies,
      timestamp: Date.now(),
    });
  }

  private dependenciesChanged(cached: CachedResult): boolean {
    // Check if included libraries or value sets changed
    for (const dep of cached.dependencies) {
      if (this.getLibraryVersion(dep) !== cached.depVersions[dep]) {
        return true;
      }
    }
    return false;
  }
}
```

---

## Track 8: Documentation & Examples

### Goal
Comprehensive documentation demonstrating HL7 patterns and best practices.

### Implementation Tasks

#### Task 8.1: Interactive Example Gallery
**Priority**: Medium
**Effort**: Medium

**Examples to Include**:
1. **Basic Quality Measure** - Population calculation with exclusions
2. **Multi-Resource Query** - Encounters with qualifying procedures
3. **Terminology-Based Filtering** - Value set membership testing
4. **Temporal Calculations** - Duration, overlaps, intervals
5. **Aggregation Queries** - Average lab values, counts
6. **Stratified Reporting** - Results grouped by demographics
7. **Library Composition** - Reusable common logic
8. **Complex Clinical Logic** - Risk stratification

**Implementation**:
```typescript
// Add to client/src/pages/examples.tsx
export const exampleLibrary = [
  {
    id: 'cms130',
    title: 'CMS130 - Colorectal Cancer Screening',
    description: 'Percentage of adults 50-75 who had appropriate screening',
    category: 'Quality Measure',
    difficulty: 'Intermediate',
    cql: `
library CMS130 version '11.0.0'
using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include Common version '1.0.0' called Common

valueset "Colonoscopy": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.108.12.1020'
valueset "Fecal Occult Blood Test (FOBT)": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.198.12.1011'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Initial Population":
  Common."Adults 50 to 75"

define "Denominator":
  "Initial Population"

define "Colonoscopy Performed":
  [Procedure: "Colonoscopy"] P
    where P.status = 'completed'
      and P.performed during day of Interval[start of "Measurement Period" - 10 years, end of "Measurement Period"]

define "FOBT Performed":
  [Observation: "Fecal Occult Blood Test (FOBT)"] O
    where O.status in {'final', 'amended', 'corrected'}
      and O.effective during day of "Measurement Period"

define "Numerator":
  "Denominator" D
    where exists "Colonoscopy Performed"
      or exists "FOBT Performed"
    `,
    expectedSql: `-- Generated SQL will include:
-- 1. Patient age filtering (50-75)
-- 2. Value set expansion joins
-- 3. Temporal calculations with JULIANDAY
-- 4. Multi-procedure check with EXISTS`,
  },
  // ... more examples
];
```

---

#### Task 8.2: Best Practices Guide
**Priority**: High
**Effort**: Low

**Content**:
- ✅ When to use canonical URLs vs. display names
- ✅ Status filtering requirements
- ✅ Temporal operator selection guide
- ✅ Performance optimization tips
- ✅ Common anti-patterns to avoid
- ✅ Library composition strategies
- ✅ Testing methodologies

**Location**: `docs/CQL_BEST_PRACTICES.md`

---

## Implementation Roadmap

### Sprint 1 (Week 1-2): Terminology Foundation
- Task 1.1: Canonical URL Support
- Task 1.2: Terminology Membership Operations
- Task 2.1: Status Filtering Enforcement
- Testing: Basic value set integration tests

### Sprint 2 (Week 3-4): ELM Architecture
- Task 4.1: ELM Type Definitions
- Task 4.2: AST to ELM Converter
- Task 4.3: ELM to SQL Generator
- Testing: ELM round-trip validation

### Sprint 3 (Week 5-6): Query Patterns & Optimization
- Task 2.2: Enhanced Temporal Constraints
- Task 2.3: Multi-Resource Query Patterns
- Task 7.1: Query Plan Analysis
- Task 7.2: CTE Optimization
- Testing: HL7 pattern compliance tests

### Sprint 4 (Week 7-8): Library Management
- Task 5.1: Library Dependency Resolution
- Task 5.2: Qualified Expression References
- Task 4.4: ELM Optimization Pass
- Testing: Multi-library integration tests

### Sprint 5 (Week 9-10): Polish & Documentation
- Task 3.1: Naming Validation
- Task 3.2: Case Normalization
- Task 8.1: Interactive Example Gallery
- Task 8.2: Best Practices Guide
- Task 6.3: Real-World CQL Library Testing

---

## Success Criteria

### Functional Requirements
- ✅ Support canonical URLs for value sets and code systems
- ✅ Generate SQL queries compatible with HL7 CQL patterns
- ✅ Handle library dependencies and qualified references
- ✅ Enforce naming conventions with validation warnings
- ✅ Pass all real-world CQL library tests (CMS eCQMs, HEDIS)

### Performance Requirements
- ✅ Transpilation time < 100ms for typical measure
- ✅ Generated SQL executes in < 1s for 10K patient database
- ✅ Cache hit rate > 80% for repeated measure evaluations
- ✅ Memory usage < 50MB for complex multi-library measures

### Quality Requirements
- ✅ 100% of HL7 pattern tests passing
- ✅ ELM round-trip fidelity > 99%
- ✅ Zero TypeScript compilation errors
- ✅ Code coverage > 85%
- ✅ No critical security vulnerabilities

---

## Risk Assessment

### High Risk
1. **ELM Specification Complexity**: Full ELM support is extensive
   - *Mitigation*: Implement incrementally, focus on common expressions first

2. **Value Set Expansion Performance**: Large value sets may slow queries
   - *Mitigation*: Pre-compute expansions, use indexed tables, cache results

3. **Multi-Library Dependency Resolution**: Circular dependencies, version conflicts
   - *Mitigation*: Topological sort, semantic versioning validation

### Medium Risk
1. **SQL Dialect Differences**: SQLite vs. PostgreSQL vs. SQL Server
   - *Mitigation*: Abstract SQL generation with dialect-specific overrides

2. **Real-World CQL Complexity**: eCQMs may use advanced features
   - *Mitigation*: Start with simpler measures, expand coverage iteratively

### Low Risk
1. **Naming Convention Enforcement**: May break existing user queries
   - *Mitigation*: Make validation opt-in with warnings, auto-correction suggestions

---

## Deliverables

### Code
- `client/src/lib/elm/` - ELM type definitions and converters
- `client/src/lib/terminology/` - Value set and code system handling
- `client/src/lib/optimizer/` - Query optimization engine
- `client/src/lib/libraries/` - Library resolver and dependency manager
- `tests/hl7-patterns/` - Comprehensive test suite

### Documentation
- `docs/PHASE6_COMPLETION.md` - Implementation summary
- `docs/CQL_BEST_PRACTICES.md` - Developer guide
- `docs/ELM_ARCHITECTURE.md` - Technical architecture document
- `docs/TERMINOLOGY_INTEGRATION.md` - Value set setup guide

### Examples
- `examples/cms-ecqm/` - CMS electronic clinical quality measures
- `examples/hedis/` - HEDIS digital quality measures
- `examples/cds-hooks/` - Clinical decision support examples
- `examples/library-composition/` - Multi-library patterns

---

## Conclusion

Phase 6 represents a significant evolution from a proof-of-concept transpiler to a production-ready, standards-compliant CQL-to-SQL engine. By introducing ELM as an intermediate representation and aligning with HL7 best practices, the FHIR Query Converter will:

1. **Meet Standards**: Full compliance with HL7 CQL implementation guide
2. **Enable Reusability**: Library composition and qualified references
3. **Improve Performance**: Query optimization and caching strategies
4. **Support Real-World Use Cases**: CMS eCQMs, HEDIS measures, CDS Hooks
5. **Facilitate Maintenance**: ELM abstraction enables multi-target generation

This phase transforms the application from an educational tool into an enterprise-grade solution suitable for healthcare analytics, quality reporting, and clinical decision support systems.

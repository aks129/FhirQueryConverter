/**
 * AST to SQL Transpiler
 * Converts CQL AST nodes to SQL on FHIR queries
 */

import {
  LibraryNode,
  DefineNode,
  QueryNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  MemberAccessNode,
  FunctionCallNode,
  ResourceReferenceNode,
  IdentifierNode,
  LiteralNode,
  CqlExpressionNode,
  RelationshipClauseNode,
  IntervalNode,
} from './ast-types';
import { CqlNamingValidator } from './naming-validator';

export interface SqlGenerationContext {
  defines: Map<string, DefineNode>;
  cteNames: Set<string>;
  aliases: Map<string, string>;
  measurementPeriod?: { start: string; end: string };
  referencedIdentifiers: Set<string>;
  missingReferences: Set<string>;
  includedLibraries: string[];
}

export class AstToSqlTranspiler {
  private context: SqlGenerationContext;
  private logs: string[] = [];
  private namingValidator: CqlNamingValidator;

  constructor() {
    this.context = {
      defines: new Map(),
      cteNames: new Set(),
      aliases: new Map(),
      measurementPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
      referencedIdentifiers: new Set(),
      missingReferences: new Set(),
      includedLibraries: [],
    };
    this.namingValidator = new CqlNamingValidator();
  }

  transpile(library: LibraryNode): string {
    // Reset context for fresh transpilation
    this.context.referencedIdentifiers.clear();
    this.context.missingReferences.clear();
    this.context.includedLibraries = [];

    // Validate naming conventions per HL7 CQL Implementation Guide
    this.namingValidator.clear();

    // Validate library name
    if (library.identifier) {
      this.namingValidator.validateLibrary(library.identifier);
    }

    // Validate all definition names
    library.defines.forEach(define => {
      this.namingValidator.validateDefinition(define.name);
    });

    // Log naming violations as warnings
    if (this.namingValidator.hasViolations()) {
      this.log('⚠️  Naming Convention Warnings:');
      this.namingValidator.getViolations().forEach(violation => {
        this.log(`  - ${violation.type} "${violation.identifier}": ${violation.violation}`);
        this.log(`    Suggestion: ${violation.suggestion}`);
      });
    }

    // Track included libraries (external dependencies)
    if (library.includes && library.includes.length > 0) {
      library.includes.forEach(inc => {
        this.context.includedLibraries.push(inc.library);
        this.log(`Found included library: ${inc.library} (alias: ${inc.alias})`);
      });
    }

    // Build defines map
    library.defines.forEach(define => {
      this.context.defines.set(define.name, define);
    });

    const ctes: string[] = [];

    // Add base FHIR views
    ctes.push(this.generateBaseFhirViews());

    // Generate CTEs for each define
    library.defines.forEach(define => {
      this.log(`Converting define "${define.name}" to SQL CTE`);
      const cte = this.generateDefineCte(define);
      ctes.push(cte);
    });

    // After generating all CTEs, check for missing references
    this.detectMissingReferences();

    // Generate final query
    const finalQuery = this.generateFinalQuery();

    // Build the SQL output with disclaimer if needed
    let sqlOutput = this.generateSqlHeader(library);
    sqlOutput += `WITH ${ctes.join(',\n')}\n${finalQuery}`;

    return sqlOutput;
  }

  /**
   * Generate SQL header with library info and any disclaimers
   */
  private generateSqlHeader(library: LibraryNode): string {
    const lines: string[] = [];

    lines.push(`-- Generated SQL on FHIR Query from CQL`);
    lines.push(`-- Library: ${library.identifier}${library.version ? ` v${library.version}` : ''}`);
    lines.push(`-- Using Common Table Expressions (CTEs) for modularity`);

    // Add disclaimer for missing references
    if (this.context.missingReferences.size > 0) {
      lines.push('--');
      lines.push('-- ⚠️  DISCLAIMER: Missing Library References');
      lines.push('-- This CQL contains references to definitions from external libraries that are not present.');
      lines.push('-- The following references could not be resolved and have been replaced with placeholder CTEs:');

      const missingList = Array.from(this.context.missingReferences);
      missingList.forEach(ref => {
        lines.push(`--   - ${ref}`);
      });

      if (this.context.includedLibraries.length > 0) {
        lines.push('--');
        lines.push('-- External libraries referenced (not loaded):');
        this.context.includedLibraries.forEach(lib => {
          lines.push(`--   - ${lib}`);
        });
      }

      lines.push('--');
      lines.push('-- NOTE: To fully evaluate this CQL, import the required library definitions.');
      lines.push('-- Future versions will support loading multiple CQL libraries as base definitions.');
      lines.push('--');
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Detect identifiers that were referenced but not defined
   */
  private detectMissingReferences(): void {
    // Known built-in identifiers and base views that are always available
    const builtInIdentifiers = new Set([
      'Patient', 'Observation', 'Condition', 'Procedure',
      'MedicationRequest', 'Encounter', 'DiagnosticReport',
      'Patient_view', 'Observation_view', 'Condition_view', 'Procedure_view',
      'MedicationRequest_view', 'Encounter_view', 'DiagnosticReport_view',
      'Measurement Period', 'MeasurementPeriod',
    ]);

    const referencedArray = Array.from(this.context.referencedIdentifiers);
    for (let i = 0; i < referencedArray.length; i++) {
      const ref = referencedArray[i];
      const normalizedRef = ref.replace(/\s+/g, '');

      // Skip if it's a built-in
      if (builtInIdentifiers.has(ref) || builtInIdentifiers.has(normalizedRef)) {
        continue;
      }

      // Skip if it's defined in this library
      if (this.context.defines.has(ref) || this.context.cteNames.has(normalizedRef)) {
        continue;
      }

      // This is a missing reference
      this.context.missingReferences.add(ref);
      this.log(`⚠️  Missing reference: "${ref}" - not defined in this library`);
    }
  }

  /**
   * Track an identifier reference for later validation
   */
  private trackIdentifierReference(name: string): void {
    this.context.referencedIdentifiers.add(name);
  }

  /**
   * Check if an identifier is a missing reference
   */
  private isMissingReference(name: string): boolean {
    const normalizedName = name.replace(/\s+/g, '');
    return this.context.missingReferences.has(name) ||
           this.context.missingReferences.has(normalizedName);
  }

  private generateBaseFhirViews(): string {
    return `Patient_view AS (
  SELECT
    id,
    gender,
    birthDate,
    age
  FROM Patient
),
Observation_view AS (
  SELECT
    id,
    subject_id,
    code,
    code_system,
    code_text,
    effective_datetime,
    value_quantity,
    value_unit,
    status
  FROM Observation
),
Condition_view AS (
  SELECT
    id,
    subject_id,
    code,
    code_system,
    code_text,
    onset_datetime,
    clinical_status,
    verification_status
  FROM Condition
),
Procedure_view AS (
  SELECT
    id,
    subject_id,
    code,
    code_system,
    code_text,
    performed_datetime,
    status
  FROM Procedure
),
MedicationRequest_view AS (
  SELECT
    id,
    subject_id,
    medication_code,
    medication_system,
    medication_text,
    authored_on,
    status,
    intent
  FROM MedicationRequest
),
Encounter_view AS (
  SELECT
    id,
    subject_id,
    class_code,
    type_text,
    period_start,
    period_end,
    status
  FROM Encounter
),
DiagnosticReport_view AS (
  SELECT
    id,
    subject_id,
    code,
    code_system,
    code_text,
    effective_datetime,
    issued,
    status
  FROM DiagnosticReport
)`;
  }

  private generateDefineCte(define: DefineNode): string {
    const cteName = define.name.replace(/\s+/g, '');
    this.context.cteNames.add(cteName);

    this.log(`Generating CTE for "${define.name}", expression type: ${define.expression.type}`);

    // Special handling for Identifier expressions at the top level
    if (define.expression.type === 'Identifier') {
      const identExpr = define.expression as IdentifierNode;
      const refName = identExpr.name.replace(/\s+/g, '');

      // Track the reference
      this.trackIdentifierReference(identExpr.name);

      // Check if this is a reference to an undefined/external define
      if (!this.context.defines.has(identExpr.name) && !this.context.cteNames.has(refName)) {
        this.log(`  -> Missing reference: "${identExpr.name}" (external library define)`);
        // Generate a placeholder CTE that returns no results
        return `${cteName} AS (\n  -- Placeholder: References external define "${identExpr.name}" which is not present\n  SELECT NULL AS patient_id WHERE 1=0\n)`;
      }

      this.log(`  -> Identifier reference to "${refName}"`);
      return `${cteName} AS (\n  SELECT patient_id FROM ${refName}\n)`;
    }

    // Special handling for UnaryExpression (exists) at top level
    if (define.expression.type === 'UnaryExpression') {
      const unaryExpr = define.expression as UnaryExpressionNode;
      if (unaryExpr.operator === 'exists') {
        const innerSql = this.generateUnaryExpression(unaryExpr);
        // For exists expressions, we need to select patients where the condition is true
        return `${cteName} AS (\n  SELECT p.id AS patient_id FROM Patient_view p WHERE ${innerSql}\n)`;
      }
    }

    // Special handling for BinaryExpression at top level (boolean conditions)
    if (define.expression.type === 'BinaryExpression') {
      const binaryExpr = define.expression as BinaryExpressionNode;
      // Check if this is a boolean/logical expression (and, or, comparison)
      if (['and', 'or', '=', '!=', '<', '>', '<=', '>=', '~'].includes(binaryExpr.operator)) {
        const condition = this.generateBinaryExpression(binaryExpr);
        // Wrap in a SELECT from Patient_view with WHERE clause
        return `${cteName} AS (\n  SELECT p.id AS patient_id FROM Patient_view p WHERE ${condition}\n)`;
      }
    }

    const sqlExpression = this.generateExpression(define.expression, '  ');

    // Check if the result is already a SELECT statement
    if (sqlExpression.trim().toUpperCase().startsWith('SELECT')) {
      return `${cteName} AS (\n${sqlExpression}\n)`;
    }

    // Otherwise wrap in a SELECT
    return `${cteName} AS (\n  SELECT p.id AS patient_id FROM Patient_view p WHERE ${sqlExpression}\n)`;
  }

  private generateExpression(expr: CqlExpressionNode, indent: string = '  '): string {
    switch (expr.type) {
      case 'Query':
        return this.generateQuery(expr, indent);

      case 'Identifier':
        return this.generateIdentifier(expr);

      case 'BinaryExpression':
        return this.generateBinaryExpression(expr);

      case 'MemberAccess':
        return this.generateMemberAccess(expr);

      case 'Literal':
        return this.generateLiteral(expr);

      case 'FunctionCall':
        return this.generateFunctionCall(expr);

      case 'UnaryExpression':
        return this.generateUnaryExpression(expr);

      case 'ResourceReference':
        // If it's just a resource reference without query, treat as simple select
        return this.generateSimpleResourceQuery(expr, indent);

      default:
        this.log(`Warning: Unsupported expression type: ${(expr as any).type}`);
        return `'unsupported' AS placeholder`;
    }
  }

  private generateQuery(query: QueryNode, indent: string): string {
    const lines: string[] = [];

    // Determine source table
    let sourceTable = '';
    let alias = 'p';
    let isIdentifierSource = false;

    if (query.source.type === 'ResourceReference') {
      sourceTable = `${query.source.resourceType}_view`;
      alias = query.source.resourceType[0].toLowerCase();
    } else if (query.source.type === 'Identifier') {
      // Reference to another define
      const defineName = (query.source as IdentifierNode).name.replace(/\s+/g, '');
      if (this.context.cteNames.has(defineName)) {
        // Only return early if there are no WHERE or relationships
        if (!query.where && (!query.relationships || query.relationships.length === 0)) {
          return `${indent}SELECT patient_id FROM ${defineName}`;
        }
        sourceTable = defineName;
        alias = defineName[0].toLowerCase();
        isIdentifierSource = true;
      } else {
        sourceTable = `${query.source.name}_view`;
      }
    }

    // Determine what to SELECT
    let selectClause: string;

    if (query.return) {
      // Use RETURN clause if specified
      const returnExpression = this.generateExpression(query.return);
      selectClause = `${indent}SELECT ${returnExpression}`;
    } else {
      // Default selection: patient_id and additional fields if Patient
      const hasAdditionalFields = query.source.type === 'ResourceReference' &&
          query.source.resourceType === 'Patient';

      // For identifier sources, select from patient_id column, not id
      const selectColumn = isIdentifierSource ? 'patient_id' : `${alias}.id AS patient_id`;
      selectClause = `${indent}SELECT ${selectColumn}${hasAdditionalFields ? ',' : ''}`;

      if (hasAdditionalFields) {
        selectClause += `\n${indent}       ${alias}.gender,`;
        selectClause += `\n${indent}       ${alias}.age,`;
        selectClause += `\n${indent}       ${alias}.birthDate`;
      }
    }

    lines.push(selectClause);
    lines.push(`${indent}FROM ${sourceTable} ${alias}`);

    // Generate relationship clauses (WITH/WITHOUT)
    // Collect WHERE conditions from relationships to add to main WHERE clause
    const relationshipWhereConditions: string[] = [];
    if (query.relationships && query.relationships.length > 0) {
      query.relationships.forEach(rel => {
        const relSql = this.generateRelationship(rel, alias, indent, isIdentifierSource);
        lines.push(relSql.join);

        // If relationship has a condition, add it to WHERE clause
        if (relSql.whereCondition) {
          relationshipWhereConditions.push(relSql.whereCondition);
        }
      });
    }

    // Generate WHERE clause (after JOINs)
    const whereConditions: string[] = [];

    // Add default status filters per HL7 CQL Implementation Guide
    // Only retrieve clinically relevant resources with appropriate status
    if (query.source.type === 'ResourceReference') {
      const statusFilter = this.getDefaultStatusFilter(query.source.resourceType, alias);
      if (statusFilter) {
        whereConditions.push(statusFilter);
      }
    }

    // Add code filter from resource reference (e.g., [Observation: "Heart Rate"])
    if (query.source.type === 'ResourceReference' && query.source.codeFilter) {
      const codeFilterCondition = this.generateCodeFilter(query.source.codeFilter, alias);
      if (codeFilterCondition) {
        whereConditions.push(codeFilterCondition);
      }
    }

    // Add relationship conditions
    if (relationshipWhereConditions.length > 0) {
      whereConditions.push(...relationshipWhereConditions);
    }

    // Add main WHERE condition
    if (query.where) {
      const whereCondition = this.generateWhereCondition(query.where, alias);
      whereConditions.push(whereCondition);
    }

    if (whereConditions.length > 0) {
      lines.push(`${indent}WHERE ${whereConditions.join(' AND ')}`);
    }

    return lines.join('\n');
  }

  private generateSimpleResourceQuery(ref: ResourceReferenceNode, indent: string): string {
    const table = `${ref.resourceType}_view`;
    const alias = ref.resourceType[0].toLowerCase();

    let query = `${indent}SELECT ${alias}.id FROM ${table} ${alias}`;

    // Add code filter if present
    if (ref.codeFilter) {
      const codeFilterCondition = this.generateCodeFilter(ref.codeFilter, alias);
      if (codeFilterCondition) {
        query += `\n${indent}WHERE ${codeFilterCondition}`;
      }
    }

    return query;
  }

  private generateRelationship(
    rel: RelationshipClauseNode,
    parentAlias: string,
    indent: string,
    parentIsIdentifierSource: boolean
  ): { join: string; whereCondition?: string } {
    const joinType = rel.relationship === 'with' ? 'LEFT JOIN' : 'LEFT JOIN';
    const resourceType = rel.source.resourceType;
    const table = `${resourceType}_view`;
    const alias = rel.alias || resourceType[0].toLowerCase();

    // For identifier sources (CTEs), the parent has patient_id, not id
    const parentColumn = parentIsIdentifierSource ? 'patient_id' : 'id';
    const join = `${indent}${joinType} ${table} ${alias} ON ${alias}.subject_id = ${parentAlias}.${parentColumn}`;

    // Collect WHERE conditions
    const conditions: string[] = [];

    // Add code filter if present (e.g., [Observation: "Heart Rate"])
    if (rel.source.codeFilter) {
      const codeFilterCondition = this.generateCodeFilter(rel.source.codeFilter, alias);
      if (codeFilterCondition) {
        conditions.push(codeFilterCondition);
      }
    }

    // Add relationship condition (such that ...)
    if (rel.condition) {
      conditions.push(this.generateExpression(rel.condition));
    }

    // Combine all conditions
    const whereCondition = conditions.length > 0 ? conditions.join(' AND ') : undefined;

    return { join, whereCondition };
  }

  private generateCodeFilter(codeFilter: CqlExpressionNode, alias: string): string | null {
    // Handle different types of code filters

    // Case 1: Simple identifier or string literal (e.g., "Heart Rate")
    if (codeFilter.type === 'Identifier' || codeFilter.type === 'Literal') {
      const codeValue = codeFilter.type === 'Identifier'
        ? (codeFilter as IdentifierNode).name
        : String((codeFilter as LiteralNode).value);

      // Check if it's a canonical URL (value set reference)
      if (this.isCanonicalUrl(codeValue)) {
        this.log(`Using canonical value set URL: ${codeValue}`);
        return this.generateValueSetMembership(alias, codeValue);
      }

      // Legacy: Use LIKE for partial matching (for backward compatibility)
      return `${alias}.code_text LIKE '%${codeValue}%'`;
    }

    // Case 2: Binary expression (e.g., code in "Value Set Name")
    if (codeFilter.type === 'BinaryExpression') {
      const expr = codeFilter as BinaryExpressionNode;

      // Handle "in" operator for value set membership
      if (expr.operator === 'in') {
        const valueSetIdentifier = this.extractValueSetIdentifier(expr.right);
        this.log(`Code filter uses value set membership: ${valueSetIdentifier}`);

        // Check if it's a canonical URL
        if (this.isCanonicalUrl(valueSetIdentifier)) {
          return this.generateValueSetMembership(alias, valueSetIdentifier);
        }

        // Legacy: treat as simple code match for backward compatibility
        return `${alias}.code_text LIKE '%${valueSetIdentifier}%'`;
      }

      // Other binary operations
      const left = `${alias}.code_text`;
      const right = this.generateExpression(expr.right);
      const operator = this.mapOperatorToSql(expr.operator);
      return `${left} ${operator} ${right}`;
    }

    // Fallback: try to generate as expression
    return this.generateExpression(codeFilter);
  }

  private isCanonicalUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('urn:');
  }

  private extractValueSetIdentifier(expr: CqlExpressionNode): string {
    if (expr.type === 'Identifier') {
      return (expr as IdentifierNode).name;
    }
    if (expr.type === 'Literal') {
      return String((expr as LiteralNode).value);
    }
    return this.generateExpression(expr);
  }

  private generateValueSetMembership(alias: string, valueSetUrl: string): string {
    // Generate SQL for value set membership testing
    // Uses a ValueSetExpansion table that contains pre-expanded value set codes

    return `EXISTS (
      SELECT 1 FROM ValueSetExpansion vse
      WHERE vse.value_set_url = '${valueSetUrl}'
        AND vse.code = ${alias}.code
        AND vse.system = ${alias}.code_system
    )`;
  }

  /**
   * Get default status filter per HL7 CQL Implementation Guide
   * Ensures queries only retrieve clinically relevant resources
   *
   * References:
   * - http://hl7.org/fhir/us/cql/STU2/patterns.html#filtering-by-status
   * - https://hl7.org/fhir/uv/cql/STU2/using-cql.html#filtering-observations
   */
  private getDefaultStatusFilter(resourceType: string, alias: string): string | null {
    switch (resourceType) {
      case 'Observation':
        // Only final, amended, or corrected observations
        // Exclude: preliminary, cancelled, entered-in-error, unknown
        return `${alias}.status IN ('final', 'amended', 'corrected')`;

      case 'Condition':
        // Only active conditions
        // clinical_status is a CodeableConcept with coding system http://terminology.hl7.org/CodeSystem/condition-clinical
        // Common values: active, recurrence, relapse, inactive, remission, resolved
        return `${alias}.clinical_status = 'active'`;

      case 'Procedure':
        // Only completed procedures
        // Exclude: preparation, in-progress, not-done, on-hold, stopped, entered-in-error, unknown
        return `${alias}.status = 'completed'`;

      case 'MedicationRequest':
        // Only active or completed medication requests
        // Exclude: cancelled, draft, entered-in-error, stopped, unknown
        return `${alias}.status IN ('active', 'completed')`;

      case 'Encounter':
        // Only finished encounters
        // Exclude: planned, arrived, triaged, in-progress, onleave, cancelled, entered-in-error, unknown
        return `${alias}.status = 'finished'`;

      case 'DiagnosticReport':
        // Only final, amended, or corrected reports
        // Exclude: registered, partial, preliminary, cancelled, entered-in-error, unknown
        return `${alias}.status IN ('final', 'amended', 'corrected')`;

      case 'AllergyIntolerance':
        // Only active allergies
        return `${alias}.clinical_status = 'active'`;

      case 'Immunization':
        // Only completed immunizations
        return `${alias}.status = 'completed'`;

      default:
        // No default status filter for Patient and other resources
        return null;
    }
  }

  private generateWhereCondition(expr: CqlExpressionNode, alias: string): string {
    if (expr.type === 'BinaryExpression') {
      const left = this.generateWhereExpression(expr.left, alias);
      const right = this.generateWhereExpression(expr.right, alias);
      const operator = this.mapOperatorToSql(expr.operator);

      return `${left} ${operator} ${right}`;
    }

    return this.generateWhereExpression(expr, alias);
  }

  private generateWhereExpression(expr: CqlExpressionNode, alias: string): string {
    if (expr.type === 'MemberAccess') {
      const obj = (expr.object.type === 'Identifier') ? alias : this.generateExpression(expr.object);
      return `${obj}.${expr.member}`;
    }

    return this.generateExpression(expr);
  }

  private generateBinaryExpression(expr: BinaryExpressionNode): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);
    const operator = this.mapOperatorToSql(expr.operator);

    // Special handling for temporal operators per HL7 CQL Implementation Guide
    // Reference: http://hl7.org/fhir/us/cql/STU2/patterns.html#temporal-queries
    switch (expr.operator) {
      case 'during':
        // date during interval
        if (right.includes('Measurement Period') || right.includes('Interval')) {
          return `${left} BETWEEN '${this.context.measurementPeriod?.start}' AND '${this.context.measurementPeriod?.end}'`;
        }
        return `${left} ${operator} ${right}`;

      case 'in':
        // Similar to 'during' for intervals
        if (right.includes('Measurement Period') || right.includes('Interval')) {
          return `${left} BETWEEN '${this.context.measurementPeriod?.start}' AND '${this.context.measurementPeriod?.end}'`;
        }
        return `${left} ${operator} ${right}`;

      case 'before':
        // date before date/interval
        return `${left} < ${right}`;

      case 'after':
        // date after date/interval
        return `${left} > ${right}`;

      case 'on or before':
        return `${left} <= ${right}`;

      case 'on or after':
        return `${left} >= ${right}`;

      case 'starts':
        // interval starts interval - first point of left equals first point of right
        return `${left} = ${right}`;

      case 'ends':
        // interval ends interval - last point of left equals last point of right
        return `${left} = ${right}`;

      case 'overlaps':
        // intervals overlap - some point in both intervals
        // For SQL: (start1 <= end2) AND (end1 >= start2)
        // This is complex and may need interval unpacking
        return `${left} ${operator} ${right}`;

      // Set operations
      case 'union':
        return `${left} UNION ${right}`;

      case 'except':
        return `${left} EXCEPT ${right}`;

      case 'intersect':
        return `${left} INTERSECT ${right}`;

      // Duration temporal operators
      case 'days or less before':
        return `${left} >= DATE(${right}, '-30 days') AND ${left} <= ${right}`;

      case 'days or less after':
        return `${left} >= ${right} AND ${left} <= DATE(${right}, '+30 days')`;

      case 'months or less before':
        return `${left} >= DATE(${right}, '-12 months') AND ${left} <= ${right}`;

      case 'months or less after':
        return `${left} >= ${right} AND ${left} <= DATE(${right}, '+12 months')`;

      case 'years or less before':
        return `${left} >= DATE(${right}, '-5 years') AND ${left} <= ${right}`;

      case 'years or less after':
        return `${left} >= ${right} AND ${left} <= DATE(${right}, '+5 years')`;

      default:
        return `${left} ${operator} ${right}`;
    }
  }

  private generateUnaryExpression(expr: UnaryExpressionNode): string {
    // Special handling for EXISTS with identifier operand (reference to another define)
    if (expr.operator === 'exists' && expr.operand.type === 'Identifier') {
      const identExpr = expr.operand as IdentifierNode;
      const defineName = identExpr.name.replace(/\s+/g, '');

      // Track this reference
      this.trackIdentifierReference(identExpr.name);

      // Check if it's a known reference
      if (this.context.cteNames.has(defineName) || this.context.defines.has(identExpr.name)) {
        return `EXISTS (SELECT 1 FROM ${defineName})`;
      }

      // It's a missing reference - return FALSE (no results from missing define)
      this.log(`  -> EXISTS on missing reference: "${identExpr.name}"`);
      return `FALSE /* Missing reference: ${identExpr.name} */`;
    }

    const operand = this.generateExpression(expr.operand);

    switch (expr.operator) {
      case 'not':
        return `NOT ${operand}`;
      case 'exists':
        // Wrap in parentheses if it's a subquery reference
        if (operand.includes('SELECT')) {
          return `EXISTS (${operand})`;
        }
        return `EXISTS (SELECT 1 FROM ${operand})`;
      case 'is null':
        return `${operand} IS NULL`;
      case 'is not null':
        return `${operand} IS NOT NULL`;
      default:
        return operand;
    }
  }

  private generateMemberAccess(expr: MemberAccessNode): string {
    const object = expr.object.type === 'Identifier'
      ? (expr.object as IdentifierNode).name[0].toLowerCase()
      : this.generateExpression(expr.object);

    // Map CQL property names to SQL column names
    const columnMapping: { [key: string]: string } = {
      'effective': 'effective_datetime',
      'value': 'value_quantity',
      'code': 'code_text',
      'onset': 'onset_datetime',
      'performed': 'performed_datetime',
      'medication': 'medication_text',
      'class': 'class_code',
      'type': 'type_text',
    };

    const columnName = columnMapping[expr.member] || expr.member;
    return `${object}.${columnName}`;
  }

  private generateFunctionCall(expr: FunctionCallNode): string {
    const name = expr.name;
    const args = expr.arguments.map(arg => this.generateExpression(arg));

    // Map CQL functions to SQL
    switch (name.toLowerCase()) {
      case 'ageinyearsat':
        // Calculate age in years at a specific date
        // AgeInYearsAt(birthDate, asOfDate)
        if (args.length >= 1) {
          const asOfDate = args.length >= 2
            ? args[1]
            : `'${new Date().toISOString().split('T')[0]}'`; // Use current date if not specified

          // SQL to calculate age: (asOfDate - birthDate) / 365.25
          // Using JULIANDAY for SQLite
          return `CAST((JULIANDAY(${asOfDate}) - JULIANDAY(birthDate)) / 365.25 AS INTEGER)`;
        }
        // Fallback to age column if no arguments
        return 'age';

      case 'ageinmonthsat':
        // Calculate age in months at a specific date
        if (args.length >= 1) {
          const asOfDate = args.length >= 2
            ? args[1]
            : `'${new Date().toISOString().split('T')[0]}'`;
          return `CAST((JULIANDAY(${asOfDate}) - JULIANDAY(birthDate)) / 30.44 AS INTEGER)`;
        }
        return `CAST(age * 12 AS INTEGER)`;

      case 'ageindaysat':
        // Calculate age in days at a specific date
        if (args.length >= 1) {
          const asOfDate = args.length >= 2
            ? args[1]
            : `'${new Date().toISOString().split('T')[0]}'`;
          return `CAST(JULIANDAY(${asOfDate}) - JULIANDAY(birthDate) AS INTEGER)`;
        }
        return `CAST(age * 365.25 AS INTEGER)`;

      // Aggregation functions
      case 'count':
        return `COUNT(${args[0] || '*'})`;

      case 'sum':
        return `SUM(${args[0]})`;

      case 'avg':
      case 'average':
        return `AVG(${args[0]})`;

      case 'max':
      case 'maximum':
        return `MAX(${args[0]})`;

      case 'min':
      case 'minimum':
        return `MIN(${args[0]})`;

      case 'median':
        // SQLite doesn't have built-in MEDIAN, use approximation with percentile
        return `(SELECT AVG(${args[0]}) FROM (SELECT ${args[0]} FROM ${args[0]} ORDER BY ${args[0]} LIMIT 2 - (SELECT COUNT(*) FROM ${args[0]}) % 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM ${args[0]})))`;

      case 'stdev':
      case 'stddev':
      case 'standarddeviation':
        // Standard deviation
        return `(SELECT SQRT(AVG((${args[0]} - sub.mean) * (${args[0]} - sub.mean))) FROM (SELECT AVG(${args[0]}) as mean FROM ${args[0]}) sub)`;

      // String functions
      case 'length':
        return `LENGTH(${args[0]})`;

      case 'upper':
        return `UPPER(${args[0]})`;

      case 'lower':
        return `LOWER(${args[0]})`;

      case 'substring':
        // Substring(string, startIndex, length)
        if (args.length >= 2) {
          return args.length >= 3
            ? `SUBSTR(${args[0]}, ${args[1]}, ${args[2]})`
            : `SUBSTR(${args[0]}, ${args[1]})`;
        }
        return args[0];

      case 'indexof':
        // Position of substring in string (1-indexed in SQL)
        return `INSTR(${args[0]}, ${args[1]})`;

      // Date/time functions
      case 'now':
        return `DATETIME('now')`;

      case 'today':
        return `DATE('now')`;

      case 'year':
        return `CAST(STRFTIME('%Y', ${args[0]}) AS INTEGER)`;

      case 'month':
        return `CAST(STRFTIME('%m', ${args[0]}) AS INTEGER)`;

      case 'day':
        return `CAST(STRFTIME('%d', ${args[0]}) AS INTEGER)`;

      case 'hour':
        return `CAST(STRFTIME('%H', ${args[0]}) AS INTEGER)`;

      case 'minute':
        return `CAST(STRFTIME('%M', ${args[0]}) AS INTEGER)`;

      case 'second':
        return `CAST(STRFTIME('%S', ${args[0]}) AS INTEGER)`;

      // Temporal expressions parsed as functions
      case 'start of':
        // Handle start of Measurement Period specially
        if (args.length > 0) {
          const arg = args[0];
          if (arg.includes('Measurement Period')) {
            return `'${this.context.measurementPeriod?.start}'`;
          }
          return arg;
        }
        return 'NULL';

      case 'end of':
        // Handle end of Measurement Period specially
        if (args.length > 0) {
          const arg = args[0];
          if (arg.includes('Measurement Period')) {
            return `'${this.context.measurementPeriod?.end}'`;
          }
          return arg;
        }
        return 'NULL';

      // List functions
      case 'first':
        return `(SELECT ${args[0]} LIMIT 1)`;

      case 'last':
        return `(SELECT ${args[0]} ORDER BY rowid DESC LIMIT 1)`;

      case 'distinct':
        return `DISTINCT ${args[0]}`;

      // Null handling
      case 'isnull':
      case 'is null':
        return `${args[0]} IS NULL`;

      case 'coalesce':
        return `COALESCE(${args.join(', ')})`;

      // Math functions
      case 'abs':
        return `ABS(${args[0]})`;

      case 'ceiling':
      case 'ceil':
        return `CEILING(${args[0]})`;

      case 'floor':
        return `FLOOR(${args[0]})`;

      case 'round':
        return args.length >= 2
          ? `ROUND(${args[0]}, ${args[1]})`
          : `ROUND(${args[0]})`;

      case 'power':
        return `POWER(${args[0]}, ${args[1]})`;

      case 'sqrt':
        return `SQRT(${args[0]})`;

      // Logical functions
      case 'not':
        return `NOT ${args[0]}`;

      case 'exists':
        return `EXISTS ${args[0]}`;

      default:
        this.log(`Warning: Unmapped function: ${name}`);
        return `${name}(${args.join(', ')})`;
    }
  }

  private generateIdentifier(expr: IdentifierNode): string {
    // Check if it's a reference to another define (with or without spaces)
    const defineName = expr.name.replace(/\s+/g, '');

    // Track this reference for later validation
    this.trackIdentifierReference(expr.name);

    // Check if original name exists in defines map
    if (this.context.defines.has(expr.name)) {
      return defineName;
    }

    // Check if normalized name exists in CTE names
    if (this.context.cteNames.has(defineName)) {
      return defineName;
    }

    // Check if it's "Measurement Period" - return as a comment placeholder
    // The actual interval handling should be done in the temporal operators (during, in, etc.)
    if (expr.name === 'Measurement Period') {
      // Return NULL for now - the interval should be handled contextually
      // This identifier shouldn't appear standalone in valid SQL
      return `NULL /* Measurement Period */`;
    }

    // Return the identifier name - if it's missing, it will be caught in detectMissingReferences
    return defineName;
  }

  private generateLiteral(expr: LiteralNode): string {
    if (expr.valueType === 'string') {
      return `'${expr.value}'`;
    }

    if (expr.valueType === 'number') {
      return String(expr.value);
    }

    if (expr.valueType === 'boolean') {
      return expr.value ? 'TRUE' : 'FALSE';
    }

    if (expr.valueType === 'null') {
      return 'NULL';
    }

    if (expr.valueType === 'date' || expr.valueType === 'datetime') {
      return `'${expr.value}'`;
    }

    return String(expr.value);
  }

  private mapOperatorToSql(operator: string): string {
    const mapping: { [key: string]: string } = {
      'and': 'AND',
      'or': 'OR',
      'not': 'NOT',
      '=': '=',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '~': '=', // equivalent
      'in': 'IN',
      'contains': 'LIKE', // Simplified
      'during': 'BETWEEN',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
    };

    return mapping[operator] || operator.toUpperCase();
  }

  private generateFinalQuery(): string {
    return `
SELECT
  (SELECT COUNT(*) FROM InitialPopulation) AS initial_population_count,
  (SELECT COUNT(*) FROM Denominator) AS denominator_count,
  (SELECT COUNT(*) FROM Numerator) AS numerator_count,
  CASE
    WHEN (SELECT COUNT(*) FROM Denominator) > 0
    THEN ROUND((SELECT COUNT(*) FROM Numerator) * 100.0 / (SELECT COUNT(*) FROM Denominator), 2)
    ELSE 0
  END AS percentage_score`;
  }

  private log(message: string): void {
    this.logs.push(message);
  }

  getLogs(): string[] {
    return this.logs;
  }

  /**
   * Get list of missing references found during transpilation
   */
  getMissingReferences(): string[] {
    return Array.from(this.context.missingReferences);
  }

  /**
   * Get list of included libraries that are not loaded
   */
  getIncludedLibraries(): string[] {
    return [...this.context.includedLibraries];
  }

  /**
   * Check if there are any missing references
   */
  hasMissingReferences(): boolean {
    return this.context.missingReferences.size > 0;
  }
}

/**
 * ELM to SQL Transpiler
 *
 * Converts ELM (Expression Logical Model) to SQL on FHIR queries
 * This completes the pipeline: CQL → AST → ELM → SQL
 *
 * Benefits of ELM intermediate layer:
 * - Standard representation following HL7 specifications
 * - Easier to support multiple target languages (SQL, JavaScript, C#, etc.)
 * - Better optimization opportunities
 * - Improved validation and type checking
 */

import {
  ElmLibrary,
  ElmExpression,
  ElmQuery,
  ElmRetrieve,
  ElmProperty,
  ElmBinaryExpression,
  ElmUnaryExpression,
  ElmFunctionRef,
  ElmExpressionRef,
  ElmLiteral,
  ElmExpressionDef,
  ElmRelationshipClause,
} from './elm-types';

export interface SqlGenerationOptions {
  measurementPeriod?: { start: string; end: string };
  includeComments?: boolean;
}

export class ElmToSqlTranspiler {
  private logs: string[] = [];
  private defines: Map<string, ElmExpressionDef> = new Map();
  private cteNames: Set<string> = new Set();
  private options: SqlGenerationOptions;

  constructor(options: SqlGenerationOptions = {}) {
    this.options = {
      measurementPeriod: options.measurementPeriod || {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
      includeComments: options.includeComments ?? true,
    };
  }

  /**
   * Transpile ELM Library to SQL
   */
  transpile(library: ElmLibrary): string {
    this.log(`Transpiling ELM library: ${library.identifier.id}`);

    // Build defines map
    if (library.statements) {
      library.statements.forEach((statement) => {
        this.defines.set(statement.name, statement);
        this.cteNames.add(this.sanitizeIdentifier(statement.name));
      });
    }

    const ctes: string[] = [];

    // Add base FHIR views
    ctes.push(this.generateBaseFhirViews());

    // Generate CTEs for each statement
    if (library.statements) {
      library.statements.forEach((statement) => {
        this.log(`Converting statement "${statement.name}" to SQL CTE`);
        const cte = this.generateStatementCte(statement);
        ctes.push(cte);
      });
    }

    // Generate final query
    const finalQuery = this.generateFinalQuery();

    const header = this.options.includeComments
      ? `-- Generated SQL on FHIR Query from ELM\n-- Library: ${library.identifier.id}\n-- Schema: ${library.schemaIdentifier.id} ${library.schemaIdentifier.version}\n\n`
      : '';

    return `${header}WITH ${ctes.join(',\n')}\n${finalQuery}`;
  }

  /**
   * Generate base FHIR resource views
   */
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

  /**
   * Generate CTE for an ELM statement
   */
  private generateStatementCte(statement: ElmExpressionDef): string {
    const cteName = this.sanitizeIdentifier(statement.name);
    const sql = this.generateExpression(statement.expression, '  ');

    return `${cteName} AS (\n${sql}\n)`;
  }

  /**
   * Generate SQL from ELM expression
   */
  private generateExpression(expr: ElmExpression, indent: string): string {
    switch (expr.type) {
      case 'Query':
        return this.generateQuery(expr as ElmQuery, indent);

      case 'Retrieve':
        return this.generateRetrieve(expr as ElmRetrieve, indent);

      case 'Property':
        return this.generateProperty(expr as ElmProperty);

      case 'ExpressionRef':
        return this.generateExpressionRef(expr as ElmExpressionRef, indent);

      case 'Literal':
        return this.generateLiteral(expr as ElmLiteral);

      case 'And':
      case 'Or':
      case 'Equal':
      case 'NotEqual':
      case 'Less':
      case 'Greater':
      case 'LessOrEqual':
      case 'GreaterOrEqual':
      case 'In':
      case 'During':
      case 'Before':
      case 'After':
        return this.generateBinaryExpression(expr as ElmBinaryExpression);

      case 'Not':
      case 'Exists':
      case 'IsNull':
        return this.generateUnaryExpression(expr as ElmUnaryExpression);

      case 'FunctionRef':
        return this.generateFunctionRef(expr as ElmFunctionRef);

      default:
        this.log(`Warning: Unsupported ELM expression type: ${expr.type}`);
        return 'NULL';
    }
  }

  /**
   * Generate SQL Query from ELM Query
   */
  private generateQuery(query: ElmQuery, indent: string): string {
    const lines: string[] = [];

    // Determine source
    const source = query.source[0];
    const sourceExpr = source.expression;
    const alias = source.alias;

    // Determine table/CTE name
    let fromClause = '';
    if (sourceExpr.type === 'Retrieve') {
      const retrieve = sourceExpr as ElmRetrieve;
      const resourceType = retrieve.dataType.replace('FHIR.', '');
      fromClause = `${resourceType}_view ${alias}`;
    } else if (sourceExpr.type === 'ExpressionRef') {
      const exprRef = sourceExpr as ElmExpressionRef;
      const cteName = this.sanitizeIdentifier(exprRef.name);
      fromClause = `${cteName} ${alias}`;
    }

    // SELECT clause
    let selectClause = `${indent}SELECT ${alias}.id AS patient_id`;
    lines.push(selectClause);

    // FROM clause
    lines.push(`${indent}FROM ${fromClause}`);

    // Collect WHERE conditions
    const whereConditions: string[] = [];

    // Add default status filter (HL7 best practice)
    if (sourceExpr.type === 'Retrieve') {
      const retrieve = sourceExpr as ElmRetrieve;
      const resourceType = retrieve.dataType.replace('FHIR.', '');
      const statusFilter = this.getDefaultStatusFilter(resourceType, alias);
      if (statusFilter) {
        whereConditions.push(statusFilter);
      }

      // Add code filter if present
      if (retrieve.codes) {
        const codeFilter = this.generateCodeFilter(retrieve.codes, alias);
        if (codeFilter) {
          whereConditions.push(codeFilter);
        }
      }
    }

    // Add relationship clauses (WITH/WITHOUT)
    if (query.relationship) {
      query.relationship.forEach((rel) => {
        const relSql = this.generateRelationship(rel, alias, indent);
        lines.push(relSql.join);
        if (relSql.whereCondition) {
          whereConditions.push(relSql.whereCondition);
        }
      });
    }

    // Add WHERE clause
    if (query.where) {
      const whereCondition = this.generateExpression(query.where, indent);
      whereConditions.push(whereCondition);
    }

    if (whereConditions.length > 0) {
      lines.push(`${indent}WHERE ${whereConditions.join(' AND ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate Retrieve (simple resource query)
   */
  private generateRetrieve(retrieve: ElmRetrieve, indent: string): string {
    const resourceType = retrieve.dataType.replace('FHIR.', '');
    const alias = resourceType[0].toLowerCase();

    const lines: string[] = [
      `${indent}SELECT ${alias}.id AS patient_id`,
      `${indent}FROM ${resourceType}_view ${alias}`,
    ];

    const whereConditions: string[] = [];

    // Default status filter
    const statusFilter = this.getDefaultStatusFilter(resourceType, alias);
    if (statusFilter) {
      whereConditions.push(statusFilter);
    }

    // Code filter
    if (retrieve.codes) {
      const codeFilter = this.generateCodeFilter(retrieve.codes, alias);
      if (codeFilter) {
        whereConditions.push(codeFilter);
      }
    }

    if (whereConditions.length > 0) {
      lines.push(`${indent}WHERE ${whereConditions.join(' AND ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate code filter for value set membership
   */
  private generateCodeFilter(codes: ElmExpression, alias: string): string | null {
    if (codes.type === 'Literal') {
      const literal = codes as ElmLiteral;
      const codeValue = String(literal.value);

      // Check if canonical URL (value set reference)
      if (this.isCanonicalUrl(codeValue)) {
        return `EXISTS (
      SELECT 1 FROM ValueSetExpansion vse
      WHERE vse.value_set_url = '${codeValue}'
        AND vse.code = ${alias}.code
        AND vse.system = ${alias}.code_system
    )`;
      }

      // Legacy: LIKE matching
      return `${alias}.code_text LIKE '%${codeValue}%'`;
    }

    return null;
  }

  /**
   * Get default status filter per HL7 guidelines
   */
  private getDefaultStatusFilter(resourceType: string, alias: string): string | null {
    switch (resourceType) {
      case 'Observation':
        return `${alias}.status IN ('final', 'amended', 'corrected')`;
      case 'Condition':
        return `${alias}.clinical_status = 'active'`;
      case 'Procedure':
        return `${alias}.status = 'completed'`;
      case 'MedicationRequest':
        return `${alias}.status IN ('active', 'completed')`;
      case 'Encounter':
        return `${alias}.status = 'finished'`;
      case 'DiagnosticReport':
        return `${alias}.status IN ('final', 'amended', 'corrected')`;
      default:
        return null;
    }
  }

  /**
   * Generate relationship clause (WITH/WITHOUT)
   */
  private generateRelationship(
    rel: ElmRelationshipClause,
    parentAlias: string,
    indent: string
  ): { join: string; whereCondition?: string } {
    const relExpr = rel.expression;
    let tableName = '';
    let relAlias = rel.alias;

    if (relExpr.type === 'Retrieve') {
      const retrieve = relExpr as ElmRetrieve;
      tableName = retrieve.dataType.replace('FHIR.', '') + '_view';
    } else if (relExpr.type === 'ExpressionRef') {
      const exprRef = relExpr as ElmExpressionRef;
      tableName = this.sanitizeIdentifier(exprRef.name);
    }

    const joinType = rel.type === 'With' ? 'INNER JOIN' : 'LEFT JOIN';
    const joinCondition = `${relAlias}.subject_id = ${parentAlias}.id`;

    let whereCondition: string | undefined;
    if (rel.suchThat) {
      whereCondition = this.generateExpression(rel.suchThat, indent);
    }

    if (rel.type === 'Without' && !whereCondition) {
      whereCondition = `${relAlias}.id IS NULL`;
    }

    return {
      join: `${indent}${joinType} ${tableName} ${relAlias} ON ${joinCondition}`,
      whereCondition,
    };
  }

  private generateProperty(prop: ElmProperty): string {
    if (prop.source) {
      const source = this.generateExpression(prop.source, '');
      return `${source}.${prop.path}`;
    }
    return prop.path;
  }

  private generateExpressionRef(ref: ElmExpressionRef, indent: string): string {
    const cteName = this.sanitizeIdentifier(ref.name);
    return `${indent}SELECT patient_id FROM ${cteName}`;
  }

  private generateLiteral(literal: ElmLiteral): string {
    if (literal.valueType === 'String') {
      return `'${literal.value}'`;
    }
    return String(literal.value);
  }

  private generateBinaryExpression(expr: ElmBinaryExpression): string {
    const left = this.generateExpression(expr.operand[0], '');
    const right = this.generateExpression(expr.operand[1], '');

    const operatorMap: { [key: string]: string } = {
      And: 'AND',
      Or: 'OR',
      Equal: '=',
      NotEqual: '!=',
      Less: '<',
      Greater: '>',
      LessOrEqual: '<=',
      GreaterOrEqual: '>=',
      In: 'IN',
      During: 'BETWEEN',
      Before: '<',
      After: '>',
    };

    const sqlOp = operatorMap[expr.type] || '=';
    return `${left} ${sqlOp} ${right}`;
  }

  private generateUnaryExpression(expr: ElmUnaryExpression): string {
    const operand = this.generateExpression(expr.operand, '');

    switch (expr.type) {
      case 'Not':
        return `NOT ${operand}`;
      case 'Exists':
        return `EXISTS ${operand}`;
      case 'IsNull':
        return `${operand} IS NULL`;
      default:
        return operand;
    }
  }

  private generateFunctionRef(func: ElmFunctionRef): string {
    // Map CQL functions to SQL
    switch (func.name.toLowerCase()) {
      case 'ageinyears':
      case 'ageinyearsat':
        return `CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(birthDate)) / 365.25 AS INTEGER)`;
      default:
        return `${func.name}()`;
    }
  }

  private generateFinalQuery(): string {
    if (this.cteNames.size === 0) {
      return 'SELECT NULL AS patient_id WHERE 1=0;';
    }

    const lastCte = Array.from(this.cteNames).pop()!;
    return `SELECT DISTINCT patient_id FROM ${lastCte};`;
  }

  private sanitizeIdentifier(name: string): string {
    return name.replace(/\s+/g, '');
  }

  private isCanonicalUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('urn:');
  }

  getLogs(): string[] {
    return this.logs;
  }

  private log(message: string): void {
    this.logs.push(message);
  }
}

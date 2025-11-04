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

export interface SqlGenerationContext {
  defines: Map<string, DefineNode>;
  cteNames: Set<string>;
  aliases: Map<string, string>;
  measurementPeriod?: { start: string; end: string };
}

export class AstToSqlTranspiler {
  private context: SqlGenerationContext;
  private logs: string[] = [];

  constructor() {
    this.context = {
      defines: new Map(),
      cteNames: new Set(),
      aliases: new Map(),
      measurementPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
    };
  }

  transpile(library: LibraryNode): string {
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

    // Generate final query
    const finalQuery = this.generateFinalQuery();

    return `-- Generated SQL on FHIR Query from CQL\n-- Using Common Table Expressions (CTEs) for modularity\nWITH ${ctes.join(',\n')}\n${finalQuery}`;
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
    code_text,
    effective_datetime,
    value_quantity,
    value_unit
  FROM Observation
),
Condition_view AS (
  SELECT
    id,
    subject_id,
    code_text,
    onset_datetime,
    clinical_status
  FROM Condition
),
Procedure_view AS (
  SELECT
    id,
    subject_id,
    code_text,
    performed_datetime,
    status
  FROM Procedure
),
MedicationRequest_view AS (
  SELECT
    id,
    subject_id,
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

    const sqlExpression = this.generateExpression(define.expression);

    return `${cteName} AS (\n${sqlExpression}\n)`;
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

    if (query.source.type === 'ResourceReference') {
      sourceTable = `${query.source.resourceType}_view`;
      alias = query.source.resourceType[0].toLowerCase();
    } else if (query.source.type === 'Identifier') {
      // Reference to another define
      const defineName = (query.source as IdentifierNode).name.replace(/\s+/g, '');
      if (this.context.cteNames.has(defineName)) {
        return `${indent}SELECT patient_id FROM ${defineName}`;
      }
      sourceTable = `${query.source.name}_view`;
    }

    lines.push(`${indent}SELECT ${alias}.id AS patient_id`);

    // Add additional fields if needed
    if (query.source.type === 'ResourceReference' &&
        query.source.resourceType === 'Patient') {
      lines.push(`${indent}       ${alias}.gender,`);
      lines.push(`${indent}       ${alias}.age,`);
      lines.push(`${indent}       ${alias}.birthDate`);
    }

    lines.push(`${indent}FROM ${sourceTable} ${alias}`);

    // Generate WHERE clause
    if (query.where) {
      const whereCondition = this.generateWhereCondition(query.where, alias);
      lines.push(`${indent}WHERE ${whereCondition}`);
    }

    // Generate relationship clauses (WITH/WITHOUT)
    if (query.relationships && query.relationships.length > 0) {
      query.relationships.forEach(rel => {
        const relSql = this.generateRelationship(rel, alias, indent);
        lines.push(relSql);
      });
    }

    return lines.join('\n');
  }

  private generateSimpleResourceQuery(ref: ResourceReferenceNode, indent: string): string {
    const table = `${ref.resourceType}_view`;
    const alias = ref.resourceType[0].toLowerCase();

    return `${indent}SELECT ${alias}.id FROM ${table} ${alias}`;
  }

  private generateRelationship(rel: RelationshipClauseNode, parentAlias: string, indent: string): string {
    const joinType = rel.relationship === 'with' ? 'LEFT JOIN' : 'LEFT JOIN';
    const resourceType = rel.source.resourceType;
    const table = `${resourceType}_view`;
    const alias = rel.alias || resourceType[0].toLowerCase();

    let join = `${indent}${joinType} ${table} ${alias} ON ${alias}.subject_id = ${parentAlias}.id`;

    if (rel.condition) {
      const condition = this.generateExpression(rel.condition);
      join += `\n${indent}  AND ${condition}`;
    }

    return join;
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

    // Special handling for temporal operators
    if (expr.operator === 'during' && right.includes('Measurement Period')) {
      return `BETWEEN '${this.context.measurementPeriod?.start}' AND '${this.context.measurementPeriod?.end}'`;
    }

    return `${left} ${operator} ${right}`;
  }

  private generateUnaryExpression(expr: UnaryExpressionNode): string {
    const operand = this.generateExpression(expr.operand);

    switch (expr.operator) {
      case 'not':
        return `NOT ${operand}`;
      case 'exists':
        return `EXISTS ${operand}`;
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

    return `${object}.${expr.member}`;
  }

  private generateFunctionCall(expr: FunctionCallNode): string {
    const name = expr.name;
    const args = expr.arguments.map(arg => this.generateExpression(arg));

    // Map CQL functions to SQL
    switch (name.toLowerCase()) {
      case 'ageinyearsat':
        // Simplified: return age column
        return 'age';

      case 'count':
        return `COUNT(${args[0] || '*'})`;

      case 'avg':
        return `AVG(${args[0]})`;

      case 'max':
        return `MAX(${args[0]})`;

      case 'min':
        return `MIN(${args[0]})`;

      case 'sum':
        return `SUM(${args[0]})`;

      default:
        return `${name}(${args.join(', ')})`;
    }
  }

  private generateIdentifier(expr: IdentifierNode): string {
    // Check if it's a reference to another define
    const defineName = expr.name.replace(/\s+/g, '');
    if (this.context.cteNames.has(defineName)) {
      return defineName;
    }

    // Check if it's "Measurement Period"
    if (expr.name === 'Measurement Period') {
      return `Interval[@${this.context.measurementPeriod?.start}, @${this.context.measurementPeriod?.end}]`;
    }

    return expr.name;
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
}

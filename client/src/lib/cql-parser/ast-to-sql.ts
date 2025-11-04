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

    this.log(`Generating CTE for "${define.name}", expression type: ${define.expression.type}`);

    // Special handling for Identifier expressions at the top level
    if (define.expression.type === 'Identifier') {
      const refName = (define.expression as IdentifierNode).name.replace(/\s+/g, '');
      this.log(`  -> Identifier reference to "${refName}"`);
      return `${cteName} AS (\n  SELECT patient_id FROM ${refName}\n)`;
    }

    const sqlExpression = this.generateExpression(define.expression, '  ');

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
        : (codeFilter as LiteralNode).value;

      // Use LIKE for partial matching to be more flexible
      return `${alias}.code_text LIKE '%${codeValue}%'`;
    }

    // Case 2: Binary expression (e.g., code in "Value Set Name")
    if (codeFilter.type === 'BinaryExpression') {
      const expr = codeFilter as BinaryExpressionNode;

      // Handle "in" operator for value set membership
      if (expr.operator === 'in') {
        // For now, treat value set as a simple code match
        // In a real implementation, this would query a value set expansion table
        const valueSetName = this.generateExpression(expr.right);
        this.log(`Code filter uses value set: ${valueSetName} (treating as code match for now)`);

        // Simplified: just check if code_text contains the value set name
        return `${alias}.code_text LIKE '%${valueSetName}%'`;
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
    if (expr.operator === 'during') {
      // Check if right side is measurement period reference
      if (right.includes('Measurement Period') || right.includes('Interval')) {
        return `${left} BETWEEN '${this.context.measurementPeriod?.start}' AND '${this.context.measurementPeriod?.end}'`;
      }
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
      case 'end of':
        // These come from the parser's temporal expression handling
        if (args.length > 0) {
          // For now, just return the argument
          // In full implementation, would extract start/end of period
          return args[0];
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

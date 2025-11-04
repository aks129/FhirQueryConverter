/**
 * AST to ELM Converter
 *
 * Converts CQL AST to ELM (Expression Logical Model)
 * This provides a standardized intermediate representation following HL7 specifications.
 *
 * Architecture: CQL AST → ELM → SQL (or other target languages)
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
} from '../cql-parser/ast-types';

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
  ElmAliasedQuerySource,
  ElmRelationshipClause,
  ElmExpressionDef,
} from './elm-types';

export class AstToElmConverter {
  private logs: string[] = [];

  /**
   * Convert CQL Library AST to ELM Library
   */
  convertLibrary(library: LibraryNode): ElmLibrary {
    this.log(`Converting CQL AST to ELM: ${library.identifier || 'Anonymous'}`);

    const elmLibrary: ElmLibrary = {
      type: 'Library',
      identifier: {
        id: library.identifier || 'Anonymous',
        version: library.version,
      },
      schemaIdentifier: {
        id: 'urn:hl7-org:elm',
        version: 'r1',
      },
      usings: [
        {
          localIdentifier: 'FHIR',
          uri: 'http://hl7.org/fhir',
          version: '4.0.1',
        },
      ],
      statements: [],
    };

    // Convert all define statements to expression definitions
    library.defines.forEach((define) => {
      const elmExpression = this.convertDefine(define);
      elmLibrary.statements!.push(elmExpression);
    });

    return elmLibrary;
  }

  /**
   * Convert Define statement to ELM ExpressionDef
   */
  private convertDefine(define: DefineNode): ElmExpressionDef {
    this.log(`Converting define: ${define.name}`);

    return {
      name: define.name,
      context: 'Patient', // Default context
      accessLevel: 'Public',
      expression: this.convertExpression(define.expression),
    };
  }

  /**
   * Convert CQL expression to ELM expression
   */
  private convertExpression(expr: CqlExpressionNode): ElmExpression {
    switch (expr.type) {
      case 'Query':
        return this.convertQuery(expr as QueryNode);

      case 'BinaryExpression':
        return this.convertBinaryExpression(expr as BinaryExpressionNode);

      case 'UnaryExpression':
        return this.convertUnaryExpression(expr as UnaryExpressionNode);

      case 'MemberAccess':
        return this.convertMemberAccess(expr as MemberAccessNode);

      case 'FunctionCall':
        return this.convertFunctionCall(expr as FunctionCallNode);

      case 'Identifier':
        return this.convertIdentifier(expr as IdentifierNode);

      case 'Literal':
        return this.convertLiteral(expr as LiteralNode);

      case 'ResourceReference':
        return this.convertResourceReference(expr as ResourceReferenceNode);

      case 'Interval':
        return this.convertInterval(expr as IntervalNode);

      default:
        this.log(`Warning: Unsupported expression type: ${expr.type}`);
        return {
          type: 'Null',
        };
    }
  }

  /**
   * Convert Query to ELM Query
   */
  private convertQuery(query: QueryNode): ElmQuery {
    // Determine source
    let sourceExpression: ElmExpression;
    let alias: string;

    if (query.source.type === 'ResourceReference') {
      sourceExpression = this.convertResourceReference(query.source);
      alias = query.source.resourceType[0].toLowerCase();
    } else if (query.source.type === 'Identifier') {
      sourceExpression = this.convertIdentifier(query.source as IdentifierNode);
      alias = (query.source as IdentifierNode).name[0].toLowerCase();
    } else {
      sourceExpression = this.convertExpression(query.source);
      alias = 'source';
    }

    const elmQuery: ElmQuery = {
      type: 'Query',
      source: [
        {
          alias,
          expression: sourceExpression,
        },
      ],
    };

    // Convert relationships (WITH/WITHOUT)
    if (query.relationships && query.relationships.length > 0) {
      elmQuery.relationship = query.relationships.map((rel) =>
        this.convertRelationship(rel)
      );
    }

    // Convert WHERE clause
    if (query.where) {
      elmQuery.where = this.convertExpression(query.where);
    }

    // Convert RETURN clause
    if (query.return) {
      elmQuery.return = {
        distinct: false,
        expression: this.convertExpression(query.return),
      };
    }

    return elmQuery;
  }

  /**
   * Convert ResourceReference to ELM Retrieve
   */
  private convertResourceReference(ref: ResourceReferenceNode): ElmRetrieve {
    const retrieve: ElmRetrieve = {
      type: 'Retrieve',
      dataType: `FHIR.${ref.resourceType}`,
    };

    // Add code filter if present
    if (ref.codeFilter) {
      retrieve.codeProperty = 'code';
      retrieve.codes = this.convertExpression(ref.codeFilter);
    }

    return retrieve;
  }

  /**
   * Convert Relationship clause (WITH/WITHOUT)
   */
  private convertRelationship(rel: RelationshipClauseNode): ElmRelationshipClause {
    let alias: string;
    let expression: ElmExpression;

    expression = this.convertResourceReference(rel.source);
    alias = rel.alias || rel.source.resourceType[0].toLowerCase();

    const elmRel: ElmRelationshipClause = {
      type: rel.relationship === 'with' ? 'With' : 'Without',
      alias,
      expression,
    };

    if (rel.condition) {
      elmRel.suchThat = this.convertExpression(rel.condition);
    }

    return elmRel;
  }

  /**
   * Convert Binary Expression
   */
  private convertBinaryExpression(expr: BinaryExpressionNode): ElmBinaryExpression {
    // Map CQL operators to ELM types
    const operatorMap: { [key: string]: string } = {
      and: 'And',
      or: 'Or',
      xor: 'Xor',
      '=': 'Equal',
      '!=': 'NotEqual',
      '<': 'Less',
      '>': 'Greater',
      '<=': 'LessOrEqual',
      '>=': 'GreaterOrEqual',
      '+': 'Add',
      '-': 'Subtract',
      '*': 'Multiply',
      '/': 'Divide',
      in: 'In',
      contains: 'Contains',
      during: 'During',
      before: 'Before',
      after: 'After',
      'on or before': 'Before',
      'on or after': 'After',
      overlaps: 'Overlaps',
      starts: 'Starts',
      ends: 'Ends',
      '~': 'Equivalent',
    };

    const elmType = operatorMap[expr.operator] || 'Equal';

    return {
      type: elmType as any,
      operand: [this.convertExpression(expr.left), this.convertExpression(expr.right)],
    };
  }

  /**
   * Convert Unary Expression
   */
  private convertUnaryExpression(expr: UnaryExpressionNode): ElmUnaryExpression {
    const operatorMap: { [key: string]: string } = {
      not: 'Not',
      exists: 'Exists',
      'is null': 'IsNull',
    };

    const elmType = operatorMap[expr.operator] || 'Not';

    return {
      type: elmType as any,
      operand: this.convertExpression(expr.operand),
    };
  }

  /**
   * Convert Member Access (Property)
   */
  private convertMemberAccess(expr: MemberAccessNode): ElmProperty {
    return {
      type: 'Property',
      source: this.convertExpression(expr.object),
      path: expr.member,
    };
  }

  /**
   * Convert Function Call
   */
  private convertFunctionCall(expr: FunctionCallNode): ElmFunctionRef {
    return {
      type: 'FunctionRef',
      name: expr.name,
      operand: expr.arguments.map((arg) => this.convertExpression(arg)),
    };
  }

  /**
   * Convert Identifier (reference to another define or variable)
   */
  private convertIdentifier(expr: IdentifierNode): ElmExpressionRef {
    return {
      type: 'ExpressionRef',
      name: expr.name,
    };
  }

  /**
   * Convert Literal value
   */
  private convertLiteral(expr: LiteralNode): ElmLiteral {
    let valueType = 'String';
    let value: string | number | boolean = '';

    if (expr.value === null) {
      valueType = 'Null';
      value = '';
    } else if (typeof expr.value === 'number') {
      valueType = Number.isInteger(expr.value) ? 'Integer' : 'Decimal';
      value = expr.value;
    } else if (typeof expr.value === 'boolean') {
      valueType = 'Boolean';
      value = expr.value;
    } else {
      value = String(expr.value);
    }

    return {
      type: 'Literal',
      valueType,
      value,
    };
  }

  /**
   * Convert Interval
   */
  private convertInterval(expr: IntervalNode): ElmExpression {
    return {
      type: 'Interval',
      low: expr.start ? this.convertExpression(expr.start) : undefined,
      high: expr.end ? this.convertExpression(expr.end) : undefined,
      lowClosed: true,
      highClosed: true,
    };
  }

  /**
   * Get conversion logs
   */
  getLogs(): string[] {
    return this.logs;
  }

  /**
   * Add log message
   */
  private log(message: string): void {
    this.logs.push(message);
  }
}

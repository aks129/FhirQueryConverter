/**
 * Abstract Syntax Tree (AST) type definitions for CQL
 * These types represent the parsed structure of CQL code
 */

export type CqlAstNode =
  | LibraryNode
  | DefineNode
  | QueryNode
  | FilterNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | LiteralNode
  | IdentifierNode
  | ResourceReferenceNode
  | FunctionCallNode
  | IntervalNode
  | ParameterNode;

export interface BaseNode {
  type: string;
  location?: SourceLocation;
}

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

/**
 * Library: Top-level CQL document
 */
export interface LibraryNode extends BaseNode {
  type: 'Library';
  identifier: string;
  version?: string;
  using?: UsingDefinition[];
  includes?: IncludeDefinition[];
  parameters?: ParameterNode[];
  defines: DefineNode[];
}

export interface UsingDefinition {
  model: string;
  version: string;
}

export interface IncludeDefinition {
  library: string;
  version?: string;
  alias: string;
}

/**
 * Define: A CQL define statement
 */
export interface DefineNode extends BaseNode {
  type: 'Define';
  name: string;
  expression: CqlExpressionNode;
  accessLevel?: 'public' | 'private';
}

/**
 * Parameter: A CQL parameter definition
 */
export interface ParameterNode extends BaseNode {
  type: 'Parameter';
  name: string;
  dataType: string;
  defaultValue?: CqlExpressionNode;
}

/**
 * Expression types
 */
export type CqlExpressionNode =
  | QueryNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | LiteralNode
  | IdentifierNode
  | ResourceReferenceNode
  | FunctionCallNode
  | IntervalNode
  | MemberAccessNode
  | RelationshipClauseNode;

/**
 * Query: FHIR resource query with filters
 */
export interface QueryNode extends BaseNode {
  type: 'Query';
  source: ResourceReferenceNode | IdentifierNode;
  alias?: string;
  where?: CqlExpressionNode;
  relationships?: RelationshipClauseNode[];
  return?: CqlExpressionNode;
}

/**
 * Relationship clause: with/without such that
 */
export interface RelationshipClauseNode extends BaseNode {
  type: 'RelationshipClause';
  relationship: 'with' | 'without';
  source: ResourceReferenceNode;
  alias?: string;
  condition?: CqlExpressionNode;
}

/**
 * Resource reference: [Patient], [Observation: "Heart Rate"]
 */
export interface ResourceReferenceNode extends BaseNode {
  type: 'ResourceReference';
  resourceType: string;
  codeFilter?: CqlExpressionNode;
}

/**
 * Binary expression: a AND b, a OR b, a = b, etc.
 */
export interface BinaryExpressionNode extends BaseNode {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: CqlExpressionNode;
  right: CqlExpressionNode;
}

export type BinaryOperator =
  // Logical
  | 'and' | 'or' | 'xor'
  // Comparison
  | '=' | '!=' | '<' | '>' | '<=' | '>='
  | '~' // equivalent
  // Arithmetic
  | '+' | '-' | '*' | '/' | 'mod' | 'div'
  // Membership
  | 'in' | 'contains'
  // Temporal
  | 'during' | 'before' | 'after' | 'overlaps'
  | 'starts' | 'ends' | 'occurs'
  | 'on or before' | 'on or after'
  // Temporal with duration
  | 'days or less before' | 'days or less after'
  | 'months or less before' | 'months or less after'
  | 'years or less before' | 'years or less after'
  // Set operations
  | 'union' | 'except' | 'intersect';

/**
 * Unary expression: not a, exists a
 */
export interface UnaryExpressionNode extends BaseNode {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  operand: CqlExpressionNode;
}

export type UnaryOperator = 'not' | 'exists' | 'is null' | 'is not null';

/**
 * Member access: Patient.gender, Observation.value
 */
export interface MemberAccessNode extends BaseNode {
  type: 'MemberAccess';
  object: CqlExpressionNode;
  member: string;
}

/**
 * Function call: AgeInYearsAt(date), Count(list)
 */
export interface FunctionCallNode extends BaseNode {
  type: 'FunctionCall';
  name: string;
  arguments: CqlExpressionNode[];
}

/**
 * Interval: Interval[@2024-01-01, @2024-12-31]
 */
export interface IntervalNode extends BaseNode {
  type: 'Interval';
  start: CqlExpressionNode;
  end: CqlExpressionNode;
  startInclusive: boolean;
  endInclusive: boolean;
}

/**
 * Filter: where clause condition
 */
export interface FilterNode extends BaseNode {
  type: 'Filter';
  condition: CqlExpressionNode;
}

/**
 * Literal values
 */
export interface LiteralNode extends BaseNode {
  type: 'Literal';
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'null';
  value: string | number | boolean | null;
}

/**
 * Identifier: variable or reference name
 */
export interface IdentifierNode extends BaseNode {
  type: 'Identifier';
  name: string;
}

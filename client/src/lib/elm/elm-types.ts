/**
 * ELM (Expression Logical Model) Type Definitions
 *
 * ELM is HL7's standard intermediate representation for clinical quality logic.
 * This serves as a bridge between CQL and target languages (SQL, JavaScript, etc.)
 *
 * References:
 * - https://cql.hl7.org/elm.html
 * - http://hl7.org/fhir/us/cql/STU2/using-elm.html
 * - https://github.com/FirelyTeam/firely-cql-sdk
 *
 * Architecture:
 * CQL Source → CQL Parser → CQL AST → ELM Generator → ELM Tree → SQL Generator → SQL
 */

/**
 * Base ELM element - all ELM nodes extend this
 */
export interface ElmElement {
  type: string;
  resultTypeName?: string;
  resultTypeSpecifier?: ElmTypeSpecifier;
  annotation?: ElmAnnotation[];
  locator?: string;
}

export interface ElmAnnotation {
  type: 'Annotation';
  s?: {
    r?: string; // Reference
    t?: string; // Text
  };
}

/**
 * Type specifiers for ELM expressions
 */
export type ElmTypeSpecifier =
  | ElmNamedTypeSpecifier
  | ElmListTypeSpecifier
  | ElmIntervalTypeSpecifier
  | ElmTupleTypeSpecifier;

export interface ElmNamedTypeSpecifier {
  type: 'NamedTypeSpecifier';
  name: string; // e.g., "System.String", "FHIR.Patient"
}

export interface ElmListTypeSpecifier {
  type: 'ListTypeSpecifier';
  elementType: ElmTypeSpecifier;
}

export interface ElmIntervalTypeSpecifier {
  type: 'IntervalTypeSpecifier';
  pointType: ElmTypeSpecifier;
}

export interface ElmTupleTypeSpecifier {
  type: 'TupleTypeSpecifier';
  element: ElmTupleElementDefinition[];
}

export interface ElmTupleElementDefinition {
  name: string;
  elementType: ElmTypeSpecifier;
}

/**
 * ELM Library - top level container
 */
export interface ElmLibrary extends ElmElement {
  type: 'Library';
  identifier: ElmVersionedIdentifier;
  schemaIdentifier: ElmVersionedIdentifier;
  usings?: ElmUsing[];
  includes?: ElmIncludeDef[];
  parameters?: ElmParameterDef[];
  codeSystems?: ElmCodeSystemDef[];
  valueSets?: ElmValueSetDef[];
  codes?: ElmCodeDef[];
  concepts?: ElmConceptDef[];
  statements?: ElmExpressionDef[];
}

export interface ElmVersionedIdentifier {
  id: string;
  version?: string;
}

export interface ElmUsing {
  localIdentifier: string;
  uri: string;
  version?: string;
}

export interface ElmIncludeDef {
  localIdentifier: string;
  path: string;
  version?: string;
}

export interface ElmParameterDef {
  name: string;
  accessLevel?: 'Public' | 'Private';
  parameterTypeSpecifier?: ElmTypeSpecifier;
  default?: ElmExpression;
}

export interface ElmCodeSystemDef {
  name: string;
  id: string;
  version?: string;
  accessLevel?: 'Public' | 'Private';
}

export interface ElmValueSetDef {
  name: string;
  id: string;
  version?: string;
  accessLevel?: 'Public' | 'Private';
}

export interface ElmCodeDef {
  name: string;
  id: string;
  system: string;
  display?: string;
  accessLevel?: 'Public' | 'Private';
}

export interface ElmConceptDef {
  name: string;
  display?: string;
  code: string[];
  accessLevel?: 'Public' | 'Private';
}

export interface ElmExpressionDef {
  name: string;
  context: string; // e.g., "Patient", "Population"
  accessLevel?: 'Public' | 'Private';
  expression: ElmExpression;
}

/**
 * ELM Expressions - the core logic elements
 */
export type ElmExpression =
  | ElmLiteral
  | ElmProperty
  | ElmQuery
  | ElmBinaryExpression
  | ElmUnaryExpression
  | ElmFunctionRef
  | ElmExpressionRef
  | ElmRetrieve
  | ElmInterval
  | ElmList
  | ElmTuple
  | ElmIf
  | ElmCase
  | ElmNull;

/**
 * Literal values
 */
export interface ElmLiteral extends ElmElement {
  type: 'Literal';
  valueType: string; // e.g., "Integer", "String", "Boolean", "DateTime"
  value: string | number | boolean;
}

/**
 * Property access (e.g., Patient.birthDate)
 */
export interface ElmProperty extends ElmElement {
  type: 'Property';
  source?: ElmExpression;
  path: string;
  scope?: string;
}

/**
 * Retrieve - accessing FHIR resources
 */
export interface ElmRetrieve extends ElmElement {
  type: 'Retrieve';
  dataType: string; // e.g., "FHIR.Patient", "FHIR.Observation"
  templateId?: string;
  codeProperty?: string;
  codes?: ElmExpression; // ValueSet reference or code list
  dateProperty?: string;
  dateRange?: ElmExpression;
  context?: ElmExpression;
  include?: ElmIncludeElement[];
}

export interface ElmIncludeElement {
  type: 'IncludeElement';
  relatedDataType: string;
  relatedProperty: string;
}

/**
 * Query - the heart of CQL data manipulation
 */
export interface ElmQuery extends ElmElement {
  type: 'Query';
  source: ElmAliasedQuerySource[];
  let?: ElmLetClause[];
  relationship?: ElmRelationshipClause[];
  where?: ElmExpression;
  return?: ElmReturnClause;
  sort?: ElmSortClause;
}

export interface ElmAliasedQuerySource {
  alias: string;
  expression: ElmExpression;
}

export interface ElmLetClause {
  identifier: string;
  expression: ElmExpression;
}

export interface ElmRelationshipClause {
  type: 'With' | 'Without';
  alias: string;
  expression: ElmExpression;
  suchThat?: ElmExpression;
}

export interface ElmReturnClause {
  distinct?: boolean;
  expression: ElmExpression;
}

export interface ElmSortClause {
  by: ElmSortByItem[];
}

export interface ElmSortByItem {
  direction: 'asc' | 'desc';
  path?: string;
  expression?: ElmExpression;
}

/**
 * Binary expressions (and, or, =, <, >, etc.)
 */
export interface ElmBinaryExpression extends ElmElement {
  type:
    | 'And'
    | 'Or'
    | 'Xor'
    | 'Equal'
    | 'NotEqual'
    | 'Less'
    | 'Greater'
    | 'LessOrEqual'
    | 'GreaterOrEqual'
    | 'Add'
    | 'Subtract'
    | 'Multiply'
    | 'Divide'
    | 'In'
    | 'Contains'
    | 'During'
    | 'Before'
    | 'After'
    | 'Overlaps'
    | 'Starts'
    | 'Ends'
    | 'Equivalent';
  operand: [ElmExpression, ElmExpression];
}

/**
 * Unary expressions (not, exists, etc.)
 */
export interface ElmUnaryExpression extends ElmElement {
  type: 'Not' | 'Exists' | 'IsNull' | 'IsTrue' | 'IsFalse';
  operand: ElmExpression;
}

/**
 * Function call
 */
export interface ElmFunctionRef extends ElmElement {
  type: 'FunctionRef';
  name: string;
  libraryName?: string;
  operand?: ElmExpression[];
}

/**
 * Expression reference (reference to a define)
 */
export interface ElmExpressionRef extends ElmElement {
  type: 'ExpressionRef';
  name: string;
  libraryName?: string;
}

/**
 * Interval
 */
export interface ElmInterval extends ElmElement {
  type: 'Interval';
  low?: ElmExpression;
  high?: ElmExpression;
  lowClosed?: boolean;
  highClosed?: boolean;
}

/**
 * List
 */
export interface ElmList extends ElmElement {
  type: 'List';
  element?: ElmExpression[];
}

/**
 * Tuple
 */
export interface ElmTuple extends ElmElement {
  type: 'Tuple';
  element: ElmTupleElement[];
}

export interface ElmTupleElement {
  name: string;
  value: ElmExpression;
}

/**
 * Conditional (if-then-else)
 */
export interface ElmIf extends ElmElement {
  type: 'If';
  condition: ElmExpression;
  then: ElmExpression;
  else: ElmExpression;
}

/**
 * Case expression
 */
export interface ElmCase extends ElmElement {
  type: 'Case';
  comparand?: ElmExpression;
  caseItem: ElmCaseItem[];
  else: ElmExpression;
}

export interface ElmCaseItem {
  when: ElmExpression;
  then: ElmExpression;
}

/**
 * Null literal
 */
export interface ElmNull extends ElmElement {
  type: 'Null';
}

/**
 * Aggregate expressions (Count, Sum, Min, Max, Avg, etc.)
 */
export interface ElmAggregateExpression extends ElmElement {
  type: 'Count' | 'Sum' | 'Min' | 'Max' | 'Avg' | 'AllTrue' | 'AnyTrue';
  source: ElmExpression;
  path?: string;
}

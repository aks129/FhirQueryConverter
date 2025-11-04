/**
 * CQL Parser - Syntax analysis
 * Builds an Abstract Syntax Tree (AST) from tokens
 */

import { CqlTokenizer, Token, TokenType } from './tokenizer';
import {
  CqlAstNode,
  LibraryNode,
  DefineNode,
  ParameterNode,
  QueryNode,
  ResourceReferenceNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  LiteralNode,
  IdentifierNode,
  FunctionCallNode,
  MemberAccessNode,
  RelationshipClauseNode,
  CqlExpressionNode,
  UsingDefinition,
  IncludeDefinition,
  IntervalNode,
} from './ast-types';

export class CqlParser {
  private tokens: Token[] = [];
  private position: number = 0;

  parse(input: string): LibraryNode {
    const tokenizer = new CqlTokenizer(input);
    this.tokens = tokenizer.tokenize();
    this.position = 0;

    return this.parseLibrary();
  }

  private parseLibrary(): LibraryNode {
    const library: LibraryNode = {
      type: 'Library',
      identifier: '',
      defines: [],
    };

    // Parse library declaration
    if (this.match(TokenType.LIBRARY)) {
      library.identifier = this.expect(TokenType.IDENTIFIER).value;
      if (this.match(TokenType.VERSION)) {
        library.version = this.expect(TokenType.STRING).value;
      }
    }

    // Parse using statements
    library.using = [];
    while (this.match(TokenType.USING)) {
      const model = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.VERSION);
      const version = this.expect(TokenType.STRING).value;
      library.using.push({ model, version });
    }

    // Parse include statements
    library.includes = [];
    while (this.match(TokenType.INCLUDE)) {
      const libraryName = this.expect(TokenType.IDENTIFIER).value;
      let version: string | undefined;
      if (this.match(TokenType.VERSION)) {
        version = this.expect(TokenType.STRING).value;
      }
      this.expect(TokenType.CALLED);
      const alias = this.expect(TokenType.IDENTIFIER).value;
      library.includes.push({ library: libraryName, version, alias });
    }

    // Parse parameters
    library.parameters = [];
    while (this.match(TokenType.PARAMETER)) {
      library.parameters.push(this.parseParameter());
    }

    // Parse define statements
    while (this.match(TokenType.DEFINE)) {
      library.defines.push(this.parseDefine());
    }

    return library;
  }

  private parseParameter(): ParameterNode {
    const name = this.expect(TokenType.STRING).value;

    // Skip the data type specification for now (e.g., "Interval<DateTime>")
    // Just consume tokens until we hit the next statement keyword or EOF
    while (!this.isAtEnd() &&
           !this.checkAny(TokenType.DEFINE, TokenType.PARAMETER, TokenType.LIBRARY)) {
      this.advance();
    }

    return {
      type: 'Parameter',
      name,
      dataType: 'Unknown', // Would need proper type parsing
    };
  }

  private parseDefine(): DefineNode {
    const name = this.expect(TokenType.STRING).value;
    this.expect(TokenType.COLON);
    const expression = this.parseExpression();

    return {
      type: 'Define',
      name,
      expression,
    };
  }

  private parseExpression(): CqlExpressionNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): CqlExpressionNode {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = 'or';
      const right = this.parseLogicalAnd();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseLogicalAnd(): CqlExpressionNode {
    let left = this.parseComparison();

    while (this.match(TokenType.AND)) {
      const operator = 'and';
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseComparison(): CqlExpressionNode {
    let left = this.parseTemporal();

    const comparisonOps = [
      TokenType.EQUALS,
      TokenType.NOT_EQUALS,
      TokenType.LESS_THAN,
      TokenType.GREATER_THAN,
      TokenType.LESS_THAN_EQUALS,
      TokenType.GREATER_THAN_EQUALS,
      TokenType.EQUIVALENT,
    ];

    if (this.matchAny(...comparisonOps)) {
      const token = this.previous();
      const operatorMap: { [key: string]: any } = {
        [TokenType.EQUALS]: '=',
        [TokenType.NOT_EQUALS]: '!=',
        [TokenType.LESS_THAN]: '<',
        [TokenType.GREATER_THAN]: '>',
        [TokenType.LESS_THAN_EQUALS]: '<=',
        [TokenType.GREATER_THAN_EQUALS]: '>=',
        [TokenType.EQUIVALENT]: '~',
      };

      const operator = operatorMap[token.type];
      const right = this.parseTemporal();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseTemporal(): CqlExpressionNode {
    let left = this.parseAdditive();

    const temporalOps = [
      TokenType.DURING,
      TokenType.BEFORE,
      TokenType.AFTER,
      TokenType.OVERLAPS,
    ];

    if (this.matchAny(...temporalOps)) {
      const token = this.previous();
      const operatorMap: { [key: string]: any } = {
        [TokenType.DURING]: 'during',
        [TokenType.BEFORE]: 'before',
        [TokenType.AFTER]: 'after',
        [TokenType.OVERLAPS]: 'overlaps',
      };

      const operator = operatorMap[token.type];
      const right = this.parseAdditive();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseAdditive(): CqlExpressionNode {
    let left = this.parseMultiplicative();

    while (this.matchAny(TokenType.PLUS, TokenType.MINUS)) {
      const token = this.previous();
      const operator = token.type === TokenType.PLUS ? '+' : '-';
      const right = this.parseMultiplicative();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseMultiplicative(): CqlExpressionNode {
    let left = this.parseUnary();

    while (this.matchAny(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const token = this.previous();
      const operator = token.type === TokenType.MULTIPLY ? '*' : '/';
      const right = this.parseUnary();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseUnary(): CqlExpressionNode {
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: 'not',
        operand,
      };
    }

    if (this.match(TokenType.EXISTS)) {
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: 'exists',
        operand,
      };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): CqlExpressionNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match(TokenType.DOT)) {
        const member = this.expect(TokenType.IDENTIFIER).value;
        expr = {
          type: 'MemberAccess',
          object: expr,
          member,
        };
      } else if (this.check(TokenType.LEFT_PAREN) && expr.type === 'Identifier') {
        // Function call
        this.advance();
        const args: CqlExpressionNode[] = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }

        this.expect(TokenType.RIGHT_PAREN);

        expr = {
          type: 'FunctionCall',
          name: (expr as IdentifierNode).name,
          arguments: args,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): CqlExpressionNode {
    // String literal
    if (this.match(TokenType.STRING)) {
      return {
        type: 'Literal',
        valueType: 'string',
        value: this.previous().value,
      };
    }

    // Number literal
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'Literal',
        valueType: 'number',
        value: parseFloat(this.previous().value),
      };
    }

    // Boolean literal
    if (this.match(TokenType.BOOLEAN)) {
      return {
        type: 'Literal',
        valueType: 'boolean',
        value: this.previous().value.toLowerCase() === 'true',
      };
    }

    // Date/DateTime literal
    if (this.matchAny(TokenType.DATE, TokenType.DATETIME, TokenType.TIME)) {
      const token = this.previous();
      return {
        type: 'Literal',
        valueType: token.type === TokenType.DATE ? 'date' : 'datetime',
        value: token.value,
      };
    }

    // Null
    if (this.match(TokenType.NULL)) {
      return {
        type: 'Literal',
        valueType: 'null',
        value: null,
      };
    }

    // Resource reference [Patient], [Observation: "code"]
    if (this.match(TokenType.LEFT_BRACKET)) {
      return this.parseResourceReference();
    }

    // Interval
    if (this.match(TokenType.INTERVAL)) {
      return this.parseInterval();
    }

    // Parenthesized expression or query
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RIGHT_PAREN);
      return expr;
    }

    // Identifier or query
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;

      // Check if this is a query (has WHERE or WITH)
      if (this.checkAny(TokenType.WHERE, TokenType.WITH, TokenType.WITHOUT)) {
        return this.parseQuery({ type: 'Identifier', name });
      }

      return { type: 'Identifier', name };
    }

    throw new Error(
      `Unexpected token: ${this.peek().value} at line ${this.peek().line}`
    );
  }

  private parseResourceReference(): ResourceReferenceNode | QueryNode {
    const resourceType = this.expect(TokenType.IDENTIFIER).value;
    let codeFilter: CqlExpressionNode | undefined;

    if (this.match(TokenType.COLON)) {
      codeFilter = this.parseExpression();
    }

    this.expect(TokenType.RIGHT_BRACKET);

    const result: ResourceReferenceNode = {
      type: 'ResourceReference',
      resourceType,
    };

    if (codeFilter) {
      result.codeFilter = codeFilter;
    }

    // Check for alias (identifier not followed by another keyword)
    let alias: string | undefined;
    if (this.check(TokenType.IDENTIFIER)) {
      // Peek ahead to see if this identifier is followed by WHERE/WITH
      alias = this.advance().value;
    }

    // Check for WHERE or WITH clause after resource reference
    if (this.checkAny(TokenType.WHERE, TokenType.WITH, TokenType.WITHOUT)) {
      const query = this.parseQuery(result);
      if (alias) {
        query.alias = alias;
      }
      return query;
    }

    return result;
  }

  private parseQuery(source: ResourceReferenceNode | IdentifierNode): QueryNode {
    const query: QueryNode = {
      type: 'Query',
      source,
    };

    // Parse WHERE clause
    if (this.match(TokenType.WHERE)) {
      query.where = this.parseExpression();
    }

    // Parse WITH/WITHOUT clauses
    query.relationships = [];
    while (this.matchAny(TokenType.WITH, TokenType.WITHOUT)) {
      const relationship = this.previous().type === TokenType.WITH ? 'with' : 'without';

      this.expect(TokenType.LEFT_BRACKET);
      const relSource = this.parseResourceReference();

      let alias: string | undefined;
      let condition: CqlExpressionNode | undefined;

      // Extract the resource reference if it's wrapped in a Query
      const sourceRef: ResourceReferenceNode = relSource.type === 'Query'
        ? (relSource.source as ResourceReferenceNode)
        : relSource;

      // Check for alias
      if (this.check(TokenType.IDENTIFIER)) {
        alias = this.advance().value;
      }

      // Parse SUCH THAT
      if (this.match(TokenType.SUCH)) {
        this.expect(TokenType.THAT);
        condition = this.parseExpression();
      }

      query.relationships.push({
        type: 'RelationshipClause',
        relationship,
        source: sourceRef,
        alias,
        condition,
      });
    }

    // Parse RETURN clause
    if (this.match(TokenType.RETURN)) {
      query.return = this.parseExpression();
    }

    return query;
  }

  private parseInterval(): IntervalNode {
    let startInclusive = true;
    let endInclusive = true;

    if (this.match(TokenType.LEFT_PAREN)) {
      startInclusive = false;
    } else {
      this.expect(TokenType.LEFT_BRACKET);
    }

    const start = this.parseExpression();
    this.expect(TokenType.COMMA);
    const end = this.parseExpression();

    if (this.match(TokenType.RIGHT_PAREN)) {
      endInclusive = false;
    } else {
      this.expect(TokenType.RIGHT_BRACKET);
    }

    return {
      type: 'Interval',
      start,
      end,
      startInclusive,
      endInclusive,
    };
  }

  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchAny(...types: TokenType[]): boolean {
    return this.match(...types);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkAny(...types: TokenType[]): boolean {
    return types.some(type => this.check(type));
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private expect(type: TokenType): Token {
    if (this.check(type)) return this.advance();

    throw new Error(
      `Expected token ${type}, but got ${this.peek().type} at line ${this.peek().line}`
    );
  }
}

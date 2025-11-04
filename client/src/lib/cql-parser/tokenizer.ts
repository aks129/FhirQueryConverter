/**
 * CQL Tokenizer - Lexical analysis
 * Converts CQL source code into tokens for parsing
 */

export enum TokenType {
  // Keywords
  LIBRARY = 'LIBRARY',
  VERSION = 'VERSION',
  USING = 'USING',
  INCLUDE = 'INCLUDE',
  CALLED = 'CALLED',
  DEFINE = 'DEFINE',
  PARAMETER = 'PARAMETER',
  WHERE = 'WHERE',
  WITH = 'WITH',
  WITHOUT = 'WITHOUT',
  SUCH = 'SUCH',
  THAT = 'THAT',
  RETURN = 'RETURN',

  // Logical operators
  AND = 'AND',
  OR = 'OR',
  XOR = 'XOR',
  NOT = 'NOT',

  // Comparison operators
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN_EQUALS = 'LESS_THAN_EQUALS',
  GREATER_THAN_EQUALS = 'GREATER_THAN_EQUALS',
  EQUIVALENT = 'EQUIVALENT',

  // Temporal keywords
  DURING = 'DURING',
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  OVERLAPS = 'OVERLAPS',
  STARTS = 'STARTS',
  ENDS = 'ENDS',
  OCCURS = 'OCCURS',

  // Other keywords
  IN = 'IN',
  CONTAINS = 'CONTAINS',
  EXISTS = 'EXISTS',
  IS = 'IS',
  NULL = 'NULL',
  AS = 'AS',
  INTERVAL = 'INTERVAL',
  OF = 'OF',
  START = 'START',
  END = 'END',

  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIME = 'TIME',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Symbols
  LEFT_BRACKET = 'LEFT_BRACKET',      // [
  RIGHT_BRACKET = 'RIGHT_BRACKET',    // ]
  LEFT_PAREN = 'LEFT_PAREN',          // (
  RIGHT_PAREN = 'RIGHT_PAREN',        // )
  LEFT_BRACE = 'LEFT_BRACE',          // {
  RIGHT_BRACE = 'RIGHT_BRACE',        // }
  COLON = 'COLON',                    // :
  COMMA = 'COMMA',                    // ,
  DOT = 'DOT',                        // .
  PLUS = 'PLUS',                      // +
  MINUS = 'MINUS',                    // -
  MULTIPLY = 'MULTIPLY',              // *
  DIVIDE = 'DIVIDE',                  // /
  AT = 'AT',                          // @

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class CqlTokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  private keywords: Map<string, TokenType> = new Map([
    ['library', TokenType.LIBRARY],
    ['version', TokenType.VERSION],
    ['using', TokenType.USING],
    ['include', TokenType.INCLUDE],
    ['called', TokenType.CALLED],
    ['define', TokenType.DEFINE],
    ['parameter', TokenType.PARAMETER],
    ['where', TokenType.WHERE],
    ['with', TokenType.WITH],
    ['without', TokenType.WITHOUT],
    ['such', TokenType.SUCH],
    ['that', TokenType.THAT],
    ['return', TokenType.RETURN],
    ['and', TokenType.AND],
    ['or', TokenType.OR],
    ['xor', TokenType.XOR],
    ['not', TokenType.NOT],
    ['in', TokenType.IN],
    ['contains', TokenType.CONTAINS],
    ['exists', TokenType.EXISTS],
    ['is', TokenType.IS],
    ['null', TokenType.NULL],
    ['as', TokenType.AS],
    ['interval', TokenType.INTERVAL],
    ['of', TokenType.OF],
    ['start', TokenType.START],
    ['end', TokenType.END],
    ['during', TokenType.DURING],
    ['before', TokenType.BEFORE],
    ['after', TokenType.AFTER],
    ['overlaps', TokenType.OVERLAPS],
    ['starts', TokenType.STARTS],
    ['ends', TokenType.ENDS],
    ['occurs', TokenType.OCCURS],
    ['true', TokenType.BOOLEAN],
    ['false', TokenType.BOOLEAN],
  ]);

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) break;

      // Skip comments
      if (this.peek() === '/' && this.peekNext() === '/') {
        this.skipLineComment();
        continue;
      }

      if (this.peek() === '/' && this.peekNext() === '*') {
        this.skipBlockComment();
        continue;
      }

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });

    return this.tokens;
  }

  private nextToken(): Token | null {
    const char = this.peek();
    const startLine = this.line;
    const startColumn = this.column;

    // Strings
    if (char === '"' || char === "'") {
      return this.readString();
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber();
    }

    // Dates and times
    if (char === '@') {
      return this.readDateTime();
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      return this.readIdentifier();
    }

    // Symbols
    return this.readSymbol();
  }

  private readString(): Token {
    const quote = this.advance();
    const startLine = this.line;
    const startColumn = this.column - 1;
    let value = '';

    while (this.position < this.input.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        value += this.advance();
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // closing quote
    }

    return {
      type: TokenType.STRING,
      value,
      line: startLine,
      column: startColumn
    };
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.isDigit(this.peek()) || this.peek() === '.') {
      value += this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value,
      line: startLine,
      column: startColumn
    };
  }

  private readDateTime(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // @
    let value = '@';

    // Read until whitespace or special char
    while (this.position < this.input.length &&
           (this.isAlphaNumeric(this.peek()) || this.peek() === '-' ||
            this.peek() === ':' || this.peek() === 'T' || this.peek() === 'Z')) {
      value += this.advance();
    }

    // Determine if it's a date, datetime, or time
    let type = TokenType.DATETIME;
    if (value.includes('T')) {
      type = TokenType.DATETIME;
    } else if (value.match(/@\d{4}-\d{2}-\d{2}$/)) {
      type = TokenType.DATE;
    } else if (value.match(/@T/)) {
      type = TokenType.TIME;
    }

    return {
      type,
      value,
      line: startLine,
      column: startColumn
    };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      value += this.advance();
    }

    const lowerValue = value.toLowerCase();
    const type = this.keywords.get(lowerValue) || TokenType.IDENTIFIER;

    return {
      type,
      value,
      line: startLine,
      column: startColumn
    };
  }

  private readSymbol(): Token {
    const char = this.advance();
    const startLine = this.line;
    const startColumn = this.column - 1;

    const symbolMap: { [key: string]: TokenType } = {
      '[': TokenType.LEFT_BRACKET,
      ']': TokenType.RIGHT_BRACKET,
      '(': TokenType.LEFT_PAREN,
      ')': TokenType.RIGHT_PAREN,
      '{': TokenType.LEFT_BRACE,
      '}': TokenType.RIGHT_BRACE,
      ':': TokenType.COLON,
      ',': TokenType.COMMA,
      '.': TokenType.DOT,
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.MULTIPLY,
      '/': TokenType.DIVIDE,
      '@': TokenType.AT,
    };

    // Multi-character operators
    if (char === '=' && this.peek() === '=') {
      this.advance();
      return { type: TokenType.EQUALS, value: '==', line: startLine, column: startColumn };
    }
    if (char === '=') {
      return { type: TokenType.EQUALS, value: '=', line: startLine, column: startColumn };
    }
    if (char === '!' && this.peek() === '=') {
      this.advance();
      return { type: TokenType.NOT_EQUALS, value: '!=', line: startLine, column: startColumn };
    }
    if (char === '<' && this.peek() === '=') {
      this.advance();
      return { type: TokenType.LESS_THAN_EQUALS, value: '<=', line: startLine, column: startColumn };
    }
    if (char === '<') {
      return { type: TokenType.LESS_THAN, value: '<', line: startLine, column: startColumn };
    }
    if (char === '>' && this.peek() === '=') {
      this.advance();
      return { type: TokenType.GREATER_THAN_EQUALS, value: '>=', line: startLine, column: startColumn };
    }
    if (char === '>') {
      return { type: TokenType.GREATER_THAN, value: '>', line: startLine, column: startColumn };
    }
    if (char === '~') {
      return { type: TokenType.EQUIVALENT, value: '~', line: startLine, column: startColumn };
    }

    const type = symbolMap[char] || TokenType.UNKNOWN;
    return { type, value: char, line: startLine, column: startColumn };
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (this.position < this.input.length && this.peek() !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance(); // /
    this.advance(); // *

    while (this.position < this.input.length - 1) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); // *
        this.advance(); // /
        break;
      }
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }
  }

  private peek(): string {
    return this.input[this.position] || '';
  }

  private peekNext(): string {
    return this.input[this.position + 1] || '';
  }

  private advance(): string {
    const char = this.input[this.position] || '';
    this.position++;
    this.column++;
    return char;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

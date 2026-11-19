import type { Diagnostic, LexResult, Token, TokenType } from './types';

interface CursorState {
  readonly source: string;
  pos: number;
  line: number;
  col: number;
}

const SINGLE_CHAR_PUNCTUATION: Readonly<Record<string, TokenType>> = {
  ':': 'COLON',
  '(': 'LPAREN',
  ')': 'RPAREN',
  ',': 'COMMA',
  '+': 'PLUS',
  '-': 'MINUS',
};

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isLowerLetter(ch: string): boolean {
  return ch >= 'a' && ch <= 'z';
}

function isUpperLetter(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z';
}

function isCommandChar(ch: string): boolean {
  return ch === 's' || ch === 'l' || ch === 'r';
}

function readNumberToken(cursor: CursorState): Token {
  const startOffset = cursor.pos;
  const startCol = cursor.col;
  while (cursor.pos < cursor.source.length && isDigit(cursor.source[cursor.pos] ?? '')) {
    cursor.pos += 1;
    cursor.col += 1;
  }
  return {
    type: 'NUMBER',
    value: cursor.source.slice(startOffset, cursor.pos),
    byteCost: 1,
    line: cursor.line,
    col: startCol,
    startOffset,
    endOffset: cursor.pos,
  };
}

function readNewlineToken(cursor: CursorState): Token {
  const startOffset = cursor.pos;
  const startCol = cursor.col;
  const startLine = cursor.line;
  if (cursor.source[cursor.pos] === '\r' && cursor.source[cursor.pos + 1] === '\n') {
    cursor.pos += 2;
  } else {
    cursor.pos += 1;
  }
  cursor.line += 1;
  cursor.col = 1;
  return {
    type: 'EOL',
    value: '\n',
    byteCost: 0,
    line: startLine,
    col: startCol,
    startOffset,
    endOffset: cursor.pos,
  };
}

function createSingleCharToken(cursor: CursorState, type: TokenType, byteCost: 0 | 1): Token {
  const ch = cursor.source[cursor.pos] ?? '';
  const token: Token = {
    type,
    value: ch,
    byteCost,
    line: cursor.line,
    col: cursor.col,
    startOffset: cursor.pos,
    endOffset: cursor.pos + 1,
  };
  cursor.pos += 1;
  cursor.col += 1;
  return token;
}

function stepToken(cursor: CursorState, tokens: Token[], diagnostics: Diagnostic[]): void {
  const ch = cursor.source[cursor.pos] ?? '';
  if (ch === ' ' || ch === '\t') {
    cursor.pos += 1;
    cursor.col += 1;
    return;
  }
  if (ch === '\r' || ch === '\n') {
    tokens.push(readNewlineToken(cursor));
    return;
  }
  if (isDigit(ch)) {
    tokens.push(readNumberToken(cursor));
    return;
  }
  stepAlphaOrSymbol(cursor, ch, tokens, diagnostics);
}

function stepAlphaOrSymbol(
  cursor: CursorState,
  ch: string,
  tokens: Token[],
  diagnostics: Diagnostic[],
): void {
  if (isLowerLetter(ch)) {
    const type: TokenType = isCommandChar(ch) ? 'COMMAND' : 'IDENT_LOWER';
    tokens.push(createSingleCharToken(cursor, type, 1));
    return;
  }
  if (isUpperLetter(ch)) {
    tokens.push(createSingleCharToken(cursor, 'IDENT_UPPER', 1));
    return;
  }
  const punctType = SINGLE_CHAR_PUNCTUATION[ch];
  if (punctType !== undefined) {
    tokens.push(createSingleCharToken(cursor, punctType, 0));
    return;
  }
  diagnostics.push({
    message: `Unexpected character '${ch}'`,
    line: cursor.line,
    col: cursor.col,
    startOffset: cursor.pos,
    endOffset: cursor.pos + 1,
  });
  cursor.pos += 1;
  cursor.col += 1;
}

/**
 * Tokenizes H source code and calculates the official token-based byte count.
 */
export function tokenize(source: string): LexResult {
  const cursor: CursorState = { source, pos: 0, line: 1, col: 1 };
  const tokens: Token[] = [];
  const diagnostics: Diagnostic[] = [];

  while (cursor.pos < cursor.source.length) {
    stepToken(cursor, tokens, diagnostics);
  }

  let byteCount = 0;
  for (const token of tokens) {
    byteCount += token.byteCost;
  }

  return { tokens, byteCount, diagnostics };
}

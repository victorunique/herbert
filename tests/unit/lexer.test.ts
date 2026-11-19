import { describe, expect, it } from 'vitest';
import { tokenize } from '../../src/core/lexer';

describe('H Language Lexer & Official Byte Counter', () => {
  it('tokenizes primitive commands s, l, r as 1-byte COMMAND tokens', () => {
    const result = tokenize('slrs');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.byteCount).toBe(4);
    expect(result.tokens.map((t) => ({ type: t.type, value: t.value, cost: t.byteCost }))).toEqual([
      { type: 'COMMAND', value: 's', cost: 1 },
      { type: 'COMMAND', value: 'l', cost: 1 },
      { type: 'COMMAND', value: 'r', cost: 1 },
      { type: 'COMMAND', value: 's', cost: 1 },
    ]);
  });

  it('counts letters and contiguous multi-digit numbers as 1 byte, and punctuation/operators/whitespace as 0 bytes', () => {
    const code = 'a(X):sa(X-1)\na(15)';
    const result = tokenize(code);
    expect(result.diagnostics).toHaveLength(0);
    // Line 1: a(1) + X(1) + s(1) + a(1) + X(1) + 1(1) = 6 bytes
    // Line 2: a(1) + 15(1) = 2 bytes
    // Total = 8 bytes
    expect(result.byteCount).toBe(8);

    const nonEolTokens = result.tokens.filter((t) => t.type !== 'EOL');
    expect(nonEolTokens.map((t) => [t.type, t.value, t.byteCost])).toEqual([
      ['IDENT_LOWER', 'a', 1],
      ['LPAREN', '(', 0],
      ['IDENT_UPPER', 'X', 1],
      ['RPAREN', ')', 0],
      ['COLON', ':', 0],
      ['COMMAND', 's', 1],
      ['IDENT_LOWER', 'a', 1],
      ['LPAREN', '(', 0],
      ['IDENT_UPPER', 'X', 1],
      ['MINUS', '-', 0],
      ['NUMBER', '1', 1],
      ['RPAREN', ')', 0],
      ['IDENT_LOWER', 'a', 1],
      ['LPAREN', '(', 0],
      ['NUMBER', '15', 1],
      ['RPAREN', ')', 0],
    ]);
  });

  it('computes 16 bytes for the classic two-procedure spiral program', () => {
    const spiral = 'a(X):sa(X-1)\nb(X):a(X)rb(X+1)\nb(1)';
    const result = tokenize(spiral);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.byteCount).toBe(16);
  });

  it('tracks accurate 1-based line, column, and character offsets across multiple lines and CRLF', () => {
    const result = tokenize('a:s\r\n a');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.byteCount).toBe(3);
    const lastToken = result.tokens[result.tokens.length - 1];
    expect(lastToken).toEqual({
      type: 'IDENT_LOWER',
      value: 'a',
      byteCost: 1,
      line: 2,
      col: 2,
      startOffset: 6,
      endOffset: 7,
    });
  });

  it('handles commas and plus operators with 0 byte cost', () => {
    const result = tokenize('f(A,B):sf(A+100,B-255)\nf(1,2)');
    expect(result.diagnostics).toHaveLength(0);
    // f(1)+A(1)+B(1)+s(1)+f(1)+A(1)+100(1)+B(1)+255(1) = 9
    // f(1)+1(1)+2(1) = 3 -> total 12
    expect(result.byteCount).toBe(12);
  });

  it('reports diagnostics with exact positions for illegal characters while continuing tokenization', () => {
    const result = tokenize('s@l;r');
    expect(result.byteCount).toBe(3);
    expect(result.diagnostics).toEqual([
      {
        message: "Unexpected character '@'",
        line: 1,
        col: 2,
        startOffset: 1,
        endOffset: 2,
      },
      {
        message: "Unexpected character ';'",
        line: 1,
        col: 4,
        startOffset: 3,
        endOffset: 4,
      },
    ]);
  });
});

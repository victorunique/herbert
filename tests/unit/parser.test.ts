import { describe, expect, it } from 'vitest';
import { parseProgram } from '../../src/core/parser';

describe('H Language Parser & Static Semantic Validator', () => {
  it('parses a simple main statement sequence without procedures', () => {
    const res = parseProgram('sslr');
    expect(res.diagnostics).toHaveLength(0);
    expect(res.byteCount).toBe(4);
    expect(res.ast).not.toBeNull();
    expect(res.ast?.main).toHaveLength(4);
  });

  it('parses parameterless and parameterized recursive procedures including unary + and -', () => {
    const code = 'a(X):sa(X-1)\nb(X,Y):a(+X)rb(X+1,-Y+1)\nb(+1,-4)';
    const res = parseProgram(code);
    expect(res.diagnostics).toHaveLength(0);
    expect(res.ast).not.toBeNull();
    expect(Object.keys(res.ast?.procedures ?? {})).toEqual(['a', 'b']);
    expect(res.ast?.procedures['a']?.params).toEqual(['X']);
    expect(res.ast?.procedures['b']?.params).toEqual(['X', 'Y']);
  });

  it('parses higher-order command sequence arguments and multi-parameter references', () => {
    const code = 'a(X,Y):XY\nb(X):a(X,Xs)\nb(sl)';
    const res = parseProgram(code);
    expect(res.diagnostics).toHaveLength(0);
    expect(res.ast).not.toBeNull();
  });

  it('rejects empty or whitespace-only programs with exact location', () => {
    const res = parseProgram('   \n  ');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]).toEqual({
      message: 'Empty program: missing main execution statement',
      line: 1,
      col: 4,
      startOffset: 3,
      endOffset: 4,
    });

    const completelyEmpty = parseProgram('');
    expect(completelyEmpty.diagnostics[0]).toEqual({
      message: 'Empty program: missing main execution statement',
      line: 1,
      col: 1,
      startOffset: 0,
      endOffset: 0,
    });
  });

  it('rejects defining reserved commands s, l, or r as procedure names', () => {
    const res = parseProgram('s:lr\ns');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe(
      "Reserved command 's' cannot be used as a procedure name",
    );
  });

  it('rejects duplicate procedure definitions', () => {
    const res = parseProgram('a:s\na:l\na');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe("Duplicate procedure definition 'a'");
  });

  it('rejects duplicate or invalid parameter names in a procedure header', () => {
    const res = parseProgram('a(X,X):s\na(1,2)');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe("Duplicate parameter 'X' in procedure definition");

    const badParam = parseProgram('a(1):s\na(1)');
    expect(badParam.ast).toBeNull();
    expect(badParam.diagnostics[0]?.message).toBe('Expected uppercase parameter name');
  });

  it('rejects undeclared parameter references in body, param_ref arg, and numeric expression arg', () => {
    const resBody = parseProgram('a(X):sY\na(1)');
    expect(resBody.diagnostics[0]?.message).toBe("Undeclared parameter 'Y'");

    const resMain = parseProgram('sX');
    expect(resMain.diagnostics[0]?.message).toBe("Undeclared parameter 'X'");

    const resParamRef = parseProgram('a(X):s\nb(X):a(Y)\nb(1)');
    expect(resParamRef.diagnostics[0]?.message).toBe("Undeclared parameter 'Y'");

    const resNumExpr = parseProgram('a(X):s\nb(X):a(Y-1)\nb(1)');
    expect(resNumExpr.diagnostics[0]?.message).toBe("Undeclared parameter 'Y'");
  });

  it('rejects calls to undefined procedures', () => {
    const res = parseProgram('a:s\nb');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe("Undefined procedure 'b'");
  });

  it('rejects procedure call arity mismatches', () => {
    const tooFew = parseProgram('a(X,Y):s\na(1)');
    expect(tooFew.diagnostics[0]?.message).toBe("Procedure 'a' expects 2 arguments, but got 1");

    const unexpectedArgs = parseProgram('a:s\na(1)');
    expect(unexpectedArgs.diagnostics[0]?.message).toBe(
      "Procedure 'a' expects 0 arguments, but got 1",
    );

    const missingArgs = parseProgram('a(X):s\na');
    expect(missingArgs.diagnostics[0]?.message).toBe(
      "Procedure 'a' expects 1 argument, but got 0",
    );
  });

  it('rejects procedure definitions or statements appearing after the main execution line', () => {
    const res = parseProgram('s\na:l');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe(
      'Unexpected statements or procedure definitions after main execution line',
    );
  });

  it('rejects static type mismatch when passing command sequence directly or nested to arithmetic parameter', () => {
    const res = parseProgram('a(X):sa(X-1)\na(sr)');
    expect(res.ast).toBeNull();
    expect(res.diagnostics[0]?.message).toBe(
      "Parameter 1 of 'a' is used in a numeric expression and cannot accept a command sequence",
    );

    const nested = parseProgram('b(Y):YY\na(X):b(a(X-1))\na(sr)');
    expect(nested.ast).toBeNull();
    expect(nested.diagnostics[0]?.message).toBe(
      "Parameter 1 of 'a' is used in a numeric expression and cannot accept a command sequence",
    );
  });

  it('reports syntax errors for unclosed parens, empty arg list, trailing comma, or invalid expressions', () => {
    const unclosed = parseProgram('a(X):sa(X-1\na(3)');
    expect(unclosed.diagnostics.some((d) => d.message === "Expected ')' after arguments")).toBe(
      true,
    );

    const emptyArgs = parseProgram('a(X):s\na()');
    expect(emptyArgs.diagnostics.some((d) => d.message === 'Empty argument list is not allowed')).toBe(
      true,
    );

    const trailingComma = parseProgram('a(X,Y):s\na(1,)');
    expect(
      trailingComma.diagnostics.some((d) => d.message === 'Trailing comma in argument list'),
    ).toBe(true);

    const badExpr = parseProgram('a(X):s\na(1+)');
    expect(
      badExpr.diagnostics.some((d) =>
        /Expected number or parameter in expression/i.test(d.message),
      ),
    ).toBe(true);

    const unexpectedTok = parseProgram('s:l');
    expect(unexpectedTok.diagnostics.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { parseProgram } from '../../src/core/parser';
import { createInterpreterGenerator, runProgramToSteps } from '../../src/core/interpreter';

function executeCommands(code: string, maxSteps = 50): string {
  const parsed = parseProgram(code);
  expect(parsed.diagnostics).toHaveLength(0);
  expect(parsed.ast).not.toBeNull();
  const events = runProgramToSteps(parsed.ast!, { maxSteps });
  return events.map((e) => e.command).join('');
}

describe('H Language Interpreter, Lexical Closures & Call Stack', () => {
  it('executes basic primitive commands in order', () => {
    expect(executeCommands('sslrs')).toBe('sslrs');
  });

  it('executes parameterless procedures and endless tail recursion up to maxSteps', () => {
    expect(executeCommands('a:ssl\naa')).toBe('sslssl');
    expect(executeCommands('a:sra\na', 7)).toBe('srsrsrs');
  });

  it('executes numeric countdown recursion and records skipped <= 0 base case details', () => {
    const parsed = parseProgram('a(X):sa(X-1)\na(2)');
    const events = runProgramToSteps(parsed.ast!);
    expect(events.map((e) => e.command).join('')).toBe('ss');
    expect(events[0]?.skippedCalls).toEqual([]);

    // Run a procedure where a skipped call happens BEFORE a subsequent command
    const parsed2 = parseProgram('a(X):sa(X-1)\nb:a(1)s\nb');
    const events2 = runProgramToSteps(parsed2.ast!);
    expect(events2.map((e) => e.command).join('')).toBe('ss');
    expect(events2[1]?.skippedCalls).toEqual([
      {
        procName: 'a',
        argsSummary: '0',
        reason: 'Numeric argument <= 0',
        line: 1,
        col: 7,
      },
    ]);

    const gen = createInterpreterGenerator(parsed.ast!);
    expect(Array.from(gen)).toHaveLength(2);
  });

  it('skips procedure call if ANY numeric argument is <= 0 (first, middle, or last) and formats multi-arg summary', () => {
    expect(executeCommands('f(A,B):sf(A-1,B-2)\nf(5,3)')).toBe('ss');
    expect(executeCommands('f(A,B):sf(A-2,B-1)\nf(3,5)')).toBe('ss');
    expect(executeCommands('f(A,X):Af(A,X-1)\nf(sr,0)')).toBe('');

    const parsed = parseProgram('f(A,B):sf(A-1,B-2)\ng:f(2,0)s\ng');
    const events = runProgramToSteps(parsed.ast!);
    expect(events[0]?.skippedCalls[0]?.argsSummary).toBe('2,0');
  });

  it('treats a numeric parameter used directly as a body statement as a no-op', () => {
    expect(executeCommands('a(X):sXa(X-1)\na(3)')).toBe('sss');
  });

  it('expands higher-order command sequence doublers accurately', () => {
    expect(executeCommands('a(X):XX\na(a(a(s)))')).toBe('ssssssss');
  });

  it('supports dynamic command sequence growth and formats sequence labels in call stack', () => {
    const parsed = parseProgram('a(X):Xra(Xs)\na(s)');
    const events = runProgramToSteps(parsed.ast!, { maxSteps: 5 });
    expect(events.map((e) => e.command).join('')).toBe('srssr');
    expect(events[0]?.callStack[0]?.params['X']).toBe('s');
    expect(events[2]?.callStack[1]?.params['X']).toBe('ss');
  });

  it('supports alternating polymorphic command sequence parameters (a(X,Y):Xa(Y,X))', () => {
    expect(executeCommands('a(X,Y):Xa(Y,X)\na(sl,sr)', 8)).toBe('slsrslsr');
  });

  it('preserves lexical scope and formats proc_call labels inside command sequence arguments', () => {
    const code = 'a(X):XX\nb(X):a(b(X-1)r)\nb(2)';
    const parsed = parseProgram(code);
    const events = runProgramToSteps(parsed.ast!, { maxSteps: 20 });
    expect(events.map((e) => e.command).join('')).toBe('rrrrrr');
    // Inside a(b(X-1)r), the sequence label includes 'b' and 'r'
    expect(events[0]?.callStack.some((f) => f.params['X'] === 'br')).toBe(true);
  });

  it('exposes accurate call stack frames with bound parameter values at each step', () => {
    const parsed = parseProgram('a(X):sa(X-1)\nb(Y):a(Y)\nb(2)');
    const events = runProgramToSteps(parsed.ast!);
    expect(events).toHaveLength(2);
    expect(events[0]?.callStack.map((f) => `${f.procName}(${JSON.stringify(f.params)})`)).toEqual([
      'b({"Y":"2"})',
      'a({"X":"2"})',
    ]);
    expect(events[1]?.callStack.map((f) => `${f.procName}(${JSON.stringify(f.params)})`)).toEqual([
      'b({"Y":"2"})',
      'a({"X":"2"})',
      'a({"X":"1"})',
    ]);
  });

  it('allows exact boundary integers +255 and -255, and throws on +256 or -256 overflow', () => {
    expect(executeCommands('a(X):s\na(255)')).toBe('s');
    expect(executeCommands('a(X):s\na(-255)')).toBe('');

    const overMax = parseProgram('a(X):s\na(256)');
    expect(() => runProgramToSteps(overMax.ast!)).toThrow(/overflow/i);

    const underMin = parseProgram('a(X):s\na(-256)');
    expect(() => runProgramToSteps(underMin.ast!)).toThrow(/overflow/i);
  });

  it('throws a RuntimeError when recursion exceeds maxStackDepth at exact boundary', () => {
    const parsed = parseProgram('a:aa\na');
    expect(() => runProgramToSteps(parsed.ast!, { maxStackDepth: 5 })).toThrow(
      /Maximum call stack depth \(5\) exceeded/,
    );

    // Depth 2 succeeds for a->b->s when maxStackDepth is 3
    const validDepth = parseProgram('b:s\na:b\na');
    expect(runProgramToSteps(validDepth.ast!, { maxStackDepth: 3 })).toHaveLength(1);
  });
});

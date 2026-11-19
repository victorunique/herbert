import type {
  ArgumentNode,
  BoundValue,
  CallStackFrame,
  InterpreterOptions,
  InterpreterStepEvent,
  NumExprNode,
  NumTermNode,
  ProgramAST,
  SkippedCallEvent,
  StatementNode,
} from './types';

interface RuntimeFrame {
  readonly statements: readonly StatementNode[];
  index: number;
  readonly env: Readonly<Record<string, BoundValue>>;
  readonly procFrame: CallStackFrame | null;
}

interface ResolvedConfig {
  readonly maxSteps: number;
  readonly maxStackDepth: number;
  readonly minInt: number;
  readonly maxInt: number;
}

function resolveConfig(options?: InterpreterOptions): ResolvedConfig {
  const maxSteps = options?.maxSteps ?? 10000;
  return {
    maxSteps,
    maxStackDepth: options?.maxStackDepth ?? Math.max(1024, maxSteps + 16),
    minInt: options?.minInt ?? -255,
    maxInt: options?.maxInt ?? 255,
  };
}

function evaluateTerm(term: NumTermNode, env: Readonly<Record<string, BoundValue>>): number {
  if (term.kind === 'number') {
    return term.sign * term.value;
  }
  const bound = env[term.name];
  if (!bound || bound.kind !== 'num') {
    throw new Error(`Runtime type error: parameter '${term.name}' is not a number`);
  }
  return term.sign * bound.value;
}

function evaluateNumExpr(
  expr: NumExprNode,
  env: Readonly<Record<string, BoundValue>>,
  cfg: ResolvedConfig,
): number {
  let total = 0;
  for (const item of expr.terms) {
    const val = evaluateTerm(item.term, env);
    total = item.op === '-' ? total - val : total + val;
  }
  if (total < cfg.minInt || total > cfg.maxInt) {
    throw new Error(`Numeric overflow: value ${total} is outside allowed range [${cfg.minInt}, ${cfg.maxInt}]`);
  }
  return total;
}

function formatSeqLabel(
  stmts: readonly StatementNode[],
  env: Readonly<Record<string, BoundValue>>,
): string {
  return stmts
    .map((s) => {
      if (s.kind === 'primitive') return s.command;
      if (s.kind === 'param_stmt') {
        const b = env[s.name];
        return b ? (b.kind === 'num' ? String(b.value) : b.label) : s.name;
      }
      return s.name;
    })
    .join('');
}

function evaluateArgument(
  arg: ArgumentNode,
  env: Readonly<Record<string, BoundValue>>,
  cfg: ResolvedConfig,
): BoundValue {
  if (arg.kind === 'num_expr') {
    return { kind: 'num', value: evaluateNumExpr(arg, env, cfg) };
  }
  if (arg.kind === 'param_ref') {
    const existing = env[arg.name];
    if (!existing) {
      throw new Error(`Unbound parameter '${arg.name}'`);
    }
    return existing;
  }
  return {
    kind: 'seq',
    label: formatSeqLabel(arg.statements, env),
    statements: arg.statements,
    env,
  };
}

function hasNonPositiveNumericArg(values: readonly BoundValue[]): boolean {
  for (const val of values) {
    if (val.kind === 'num' && val.value <= 0) {
      return true;
    }
  }
  return false;
}

function formatBoundValue(val: BoundValue): string {
  return val.kind === 'num' ? String(val.value) : val.label;
}

function createProcRuntimeFrame(
  def: ProgramAST['procedures'][string],
  evaluatedArgs: readonly BoundValue[],
  callLine: number,
  callCol: number,
): RuntimeFrame {
  const newEnv: Record<string, BoundValue> = {};
  const displayParams: Record<string, string> = {};
  def.params.forEach((paramName, idx) => {
    const val = evaluatedArgs[idx]!;
    newEnv[paramName] = val;
    displayParams[paramName] = formatBoundValue(val);
  });
  return {
    statements: def.body,
    index: 0,
    env: newEnv,
    procFrame: { procName: def.name, params: displayParams, callLine, callCol },
  };
}

function buildCallFrame(
  stmt: Extract<StatementNode, { kind: 'proc_call' }>,
  ast: ProgramAST,
  callerEnv: Readonly<Record<string, BoundValue>>,
  cfg: ResolvedConfig,
  skippedCalls: SkippedCallEvent[],
): RuntimeFrame | null {
  const def = ast.procedures[stmt.name];
  if (!def) {
    throw new Error(`Undefined procedure '${stmt.name}'`);
  }
  const evaluatedArgs = stmt.args.map((arg) => evaluateArgument(arg, callerEnv, cfg));
  if (hasNonPositiveNumericArg(evaluatedArgs)) {
    skippedCalls.push({
      procName: stmt.name,
      argsSummary: evaluatedArgs.map(formatBoundValue).join(','),
      reason: 'Numeric argument <= 0',
      line: stmt.token.line,
      col: stmt.token.col,
    });
    return null;
  }
  return createProcRuntimeFrame(def, evaluatedArgs, stmt.token.line, stmt.token.col);
}

function extractCallStack(stack: readonly RuntimeFrame[]): CallStackFrame[] {
  const result: CallStackFrame[] = [];
  for (const frame of stack) {
    if (frame.procFrame) {
      result.push(frame.procFrame);
    }
  }
  return result;
}

function stepRuntimeFrame(
  stmt: StatementNode,
  topFrame: RuntimeFrame,
  stack: RuntimeFrame[],
  ast: ProgramAST,
  cfg: ResolvedConfig,
  skippedCalls: SkippedCallEvent[],
): InterpreterStepEvent | null {
  if (stmt.kind === 'primitive') {
    return {
      command: stmt.command,
      token: stmt.token,
      callStack: extractCallStack(stack),
      skippedCalls: [...skippedCalls],
    };
  }
  if (stmt.kind === 'param_stmt') {
    const bound = topFrame.env[stmt.name];
    if (bound && bound.kind === 'seq') {
      stack.push({ statements: bound.statements, index: 0, env: bound.env, procFrame: null });
    }
    return null;
  }
  const nextFrame = buildCallFrame(stmt, ast, topFrame.env, cfg, skippedCalls);
  if (nextFrame) {
    stack.push(nextFrame);
  }
  return null;
}

/**
 * Creates a lazy generator yielding primitive movement steps and live call stack snapshots.
 */
export function* createInterpreterGenerator(
  ast: ProgramAST,
  options?: InterpreterOptions,
): Generator<InterpreterStepEvent, void, unknown> {
  const cfg = resolveConfig(options);
  const stack: RuntimeFrame[] = [{ statements: ast.main, index: 0, env: {}, procFrame: null }];
  const skippedCalls: SkippedCallEvent[] = [];
  let emittedSteps = 0;

  while (stack.length > 0 && emittedSteps < cfg.maxSteps) {
    if (stack.length > cfg.maxStackDepth) {
      throw new Error(`Maximum call stack depth (${cfg.maxStackDepth}) exceeded`);
    }
    const top = stack[stack.length - 1]!;
    if (top.index >= top.statements.length) {
      stack.pop();
      continue;
    }
    const stmt = top.statements[top.index]!;
    top.index += 1;
    const event = stepRuntimeFrame(stmt, top, stack, ast, cfg, skippedCalls);
    if (event) {
      emittedSteps += 1;
      yield event;
    }
  }
}

/**
 * Executes an AST up to maxSteps and returns the array of step events.
 */
export function runProgramToSteps(
  ast: ProgramAST,
  options?: InterpreterOptions,
): InterpreterStepEvent[] {
  return Array.from(createInterpreterGenerator(ast, options));
}

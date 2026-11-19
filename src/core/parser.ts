import { tokenize } from './lexer';
import type {
  ArgumentNode,
  Diagnostic,
  NumExprNode,
  NumTermNode,
  ParseResult,
  PrimitiveCommand,
  ProcedureDef,
  ProgramAST,
  StatementNode,
  Token,
  TokenType,
} from './types';

interface TokenStream {
  readonly tokens: readonly Token[];
  pos: number;
  readonly diagnostics: Diagnostic[];
}

const DEFAULT_LOCATION = { line: 1, col: 1, startOffset: 0, endOffset: 0 };

function peek(stream: TokenStream, offset = 0): Token | undefined {
  return stream.tokens[stream.pos + offset];
}

function consume(stream: TokenStream): Token | undefined {
  const tok = stream.tokens[stream.pos];
  stream.pos += 1;
  return tok;
}

function addError(stream: TokenStream, message: string, token?: Token): void {
  const target = token ?? stream.tokens[stream.tokens.length - 1] ?? DEFAULT_LOCATION;
  stream.diagnostics.push({
    message,
    line: target.line,
    col: target.col,
    startOffset: target.startOffset,
    endOffset: target.endOffset,
  });
}

function skipEols(stream: TokenStream): void {
  while (peek(stream)?.type === 'EOL') {
    consume(stream);
  }
}

function findHeaderParenEnd(stream: TokenStream, startIdx: number): number {
  let idx = startIdx;
  while (true) {
    const tok = peek(stream, idx);
    if (!tok || tok.type === 'RPAREN' || tok.type === 'EOL') break;
    idx += 1;
  }
  return peek(stream, idx)?.type === 'RPAREN' ? idx + 1 : idx;
}

function isProcedureHeaderStart(stream: TokenStream): boolean {
  const first = peek(stream);
  if (!first) return false;
  if (first.type !== 'IDENT_LOWER' && first.type !== 'COMMAND') return false;
  const afterParamsIdx = peek(stream, 1)?.type === 'LPAREN' ? findHeaderParenEnd(stream, 1) : 1;
  return peek(stream, afterParamsIdx)?.type === 'COLON';
}

function readParamTokens(stream: TokenStream, params: string[]): void {
  while (peek(stream) && peek(stream)?.type !== 'RPAREN') {
    const paramTok = consume(stream);
    if (!paramTok || paramTok.type !== 'IDENT_UPPER') {
      addError(stream, 'Expected uppercase parameter name', paramTok);
      break;
    }
    if (params.includes(paramTok.value)) {
      addError(stream, `Duplicate parameter '${paramTok.value}' in procedure definition`, paramTok);
    }
    params.push(paramTok.value);
    if (peek(stream)?.type === 'COMMA') consume(stream);
    else break;
  }
}

function parseParamList(stream: TokenStream): string[] {
  const params: string[] = [];
  if (peek(stream)?.type !== 'LPAREN') return params;
  consume(stream);
  readParamTokens(stream, params);
  if (peek(stream)?.type === 'RPAREN') consume(stream);
  else addError(stream, "Expected ')' after parameter list", peek(stream));
  return params;
}

function parseProcedureDef(stream: TokenStream): ProcedureDef | null {
  const nameTok = consume(stream);
  if (!nameTok) return null;
  if (nameTok.type === 'COMMAND') {
    addError(stream, `Reserved command '${nameTok.value}' cannot be used as a procedure name`, nameTok);
  }
  const params = parseParamList(stream);
  if (peek(stream)?.type === 'COLON') {
    consume(stream);
  } else {
    addError(stream, "Expected ':' in procedure definition", peek(stream));
  }
  const body = parseStatementSequence(stream, ['EOL']);
  return { name: nameTok.value, params, body, token: nameTok };
}

function readOptionalSign(stream: TokenStream): 1 | -1 {
  const first = peek(stream);
  if (first?.type === 'PLUS' || first?.type === 'MINUS') {
    consume(stream);
    return first.type === 'MINUS' ? -1 : 1;
  }
  return 1;
}

function parseNumTerm(stream: TokenStream): NumTermNode | null {
  const sign = readOptionalSign(stream);
  const tok = consume(stream);
  if (!tok) {
    addError(stream, 'Expected number or parameter in arithmetic expression');
    return null;
  }
  if (tok.type === 'NUMBER') {
    return { kind: 'number', value: Number.parseInt(tok.value, 10), sign, token: tok };
  }
  if (tok.type === 'IDENT_UPPER') {
    return { kind: 'param', name: tok.value, sign, token: tok };
  }
  addError(stream, `Expected number or parameter in expression, got '${tok.value}'`, tok);
  return null;
}

function parseNumericExpression(stream: TokenStream, startToken: Token): NumExprNode {
  const terms: { op: '+' | '-'; term: NumTermNode }[] = [];
  const firstTerm = parseNumTerm(stream);
  if (firstTerm) {
    terms.push({ op: '+', term: firstTerm });
  }
  while (peek(stream)?.type === 'PLUS' || peek(stream)?.type === 'MINUS') {
    const opTok = consume(stream);
    const op: '+' | '-' = opTok?.type === 'MINUS' ? '-' : '+';
    const nextTerm = parseNumTerm(stream);
    if (nextTerm) {
      terms.push({ op, term: nextTerm });
    }
  }
  return { kind: 'num_expr', terms, token: startToken };
}

function isNumericArgStart(stream: TokenStream): boolean {
  const first = peek(stream);
  if (!first) return false;
  if (first.type === 'NUMBER' || first.type === 'PLUS' || first.type === 'MINUS') {
    return true;
  }
  if (first.type === 'IDENT_UPPER') {
    const second = peek(stream, 1);
    return second?.type === 'PLUS' || second?.type === 'MINUS';
  }
  return false;
}

function parseSingleArg(stream: TokenStream): ArgumentNode | null {
  const first = peek(stream);
  if (!first) return null;
  if (isNumericArgStart(stream)) {
    return parseNumericExpression(stream, first);
  }
  if (first.type === 'IDENT_UPPER') {
    const second = peek(stream, 1);
    if (second?.type === 'COMMA' || second?.type === 'RPAREN') {
      consume(stream);
      return { kind: 'param_ref', name: first.value, token: first };
    }
  }
  const statements = parseStatementSequence(stream, ['COMMA', 'RPAREN', 'EOL']);
  if (statements.length === 0) {
    addError(stream, 'Expected argument in procedure call', first);
    return null;
  }
  return { kind: 'cmd_seq', statements, token: first };
}

function isEndOfArgList(tok: Token | undefined): boolean {
  return !tok || tok.type === 'RPAREN' || tok.type === 'EOL';
}

function readArgListItems(stream: TokenStream, args: ArgumentNode[]): void {
  while (!isEndOfArgList(peek(stream))) {
    const arg = parseSingleArg(stream);
    if (arg) args.push(arg);
    if (peek(stream)?.type !== 'COMMA') break;
    consume(stream);
    if (peek(stream)?.type === 'RPAREN') {
      addError(stream, 'Trailing comma in argument list', peek(stream));
    }
  }
}

function parseCallArgs(stream: TokenStream): ArgumentNode[] {
  const args: ArgumentNode[] = [];
  if (peek(stream)?.type !== 'LPAREN') return args;
  const openTok = consume(stream);
  if (peek(stream)?.type === 'RPAREN') {
    addError(stream, 'Empty argument list is not allowed', openTok);
    consume(stream);
    return args;
  }
  readArgListItems(stream, args);
  if (peek(stream)?.type === 'RPAREN') consume(stream);
  else addError(stream, "Expected ')' after arguments", openTok);
  return args;
}

function parseStatementSequence(stream: TokenStream, stopTypes: readonly TokenType[]): StatementNode[] {
  const stmts: StatementNode[] = [];
  while (peek(stream) && !stopTypes.includes(peek(stream)!.type)) {
    const tok = peek(stream)!;
    if (tok.type === 'COMMAND') {
      consume(stream);
      stmts.push({ kind: 'primitive', command: tok.value as PrimitiveCommand, token: tok });
    } else if (tok.type === 'IDENT_UPPER') {
      consume(stream);
      stmts.push({ kind: 'param_stmt', name: tok.value, token: tok });
    } else if (tok.type === 'IDENT_LOWER') {
      consume(stream);
      const args = parseCallArgs(stream);
      stmts.push({ kind: 'proc_call', name: tok.value, args, token: tok });
    } else {
      addError(stream, `Unexpected token '${tok.value}' in statement`, tok);
      consume(stream);
    }
  }
  return stmts;
}

function collectProcNumericParams(proc: ProcedureDef): Set<number> {
  const set = new Set<number>();
  const visitStmt = (stmt: StatementNode): void => {
    if (stmt.kind !== 'proc_call') return;
    for (const arg of stmt.args) {
      if (arg.kind === 'num_expr') {
        for (const t of arg.terms) {
          if (t.term.kind === 'param') {
            const idx = proc.params.indexOf(t.term.name);
            if (idx !== -1) set.add(idx);
          }
        }
      } else if (arg.kind === 'cmd_seq') {
        arg.statements.forEach(visitStmt);
      }
    }
  };
  proc.body.forEach(visitStmt);
  return set;
}

function findNumericParams(procedures: Readonly<Record<string, ProcedureDef>>): Readonly<Record<string, Set<number>>> {
  const numericIndices: Record<string, Set<number>> = {};
  for (const proc of Object.values(procedures)) {
    numericIndices[proc.name] = collectProcNumericParams(proc);
  }
  return numericIndices;
}

function validateCallNode(
  stmt: Extract<StatementNode, { kind: 'proc_call' }>,
  allowedParams: ReadonlySet<string>,
  procedures: Readonly<Record<string, ProcedureDef>>,
  numericParams: Readonly<Record<string, Set<number>>>,
  stream: TokenStream,
): void {
  const target = procedures[stmt.name];
  if (!target) {
    addError(stream, `Undefined procedure '${stmt.name}'`, stmt.token);
  } else if (stmt.args.length !== target.params.length) {
    const word = target.params.length === 1 ? 'argument' : 'arguments';
    addError(
      stream,
      `Procedure '${stmt.name}' expects ${target.params.length} ${word}, but got ${stmt.args.length}`,
      stmt.token,
    );
  }
  stmt.args.forEach((arg, idx) => {
    validateArgNode(arg, idx, stmt.name, allowedParams, procedures, numericParams, stream);
  });
}

function validateNumExprParams(
  arg: NumExprNode,
  allowedParams: ReadonlySet<string>,
  stream: TokenStream,
): void {
  for (const item of arg.terms) {
    if (item.term.kind === 'param' && !allowedParams.has(item.term.name)) {
      addError(stream, `Undeclared parameter '${item.term.name}'`, item.term.token);
    }
  }
}

function validateArgNode(
  arg: ArgumentNode,
  argIndex: number,
  calleeName: string,
  allowedParams: ReadonlySet<string>,
  procedures: Readonly<Record<string, ProcedureDef>>,
  numericParams: Readonly<Record<string, Set<number>>>,
  stream: TokenStream,
): void {
  if (arg.kind === 'param_ref') {
    if (!allowedParams.has(arg.name)) {
      addError(stream, `Undeclared parameter '${arg.name}'`, arg.token);
    }
    return;
  }
  if (arg.kind === 'num_expr') {
    validateNumExprParams(arg, allowedParams, stream);
    return;
  }
  if (numericParams[calleeName]?.has(argIndex)) {
    addError(
      stream,
      `Parameter ${argIndex + 1} of '${calleeName}' is used in a numeric expression and cannot accept a command sequence`,
      arg.token,
    );
  }
  validateStatements(arg.statements, allowedParams, procedures, numericParams, stream);
}

function validateStatements(
  stmts: readonly StatementNode[],
  allowedParams: ReadonlySet<string>,
  procedures: Readonly<Record<string, ProcedureDef>>,
  numericParams: Readonly<Record<string, Set<number>>>,
  stream: TokenStream,
): void {
  for (const stmt of stmts) {
    if (stmt.kind === 'param_stmt' && !allowedParams.has(stmt.name)) {
      addError(stream, `Undeclared parameter '${stmt.name}'`, stmt.token);
    } else if (stmt.kind === 'proc_call') {
      validateCallNode(stmt, allowedParams, procedures, numericParams, stream);
    }
  }
}

function runStaticValidation(
  procedures: Readonly<Record<string, ProcedureDef>>,
  main: readonly StatementNode[],
  stream: TokenStream,
): void {
  const numericParams = findNumericParams(procedures);
  for (const proc of Object.values(procedures)) {
    validateStatements(proc.body, new Set(proc.params), procedures, numericParams, stream);
  }
  validateStatements(main, new Set(), procedures, numericParams, stream);
}

function parseAllProcedures(stream: TokenStream): Record<string, ProcedureDef> {
  const procedures: Record<string, ProcedureDef> = {};
  skipEols(stream);
  while (isProcedureHeaderStart(stream)) {
    const def = parseProcedureDef(stream);
    if (def) {
      if (procedures[def.name]) {
        addError(stream, `Duplicate procedure definition '${def.name}'`, def.token);
      } else {
        procedures[def.name] = def;
      }
    }
    skipEols(stream);
  }
  return procedures;
}

/**
 * Parses H language source into an immutable ProgramAST and performs static semantic validation.
 */
export function parseProgram(source: string): ParseResult {
  const lexResult = tokenize(source);
  const stream: TokenStream = {
    tokens: lexResult.tokens,
    pos: 0,
    diagnostics: [...lexResult.diagnostics],
  };
  const procedures = parseAllProcedures(stream);
  const main = parseStatementSequence(stream, ['EOL']);
  skipEols(stream);
  if (peek(stream)) {
    addError(stream, 'Unexpected statements or procedure definitions after main execution line', peek(stream));
  }
  if (main.length === 0) {
    addError(stream, 'Empty program: missing main execution statement');
  }
  runStaticValidation(procedures, main, stream);
  const ast: ProgramAST | null =
    stream.diagnostics.length === 0 ? { procedures, main, byteCount: lexResult.byteCount } : null;
  return { ast, tokens: lexResult.tokens, byteCount: lexResult.byteCount, diagnostics: stream.diagnostics };
}

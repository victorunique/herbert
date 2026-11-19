export type TokenType =
  | 'COMMAND'
  | 'IDENT_LOWER'
  | 'IDENT_UPPER'
  | 'NUMBER'
  | 'COLON'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'PLUS'
  | 'MINUS'
  | 'EOL';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly byteCost: 0 | 1;
  readonly line: number;
  readonly col: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface Diagnostic {
  readonly message: string;
  readonly line: number;
  readonly col: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface LexResult {
  readonly tokens: readonly Token[];
  readonly byteCount: number;
  readonly diagnostics: readonly Diagnostic[];
}

export type PrimitiveCommand = 's' | 'l' | 'r';

export type NumTermNode =
  | { readonly kind: 'number'; readonly value: number; readonly sign: 1 | -1; readonly token: Token }
  | { readonly kind: 'param'; readonly name: string; readonly sign: 1 | -1; readonly token: Token };

export interface NumExprNode {
  readonly kind: 'num_expr';
  readonly terms: readonly { readonly op: '+' | '-'; readonly term: NumTermNode }[];
  readonly token: Token;
}

export type ArgumentNode =
  | NumExprNode
  | { readonly kind: 'cmd_seq'; readonly statements: readonly StatementNode[]; readonly token: Token }
  | { readonly kind: 'param_ref'; readonly name: string; readonly token: Token };

export type StatementNode =
  | { readonly kind: 'primitive'; readonly command: PrimitiveCommand; readonly token: Token }
  | { readonly kind: 'param_stmt'; readonly name: string; readonly token: Token }
  | {
      readonly kind: 'proc_call';
      readonly name: string;
      readonly args: readonly ArgumentNode[];
      readonly token: Token;
    };

export interface ProcedureDef {
  readonly name: string;
  readonly params: readonly string[];
  readonly body: readonly StatementNode[];
  readonly token: Token;
}

export interface ProgramAST {
  readonly procedures: Readonly<Record<string, ProcedureDef>>;
  readonly main: readonly StatementNode[];
  readonly byteCount: number;
}

export interface ParseResult {
  readonly ast: ProgramAST | null;
  readonly tokens: readonly Token[];
  readonly byteCount: number;
  readonly diagnostics: readonly Diagnostic[];
}

export type BoundValue =
  | { readonly kind: 'num'; readonly value: number }
  | {
      readonly kind: 'seq';
      readonly label: string;
      readonly statements: readonly StatementNode[];
      readonly env: Readonly<Record<string, BoundValue>>;
    };

export interface CallStackFrame {
  readonly procName: string;
  readonly params: Readonly<Record<string, string>>;
  readonly callLine: number;
  readonly callCol: number;
}

export interface SkippedCallEvent {
  readonly procName: string;
  readonly argsSummary: string;
  readonly reason: string;
  readonly line: number;
  readonly col: number;
}

export interface InterpreterStepEvent {
  readonly command: PrimitiveCommand;
  readonly token: Token;
  readonly callStack: readonly CallStackFrame[];
  readonly skippedCalls: readonly SkippedCallEvent[];
}

export interface InterpreterOptions {
  readonly maxSteps?: number;
  readonly maxStackDepth?: number;
  readonly minInt?: number;
  readonly maxInt?: number;
}

export type RobotDirection = 'u' | 'r' | 'd' | 'l';

export type CellType = '.' | '*' | 'w' | 'g';

export interface Coordinates {
  readonly row: number;
  readonly col: number;
}

export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  readonly chapter?: number;
  readonly description?: string;
  readonly hint?: string;
  readonly width: number;
  readonly height: number;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly grid: readonly (readonly CellType[])[];
  readonly start: Coordinates;
  readonly startDir: RobotDirection;
  readonly whiteButtons: readonly Coordinates[];
  readonly grayButtons: readonly Coordinates[];
  readonly referenceSolution?: string;
}

export interface LevelParseResult {
  readonly level: LevelDefinition | null;
  readonly errors: readonly string[];
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'SOLVED' | 'FINISHED' | 'ERROR';

export interface SimulationSnapshot {
  readonly stepIndex: number;
  readonly robotRow: number;
  readonly robotCol: number;
  readonly robotDir: RobotDirection;
  readonly litButtons: readonly string[];
  readonly lastCommand: PrimitiveCommand | null;
  readonly bumpedWall: boolean;
  readonly triggeredGrayReset: boolean;
  readonly activeToken: Token | null;
  readonly callStack: readonly CallStackFrame[];
  readonly skippedCalls: readonly SkippedCallEvent[];
  readonly solved: boolean;
}

export interface ScoreBreakdown {
  readonly byteCount: number;
  readonly maxBytes: number;
  readonly overByteLimit: boolean;
  readonly solved: boolean;
  readonly litWhiteCount: number;
  readonly totalWhiteCount: number;
  readonly basePointsEarned: number;
  readonly efficiencyBonus: number;
  readonly totalScore: number;
}

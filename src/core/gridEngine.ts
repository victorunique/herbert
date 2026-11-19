import { createInterpreterGenerator } from './interpreter';
import { parseProgram } from './parser';
import type {
  CallStackFrame,
  Diagnostic,
  InterpreterOptions,
  LevelDefinition,
  PrimitiveCommand,
  RobotDirection,
  ScoreBreakdown,
  SimulationSnapshot,
  SkippedCallEvent,
  Token,
} from './types';

const LEFT_TURN: Readonly<Record<RobotDirection, RobotDirection>> = {
  u: 'l',
  l: 'd',
  d: 'r',
  r: 'u',
};

const RIGHT_TURN: Readonly<Record<RobotDirection, RobotDirection>> = {
  u: 'r',
  r: 'd',
  d: 'l',
  l: 'u',
};

const DIR_DELTA: Readonly<Record<RobotDirection, { readonly dr: number; readonly dc: number }>> = {
  u: { dr: -1, dc: 0 },
  r: { dr: 0, dc: 1 },
  d: { dr: 1, dc: 0 },
  l: { dr: 0, dc: -1 },
};

export interface StepMeta {
  readonly token?: Token | null;
  readonly callStack?: readonly CallStackFrame[];
  readonly skippedCalls?: readonly SkippedCallEvent[];
}

export function coordKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function createInitialSnapshot(level: LevelDefinition): SimulationSnapshot {
  return {
    stepIndex: 0,
    robotRow: level.start.row,
    robotCol: level.start.col,
    robotDir: level.startDir,
    litButtons: [],
    lastCommand: null,
    bumpedWall: false,
    triggeredGrayReset: false,
    activeToken: null,
    callStack: [],
    skippedCalls: [],
    solved: false,
  };
}

function isBlockedCell(level: LevelDefinition, row: number, col: number): boolean {
  if (row < 0 || row >= level.height || col < 0 || col >= level.width) {
    return true;
  }
  return level.grid[row]?.[col] === '*';
}

function resolveForwardStep(
  level: LevelDefinition,
  prev: SimulationSnapshot,
): {
  row: number;
  col: number;
  bumpedWall: boolean;
  triggeredGrayReset: boolean;
  litButtons: string[];
  solved: boolean;
} {
  const delta = DIR_DELTA[prev.robotDir];
  const nextRow = prev.robotRow + delta.dr;
  const nextCol = prev.robotCol + delta.dc;
  if (isBlockedCell(level, nextRow, nextCol)) {
    return {
      row: prev.robotRow,
      col: prev.robotCol,
      bumpedWall: true,
      triggeredGrayReset: false,
      litButtons: [...prev.litButtons],
      solved: prev.solved,
    };
  }
  return updateButtonStateAtCell(level, nextRow, nextCol, prev.litButtons);
}

function updateButtonStateAtCell(
  level: LevelDefinition,
  row: number,
  col: number,
  prevLit: readonly string[],
): {
  row: number;
  col: number;
  bumpedWall: boolean;
  triggeredGrayReset: boolean;
  litButtons: string[];
  solved: boolean;
} {
  const cell = level.grid[row]?.[col] ?? '.';
  const litSet = new Set(prevLit);
  let triggeredGrayReset = false;

  if (cell === 'w') {
    litSet.add(coordKey(row, col));
  } else if (cell === 'g' && litSet.size > 0) {
    litSet.clear();
    triggeredGrayReset = true;
  }
  const litButtons = Array.from(litSet);
  const solved = litButtons.length === level.whiteButtons.length && level.whiteButtons.length > 0;
  return { row, col, bumpedWall: false, triggeredGrayReset, litButtons, solved };
}

function applyTurnCommand(
  prev: SimulationSnapshot,
  command: 'l' | 'r',
  meta?: StepMeta,
): SimulationSnapshot {
  const nextDir = command === 'l' ? LEFT_TURN[prev.robotDir] : RIGHT_TURN[prev.robotDir];
  return {
    ...prev,
    stepIndex: prev.stepIndex + 1,
    robotDir: nextDir,
    lastCommand: command,
    bumpedWall: false,
    triggeredGrayReset: false,
    activeToken: meta?.token ?? null,
    callStack: meta?.callStack ?? prev.callStack,
    skippedCalls: meta?.skippedCalls ?? prev.skippedCalls,
  };
}

export function applyPrimitiveCommand(
  level: LevelDefinition,
  prev: SimulationSnapshot,
  command: PrimitiveCommand,
  meta?: StepMeta,
): SimulationSnapshot {
  if (command === 'l' || command === 'r') {
    return applyTurnCommand(prev, command, meta);
  }
  const forward = resolveForwardStep(level, prev);
  return {
    stepIndex: prev.stepIndex + 1,
    robotRow: forward.row,
    robotCol: forward.col,
    robotDir: prev.robotDir,
    litButtons: forward.litButtons,
    lastCommand: 's',
    bumpedWall: forward.bumpedWall,
    triggeredGrayReset: forward.triggeredGrayReset,
    activeToken: meta?.token ?? null,
    callStack: meta?.callStack ?? prev.callStack,
    skippedCalls: meta?.skippedCalls ?? prev.skippedCalls,
    solved: forward.solved,
  };
}

function computePoints(params: {
  readonly byteCount: number;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly litWhiteCount: number;
  readonly totalWhiteCount: number;
  readonly overByteLimit: boolean;
  readonly solved: boolean;
}): { basePointsEarned: number; efficiencyBonus: number } {
  if (params.overByteLimit || params.byteCount <= 0) {
    return { basePointsEarned: 0, efficiencyBonus: 0 };
  }
  if (params.solved) {
    const saved = Math.max(0, params.maxBytes - params.byteCount);
    const efficiencyBonus = Math.round((params.basePoints * saved) / params.maxBytes);
    return { basePointsEarned: params.basePoints, efficiencyBonus };
  }
  const ratio = params.totalWhiteCount > 0 ? params.litWhiteCount / params.totalWhiteCount : 0;
  return { basePointsEarned: Math.floor(params.basePoints * 0.5 * ratio), efficiencyBonus: 0 };
}

export function calculateLevelScore(params: {
  readonly byteCount: number;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly litWhiteCount: number;
  readonly totalWhiteCount: number;
}): ScoreBreakdown {
  const overByteLimit = params.byteCount > params.maxBytes;
  const solved =
    !overByteLimit && params.totalWhiteCount > 0 && params.litWhiteCount >= params.totalWhiteCount;
  const { basePointsEarned, efficiencyBonus } = computePoints({
    ...params,
    overByteLimit,
    solved,
  });
  return {
    byteCount: params.byteCount,
    maxBytes: params.maxBytes,
    overByteLimit,
    solved: solved && params.byteCount > 0,
    litWhiteCount: params.litWhiteCount,
    totalWhiteCount: params.totalWhiteCount,
    basePointsEarned,
    efficiencyBonus,
    totalScore: basePointsEarned + efficiencyBonus,
  };
}

export interface SimulationSession {
  readonly byteCount: number;
  readonly compileDiagnostics: readonly Diagnostic[];
  readonly runtimeError: string | null;
  getCurrentSnapshot(): SimulationSnapshot;
  getTotalPrecomputedSteps(): number;
  canStepForward(): boolean;
  canStepBackward(): boolean;
  stepForward(): SimulationSnapshot;
  stepBackward(): SimulationSnapshot;
  runToCompletion(): SimulationSnapshot;
  reset(): SimulationSnapshot;
  getScoreBreakdown(): ScoreBreakdown;
}

function collectExecutionSnapshots(
  level: LevelDefinition,
  ast: NonNullable<ReturnType<typeof parseProgram>['ast']>,
  initial: SimulationSnapshot,
  options?: InterpreterOptions,
): { snapshots: SimulationSnapshot[]; runtimeError: string | null } {
  const snapshots: SimulationSnapshot[] = [initial];
  let runtimeError: string | null = null;
  try {
    let current = initial;
    for (const ev of createInterpreterGenerator(ast, options)) {
      current = applyPrimitiveCommand(level, current, ev.command, {
        token: ev.token,
        callStack: ev.callStack,
        skippedCalls: ev.skippedCalls,
      });
      snapshots.push(current);
      if (current.solved) break;
    }
  } catch (err) {
    runtimeError = err instanceof Error ? err.message : String(err);
  }
  return { snapshots, runtimeError };
}

function precomputeAllSnapshots(
  level: LevelDefinition,
  source: string,
  options?: InterpreterOptions,
): {
  snapshots: SimulationSnapshot[];
  byteCount: number;
  diagnostics: readonly Diagnostic[];
  runtimeError: string | null;
} {
  const parsed = parseProgram(source);
  const initial = createInitialSnapshot(level);
  if (!parsed.ast) {
    return {
      snapshots: [initial],
      byteCount: parsed.byteCount,
      diagnostics: parsed.diagnostics,
      runtimeError: null,
    };
  }
  const { snapshots, runtimeError } = collectExecutionSnapshots(level, parsed.ast, initial, options);
  return { snapshots, byteCount: parsed.byteCount, diagnostics: parsed.diagnostics, runtimeError };
}

export function createSimulationSession(
  level: LevelDefinition,
  source: string,
  options?: InterpreterOptions,
): SimulationSession {
  const { snapshots, byteCount, diagnostics, runtimeError } = precomputeAllSnapshots(level, source, options);
  let cursor = 0;
  const maxIdx = snapshots.length - 1;

  return {
    byteCount,
    compileDiagnostics: diagnostics,
    runtimeError,
    getCurrentSnapshot: () => snapshots[cursor]!,
    getTotalPrecomputedSteps: () => maxIdx,
    canStepForward: () => cursor < maxIdx,
    canStepBackward: () => cursor > 0,
    stepForward: () => snapshots[(cursor = Math.min(maxIdx, cursor + 1))]!,
    stepBackward: () => snapshots[(cursor = Math.max(0, cursor - 1))]!,
    runToCompletion: () => snapshots[(cursor = maxIdx)]!,
    reset: () => snapshots[(cursor = 0)]!,
    getScoreBreakdown: () =>
      calculateLevelScore({
        byteCount,
        maxBytes: level.maxBytes,
        basePoints: level.basePoints,
        litWhiteCount: snapshots[cursor]!.litButtons.length,
        totalWhiteCount: level.whiteButtons.length,
      }),
  };
}

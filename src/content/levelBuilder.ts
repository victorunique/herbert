import { runProgramToSteps } from '../core/interpreter';
import { parseLevelText } from '../core/levelCodec';
import { parseProgram } from '../core/parser';
import type { LevelDefinition, RobotDirection } from '../core/types';

export interface GridBuilderSpec {
  readonly id: string;
  readonly name: string;
  readonly chapter: number;
  readonly description: string;
  readonly hint: string;
  readonly width?: number;
  readonly height?: number;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly startRow: number;
  readonly startCol: number;
  readonly startDir: RobotDirection;
  readonly referenceSolution: string;
  readonly populate: (grid: string[][]) => void;
}

const LEFT_DIR: Readonly<Record<RobotDirection, RobotDirection>> = { u: 'l', l: 'd', d: 'r', r: 'u' };
const RIGHT_DIR: Readonly<Record<RobotDirection, RobotDirection>> = { u: 'r', r: 'd', d: 'l', l: 'u' };
const STEP_DELTA: Readonly<Record<RobotDirection, readonly [number, number]>> = {
  u: [-1, 0],
  r: [0, 1],
  d: [1, 0],
  l: [0, -1],
};

export function placePoints(g: string[][], pts: readonly (readonly [number, number])[], ch: string): void {
  for (const [r, c] of pts) {
    if (g[r]?.[c] !== undefined) g[r]![c] = ch;
  }
}

export function placeLine(
  g: string[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  ch: string,
  stride = 1,
): void {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  for (let i = 0; i <= len; i += stride) {
    const r = r1 + dr * i;
    const c = c1 + dc * i;
    if (g[r]?.[c] !== undefined) g[r]![c] = ch;
  }
}

interface TraceCursor {
  r: number;
  c: number;
  dir: RobotDirection;
  moves: number;
}

function advanceTraceCursor(g: string[][], cur: TraceCursor, cmd: string, stride: number): void {
  if (cmd === 'l') {
    cur.dir = LEFT_DIR[cur.dir];
    return;
  }
  if (cmd === 'r') {
    cur.dir = RIGHT_DIR[cur.dir];
    return;
  }
  const [dr, dc] = STEP_DELTA[cur.dir];
  const nr = cur.r + dr;
  const nc = cur.c + dc;
  const target = g[nr]?.[nc];
  if (target === undefined || target === '*') return;
  cur.r = nr;
  cur.c = nc;
  cur.moves += 1;
  if (cur.moves % stride === 0 && target === '.') g[nr]![nc] = 'w';
}

export function traceWhitePath(
  g: string[][],
  startRow: number,
  startCol: number,
  startDir: RobotDirection,
  code: string,
  maxSteps = 400,
  stride = 2,
): void {
  const parsed = parseProgram(code);
  if (!parsed.ast) return;
  const cur: TraceCursor = { r: startRow, c: startCol, dir: startDir, moves: 0 };
  for (const ev of runProgramToSteps(parsed.ast, { maxSteps })) {
    advanceTraceCursor(g, cur, ev.command, stride);
  }
  if (g[cur.r]?.[cur.c] === '.') g[cur.r]![cur.c] = 'w';
}

export function buildCampaignLevel(spec: GridBuilderSpec): LevelDefinition {
  const width = spec.width ?? 25;
  const height = spec.height ?? 25;
  const rows: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) =>
      r === 0 || r === height - 1 || c === 0 || c === width - 1 ? '*' : '.',
    ),
  );
  spec.populate(rows);
  rows[spec.startRow]![spec.startCol] = spec.startDir;
  const rawText = rows.map((r) => r.join('')).join('\n');
  const parsed = parseLevelText(rawText, {
    id: spec.id,
    fallbackName: spec.name,
    chapter: spec.chapter,
    description: spec.description,
    hint: spec.hint,
    maxBytes: spec.maxBytes,
    basePoints: spec.basePoints,
    referenceSolution: spec.referenceSolution,
  });
  return parsed.level!;
}

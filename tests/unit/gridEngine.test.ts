import { describe, expect, it } from 'vitest';
import { parseLevelText } from '../../src/core/levelCodec';
import {
  applyPrimitiveCommand,
  calculateLevelScore,
  createInitialSnapshot,
  createSimulationSession,
} from '../../src/core/gridEngine';
import type { LevelDefinition } from '../../src/core/types';

function buildTestLevel(mutator?: (rows: string[][]) => void): LevelDefinition {
  const rows: string[][] = Array.from({ length: 25 }, (_, r) =>
    Array.from({ length: 25 }, (__, c) =>
      r === 0 || r === 24 || c === 0 || c === 24 ? '*' : '.',
    ),
  );
  rows[12]![12] = 'u';
  rows[10]![12] = 'w';
  rows[12]![14] = 'w';
  rows[12]![13] = 'g';
  if (mutator) mutator(rows);
  const txt = rows.map((r) => r.join('')).join('\n');
  const parsed = parseLevelText(txt, { maxBytes: 20, basePoints: 100 });
  if (!parsed.level) throw new Error(parsed.errors.join(', '));
  return parsed.level;
}

describe('Grid Physics Engine & Scoring Calculator', () => {
  it('moves forward and rotates left/right across all 4 cardinal directions with accurate flags', () => {
    const level = buildTestLevel();
    let snap = createInitialSnapshot(level);
    expect(snap.stepIndex).toBe(0);
    expect(snap.robotRow).toBe(12);
    expect(snap.robotCol).toBe(12);
    expect(snap.robotDir).toBe('u');
    expect(snap.bumpedWall).toBe(false);
    expect(snap.triggeredGrayReset).toBe(false);

    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.stepIndex).toBe(1);
    expect(snap.lastCommand).toBe('s');
    expect(snap.robotRow).toBe(11);
    expect(snap.robotCol).toBe(12);
    expect(snap.bumpedWall).toBe(false);
    expect(snap.triggeredGrayReset).toBe(false);

    // Full 360 right turns: u -> r -> d -> l -> u
    snap = applyPrimitiveCommand(level, snap, 'r');
    expect(snap.robotDir).toBe('r');
    expect(snap.lastCommand).toBe('r');
    expect(snap.stepIndex).toBe(2);
    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.robotCol).toBe(13);

    snap = applyPrimitiveCommand(level, snap, 'r');
    expect(snap.robotDir).toBe('d');
    snap = applyPrimitiveCommand(level, snap, 'r');
    expect(snap.robotDir).toBe('l');
    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.robotCol).toBe(12);
    snap = applyPrimitiveCommand(level, snap, 'r');
    expect(snap.robotDir).toBe('u');

    // Full 360 left turns: u -> l -> d -> r -> u
    snap = applyPrimitiveCommand(level, snap, 'l');
    expect(snap.robotDir).toBe('l');
    expect(snap.lastCommand).toBe('l');
    snap = applyPrimitiveCommand(level, snap, 'l');
    expect(snap.robotDir).toBe('d');
    snap = applyPrimitiveCommand(level, snap, 'l');
    expect(snap.robotDir).toBe('r');
    snap = applyPrimitiveCommand(level, snap, 'l');
    expect(snap.robotDir).toBe('u');
  });

  it('bumps harmlessly against walls and all 4 outer map boundaries (row<0, row>=H, col<0, col>=W)', () => {
    // Open borders at (0,12), (24,12), (12,0), (12,24)
    const topEdge = buildTestLevel((rows) => {
      rows[12]![12] = '.';
      rows[0]![12] = 'u';
    });
    const sTop = applyPrimitiveCommand(topEdge, createInitialSnapshot(topEdge), 's');
    expect(sTop.robotRow).toBe(0);
    expect(sTop.bumpedWall).toBe(true);
    expect(sTop.triggeredGrayReset).toBe(false);
    // Turning after a bump clears bumpedWall
    const sTopTurn = applyPrimitiveCommand(topEdge, sTop, 'l');
    expect(sTopTurn.bumpedWall).toBe(false);
    expect(sTopTurn.triggeredGrayReset).toBe(false);

    const bottomEdge = buildTestLevel((rows) => {
      rows[12]![12] = '.';
      rows[24]![12] = 'd';
    });
    const sBottom = applyPrimitiveCommand(bottomEdge, createInitialSnapshot(bottomEdge), 's');
    expect(sBottom.robotRow).toBe(24);
    expect(sBottom.bumpedWall).toBe(true);

    const leftEdge = buildTestLevel((rows) => {
      rows[12]![12] = '.';
      rows[12]![0] = 'l';
    });
    const sLeft = applyPrimitiveCommand(leftEdge, createInitialSnapshot(leftEdge), 's');
    expect(sLeft.robotCol).toBe(0);
    expect(sLeft.bumpedWall).toBe(true);

    const rightEdge = buildTestLevel((rows) => {
      rows[12]![12] = '.';
      rows[12]![24] = 'r';
    });
    const sRight = applyPrimitiveCommand(rightEdge, createInitialSnapshot(rightEdge), 's');
    expect(sRight.robotCol).toBe(24);
    expect(sRight.bumpedWall).toBe(true);
  });

  it('lights white buttons idempotently and only triggers gray reset when litButtons > 0', () => {
    const level = buildTestLevel();
    let snap = createInitialSnapshot(level);

    // Step onto gray button (12,13) when 0 white buttons are lit -> triggeredGrayReset is false
    snap = applyPrimitiveCommand(level, snap, 'r');
    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.robotRow).toBe(12);
    expect(snap.robotCol).toBe(13);
    expect(snap.triggeredGrayReset).toBe(false);

    // Step back to (12,12), go up to (10,12) to light white button
    snap = createInitialSnapshot(level);
    snap = applyPrimitiveCommand(level, snap, 's');
    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.litButtons).toEqual(['10,12']);
    expect(snap.triggeredGrayReset).toBe(false);

    // Now return to (12,13) gray button -> triggeredGrayReset is true, litButtons cleared
    snap = applyPrimitiveCommand(level, snap, 'r');
    snap = applyPrimitiveCommand(level, snap, 'r');
    snap = applyPrimitiveCommand(level, snap, 's');
    snap = applyPrimitiveCommand(level, snap, 's');
    snap = applyPrimitiveCommand(level, snap, 'l');
    snap = applyPrimitiveCommand(level, snap, 's');
    expect(snap.triggeredGrayReset).toBe(true);
    expect(snap.litButtons).toEqual([]);
    // Turning after gray reset clears triggeredGrayReset
    const afterTurn = applyPrimitiveCommand(level, snap, 'l');
    expect(afterTurn.triggeredGrayReset).toBe(false);
  });

  it('calculates proportional scores for solved, byte-saving bonus, partial, 0-byte, and over-limit cases', () => {
    const exact = calculateLevelScore({
      byteCount: 20,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 4,
      totalWhiteCount: 4,
    });
    expect(exact.solved).toBe(true);
    expect(exact.overByteLimit).toBe(false);
    expect(exact.totalScore).toBe(100);
    expect(exact.efficiencyBonus).toBe(0);

    const golfed = calculateLevelScore({
      byteCount: 10,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 4,
      totalWhiteCount: 4,
    });
    expect(golfed.solved).toBe(true);
    expect(golfed.basePointsEarned).toBe(100);
    expect(golfed.efficiencyBonus).toBe(50);
    expect(golfed.totalScore).toBe(150);

    const partial = calculateLevelScore({
      byteCount: 12,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 2,
      totalWhiteCount: 4,
    });
    expect(partial.solved).toBe(false);
    expect(partial.totalScore).toBe(25);

    const zeroBytes = calculateLevelScore({
      byteCount: 0,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 4,
      totalWhiteCount: 4,
    });
    expect(zeroBytes.solved).toBe(false);
    expect(zeroBytes.totalScore).toBe(0);

    const zeroTotalWhite = calculateLevelScore({
      byteCount: 5,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 0,
      totalWhiteCount: 0,
    });
    expect(zeroTotalWhite.solved).toBe(false);
    expect(zeroTotalWhite.totalScore).toBe(0);

    const overLimit = calculateLevelScore({
      byteCount: 21,
      maxBytes: 20,
      basePoints: 100,
      litWhiteCount: 4,
      totalWhiteCount: 4,
    });
    expect(overLimit.overByteLimit).toBe(true);
    expect(overLimit.solved).toBe(false);
    expect(overLimit.totalScore).toBe(0);
  });

  it('supports forward, multi-step backward, instant run, and compile/runtime error handling in SimulationSession', () => {
    const level = buildTestLevel((rows) => {
      rows[12]![14] = '.';
      rows[12]![13] = '.';
      rows[11]![12] = 'w';
      rows[9]![12] = 'w';
      rows[8]![12] = 'g';
    });
    const session = createSimulationSession(level, 'a:sa\na');
    expect(session.compileDiagnostics).toHaveLength(0);
    expect(session.runtimeError).toBeNull();
    expect(session.getTotalPrecomputedSteps()).toBe(3);
    expect(session.canStepBackward()).toBe(false);
    expect(session.canStepForward()).toBe(true);

    const s1 = session.stepForward();
    expect(s1.stepIndex).toBe(1);
    expect(s1.activeToken).not.toBeNull();
    expect(s1.callStack).toHaveLength(1);
    expect(session.canStepBackward()).toBe(true);

    const s2 = session.stepForward();
    expect(s2.stepIndex).toBe(2);

    // Step backward from 2 -> 1 (verifies cursor - 1 = 1, not 0)
    const backTo1 = session.stepBackward();
    expect(backTo1.stepIndex).toBe(1);

    const backTo0 = session.stepBackward();
    expect(backTo0.stepIndex).toBe(0);
    expect(session.canStepBackward()).toBe(false);

    const finalSnap = session.runToCompletion();
    expect(finalSnap.solved).toBe(true);
    expect(finalSnap.stepIndex).toBe(3);
    expect(session.canStepForward()).toBe(false);

    // Invalid syntax session
    const badSyntax = createSimulationSession(level, 'a(X:s');
    expect(badSyntax.compileDiagnostics.length).toBeGreaterThan(0);
    expect(badSyntax.canStepForward()).toBe(false);

    // Runtime overflow session
    const badRuntime = createSimulationSession(level, 'a(X):sa(X+200)\na(100)');
    expect(badRuntime.runtimeError).toMatch(/overflow/i);
  });
});

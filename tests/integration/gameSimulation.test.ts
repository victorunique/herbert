import { describe, expect, it } from 'vitest';
import { parseLevelText } from '../../src/core/levelCodec';
import { createSimulationSession } from '../../src/core/gridEngine';

describe('End-to-End Core Engine Integration (Level Codec + Parser + Interpreter + Grid Engine)', () => {
  it('solves a 35x25 rectangular odd-dimension level using numeric recursion and wall alignment', () => {
    const width = 35;
    const height = 25;
    const rows: string[][] = Array.from({ length: height }, (_, r) =>
      Array.from({ length: width }, (__, c) =>
        r === 0 || r === height - 1 || c === 0 || c === width - 1 ? '*' : '.',
      ),
    );
    // Start at (12, 2) facing right, white buttons along row 12 up to col 30, then wall at col 31, then white button at (10, 30)
    rows[12]![2] = 'r';
    rows[12]![10] = 'w';
    rows[12]![20] = 'w';
    rows[12]![30] = 'w';
    rows[12]![31] = '*';
    rows[10]![30] = 'w';

    const txt = `# name: Rectangular Corridor\n# max_bytes: 12\n# points: 200\n${rows.map((r) => r.join('')).join('\n')}`;
    const parsedLevel = parseLevelText(txt);
    expect(parsedLevel.errors).toHaveLength(0);

    // Use wall alignment: walk 40 steps right (bumps into wall at col 31 after reaching col 30), turn left, walk 2 steps
    const code = 'a(X):sa(X-1)\na(40)la(2)';
    const session = createSimulationSession(parsedLevel.level!, code);
    const endSnap = session.runToCompletion();

    expect(endSnap.solved).toBe(true);
    const score = session.getScoreBreakdown();
    expect(score.byteCount).toBe(11);
    expect(score.overByteLimit).toBe(false);
    expect(score.totalScore).toBeGreaterThan(200);
  });
});

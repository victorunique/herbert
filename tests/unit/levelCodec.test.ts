import { describe, expect, it } from 'vitest';
import {
  createBlankLevel,
  isValidGridDimension,
  parseBatchLevelFiles,
  parseLevelText,
  serializeLevelToText,
} from '../../src/core/levelCodec';

function makeGridLines(width: number, height: number, mutator?: (rows: string[][]) => void): string {
  const rows: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) =>
      r === 0 || r === height - 1 || c === 0 || c === width - 1 ? '*' : '.',
    ),
  );
  const centerR = Math.floor(height / 2);
  const centerC = Math.floor(width / 2);
  rows[centerR]![centerC] = 'u';
  rows[centerR - 1]![centerC] = 'w';
  if (mutator) mutator(rows);
  return rows.map((r) => r.join('')).join('\n');
}

describe('Level Codec (.txt Parser, Serializer & WxH Validator [25..40])', () => {
  it('validates any integer dimension in [25, 40] (both odd and even)', () => {
    expect(isValidGridDimension(25)).toBe(true);
    expect(isValidGridDimension(26)).toBe(true);
    expect(isValidGridDimension(30)).toBe(true);
    expect(isValidGridDimension(35)).toBe(true);
    expect(isValidGridDimension(40)).toBe(true);
    expect(isValidGridDimension(24)).toBe(false);
    expect(isValidGridDimension(41)).toBe(false);
    expect(isValidGridDimension(25.5)).toBe(false);
  });

  it('parses a standard 25x25 pure grid .txt file with default metadata and slugified ID', () => {
    const txt = makeGridLines(25, 25);
    const res = parseLevelText(txt);
    expect(res.errors).toHaveLength(0);
    expect(res.level).not.toBeNull();
    const lvl = res.level!;
    expect(lvl.name).toBe('Custom Level');
    expect(lvl.id).toBe('lvl-custom-level');
    expect(lvl.width).toBe(25);
    expect(lvl.height).toBe(25);
    expect(lvl.maxBytes).toBe(25);
    expect(lvl.basePoints).toBe(100);
    expect(lvl.start).toEqual({ row: 12, col: 12 });
    expect(lvl.startDir).toBe('u');
    expect(lvl.whiteButtons).toEqual([{ row: 11, col: 12 }]);
  });

  it('parses annotated .txt file with metadata headers, even rectangular dimensions (30x26), and ignores <=0 numeric headers', () => {
    const grid30x26 = makeGridLines(30, 26, (rows) => {
      rows[5]![5] = 'g';
    });
    const annotated = `# comment without colon\n# NAME : Rectangular Challenge\n# MAX_BYTES : 24\n# POINTS : 350\n${grid30x26}`;
    const res = parseLevelText(annotated);
    expect(res.errors).toHaveLength(0);
    expect(res.level?.name).toBe('Rectangular Challenge');
    expect(res.level?.width).toBe(30);
    expect(res.level?.height).toBe(26);
    expect(res.level?.maxBytes).toBe(24);
    expect(res.level?.basePoints).toBe(350);
    expect(res.level?.grayButtons).toEqual([{ row: 5, col: 5 }]);

    const zeroMeta = `# max_bytes: 0\n# points: 0\n${makeGridLines(25, 25)}`;
    const resZero = parseLevelText(zeroMeta, { maxBytes: 18, basePoints: 120 });
    expect(resZero.level?.maxBytes).toBe(18);
    expect(resZero.level?.basePoints).toBe(120);
  });

  it('parses maximum 40x40 grid', () => {
    const res = parseLevelText(makeGridLines(40, 40));
    expect(res.errors).toHaveLength(0);
    expect(res.level?.width).toBe(40);
    expect(res.level?.height).toBe(40);
  });

  it('rejects out-of-range dimensions (<25 or >40)', () => {
    const tooSmall = parseLevelText(makeGridLines(24, 24));
    expect(tooSmall.level).toBeNull();
    expect(tooSmall.errors).toContain('Grid height (24) must be between 25 and 40');
    expect(tooSmall.errors).toContain('Grid width (24) must be between 25 and 40');

    const tooLarge = parseLevelText(makeGridLines(41, 42));
    expect(tooLarge.level).toBeNull();
    expect(tooLarge.errors).toContain('Grid height (42) must be between 25 and 40');
    expect(tooLarge.errors).toContain('Grid width (41) must be between 25 and 40');
  });

  it('rejects ragged rows, invalid characters, missing/multiple starts, or zero white buttons with exact messages', () => {
    const rows25 = makeGridLines(25, 25).split('\n');
    rows25[3] = '***';
    const ragged = parseLevelText(rows25.join('\n'));
    expect(ragged.level).toBeNull();
    expect(ragged.errors).toContain('Row 4 has length 3, expected uniform width 25');

    const invalidChar = makeGridLines(25, 25, (rows) => {
      rows[2]![4] = 'X';
    });
    expect(parseLevelText(invalidChar).errors).toContain("Invalid character 'X' at row 3, col 5");

    const noStart = makeGridLines(25, 25, (rows) => {
      rows[12]![12] = '.';
    });
    expect(parseLevelText(noStart).errors).toContain("Missing start position ('u', 'r', 'd', or 'l')");

    const twoStarts = makeGridLines(25, 25, (rows) => {
      rows[2]![2] = 'r';
    });
    expect(parseLevelText(twoStarts).errors).toContain(
      'Multiple start positions found (2); exactly 1 is required',
    );

    const noWhite = makeGridLines(25, 25, (rows) => {
      rows[11]![12] = '.';
    });
    expect(parseLevelText(noWhite).errors).toContain(
      "Level must contain at least one white button ('w')",
    );
  });

  it('creates blank levels with outer perimeter walls and inner empty spaces, and round-trips to .txt', () => {
    const defaultBlank = createBlankLevel();
    expect(defaultBlank.id).toBe('custom-level');
    expect(defaultBlank.name).toBe('New Custom Level');
    expect(defaultBlank.width).toBe(25);
    expect(defaultBlank.height).toBe(25);
    expect(defaultBlank.grid[0]?.[5]).toBe('*');
    expect(defaultBlank.grid[24]?.[5]).toBe('*');
    expect(defaultBlank.grid[5]?.[0]).toBe('*');
    expect(defaultBlank.grid[5]?.[24]).toBe('*');
    expect(defaultBlank.grid[1]?.[1]).toBe('.');

    // Invalid dimension (<25 or >40) falls back to 25
    const fallbackBlank = createBlankLevel({ width: 24, height: 45 });
    expect(fallbackBlank.width).toBe(25);
    expect(fallbackBlank.height).toBe(25);

    const customBlank = createBlankLevel({
      id: 'custom-1',
      name: 'Round Trip Map',
      width: 30,
      height: 26,
      maxBytes: 15,
      basePoints: 200,
    });
    const serialized = serializeLevelToText(customBlank);
    const reparsed = parseLevelText(serialized);
    expect(reparsed.errors).toHaveLength(0);
    expect(reparsed.level?.name).toBe('Round Trip Map');
    expect(reparsed.level?.width).toBe(30);
    expect(reparsed.level?.height).toBe(26);
  });

  it('batch-parses multiple .txt files and separates valid levels from out-of-range files', () => {
    const batch = parseBatchLevelFiles([
      { filename: 'good_even.txt', content: makeGridLines(26, 28) },
      { filename: 'bad_too_large.txt', content: makeGridLines(42, 25) },
      { filename: '.txt', content: makeGridLines(31, 25) },
    ]);
    expect(batch.validLevels).toHaveLength(2);
    expect(batch.validLevels[0]?.name).toBe('good even');
    expect(batch.validLevels[0]?.width).toBe(26);
    expect(batch.validLevels[1]?.name).toBe('Imported Level 3');
    expect(batch.failedFiles).toHaveLength(1);
    expect(batch.failedFiles[0]?.filename).toBe('bad_too_large.txt');
  });
});

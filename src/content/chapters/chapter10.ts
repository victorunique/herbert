import { buildCampaignLevel, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_10_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c10-nine-byte-spiral',
    name: '10-1: 9-Byte Spiral Storm',
    chapter: 10,
    description: 'An extreme Code Golf challenge! Solve an 11-turn expanding spiral using at most 9 bytes of H code.',
    hint: 'Only 9 bytes are needed: a(X):Xra(Xs) followed by a(s)!',
    maxBytes: 9,
    basePoints: 600,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):Xra(Xs)\na(s)',
    populate: (g): void => {
      traceWhitePath(g, 12, 12, 'u', 'a(X):Xra(Xs)\na(s)', 95, 3);
    },
  },
  {
    id: 'c10-blind-wall-bounce',
    name: '10-2: Blind Wall Bounce',
    chapter: 10,
    description: 'Navigate a staggered wall chamber in 12 bytes or fewer by doubling steps and overshooting into walls.',
    hint: 'Use a(X):XX with b:a(a(a(s)))rb (12 bytes total!) to march 8 steps into every stopper wall.',
    maxBytes: 12,
    basePoints: 650,
    startRow: 16,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a(X):XX\nb:a(a(a(s)))rb\nb',
    populate: (g): void => {
      placePoints(g, [[9, 8], [10, 17], [17, 16], [16, 10], [12, 11]], '*');
      traceWhitePath(g, 16, 8, 'u', 'a(X):XX\nb:a(a(a(s)))rb\nb', 110, 2);
    },
  },
  {
    id: 'c10-gray-labyrinth',
    name: '10-3: Gray Labyrinth',
    chapter: 10,
    description: 'A 10x10 walled vault with a gray reset trap on its opening wall. Time your two-lap patrol within 14 bytes.',
    hint: 'Use a(X):sa(X-1) and b:a(10)rb. Lap 1 absorbs the reset; lap 2 re-lights the opening white buttons for victory!',
    maxBytes: 14,
    basePoints: 700,
    startRow: 17,
    startCol: 7,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(10)rb\nb',
    populate: (g): void => {
      placePoints(g, [[15, 7], [13, 7], [7, 10], [7, 15], [12, 17], [17, 15], [17, 10]], 'w');
      placePoints(g, [[11, 7]], 'g');
    },
  },
  {
    id: 'c10-recursive-crossfire-34x34',
    name: '10-4: Recursive Crossfire (34x34)',
    chapter: 10,
    width: 34,
    height: 34,
    description: 'A 34x34 Code Golf gauntlet! Grow a macro argument X while doubling it on every cross-turn.',
    hint: 'Combine a(X):XX with b(X):Xra(X)lb(Xs) and start from b(s) in just 16 bytes!',
    maxBytes: 16,
    basePoints: 750,
    startRow: 28,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X):XX\nb(X):Xra(X)lb(Xs)\nb(s)',
    populate: (g): void => {
      traceWhitePath(g, 28, 6, 'u', 'a(X):XX\nb(X):Xra(X)lb(Xs)\nb(s)', 110, 3);
    },
  },
  {
    id: 'c10-herberts-final-exam-40x40',
    name: '10-5: Herbert\'s Final Exam (40x40)',
    chapter: 10,
    width: 40,
    height: 40,
    description: 'The ultimate 40x40 Grandmaster exam! Compose a double-scaled Level-2 Koch Cross across the full arena in 20 bytes.',
    hint: 'Define a(X):XlXrXrXlX and loop b:a(a(ss))rb to carve a giant fractal cross across the 40x40 board!',
    maxBytes: 20,
    basePoints: 800,
    startRow: 29,
    startCol: 11,
    startDir: 'u',
    referenceSolution: 'a(X):XlXrXrXlX\nb:a(a(ss))rb\nb',
    populate: (g): void => {
      traceWhitePath(g, 29, 11, 'u', 'a(X):XlXrXrXlX\nb:a(a(ss))rb\nb', 600, 4);
    },
  },
];

export const CHAPTER_10_LEVELS: readonly LevelDefinition[] = CHAPTER_10_SPECS.map(buildCampaignLevel);

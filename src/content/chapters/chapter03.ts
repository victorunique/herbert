import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_3_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c3-precision-stop',
    name: '3-1: Precision Countdown',
    chapter: 3,
    description:
      'A gray reset trap sits at the end of the corridor. Use a numeric countdown procedure a(X):sa(X-1) to walk 7 steps, turn right, and collect the final 4 buttons.',
    hint: 'Define a(X):sa(X-1) and call a(7)ra(4). Remember multi-digit numbers still cost only 1 byte!',
    maxBytes: 15,
    basePoints: 200,
    startRow: 12,
    startCol: 6,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\na(7)ra(4)',
    populate: (g): void => {
      placeLine(g, 12, 7, 12, 13, 'w', 1);
      placePoints(g, [[12, 14]], 'g');
      placeLine(g, 13, 13, 16, 13, 'w', 1);
    },
  },
  {
    id: 'c3-stepping-stones',
    name: '3-2: Stepping Stones',
    chapter: 3,
    description: 'Weave diagonally past five guarded gray pillars using a counted stair procedure.',
    hint: 'Define a(X):ssrssla(X-1) and call a(5) so recursion stops cleanly at X <= 0.',
    maxBytes: 14,
    basePoints: 215,
    startRow: 18,
    startCol: 5,
    startDir: 'u',
    referenceSolution: 'a(X):ssrssla(X-1)\na(5)',
    populate: (g): void => {
      placePoints(g, [[17, 6], [15, 8], [13, 10], [11, 12], [9, 14]], 'g');
      traceWhitePath(g, 18, 5, 'u', 'a(X):ssrssla(X-1)\na(5)', 120, 2);
    },
  },
  {
    id: 'c3-shrinking-box',
    name: '3-3: Shrinking Box',
    chapter: 3,
    description: 'Spiral inward from a 12-step outer edge, subtracting 2 steps on every right turn.',
    hint: 'Combine a(X):sa(X-1) with b(X):a(X)rb(X-2) and start at b(12).',
    maxBytes: 18,
    basePoints: 225,
    startRow: 18,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)rb(X-2)\nb(12)',
    populate: (g): void => {
      traceWhitePath(g, 18, 6, 'u', 'a(X):sa(X-1)\nb(X):a(X)rb(X-2)\nb(12)', 200, 2);
    },
  },
  {
    id: 'c3-numeric-spiral',
    name: '3-4: Arithmetic Spiral',
    chapter: 3,
    description:
      'Light up the expanding clockwise spiral of white buttons by incrementing your step count after every 90-degree right turn.',
    hint: 'Combine a countdown step helper a(X):sa(X-1) with a growing spiral b(X):a(X)rb(X+1).',
    maxBytes: 18,
    basePoints: 240,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)rb(X+1)\nb(1)',
    populate: (g): void => {
      placePoints(g, [[11, 12], [11, 14], [14, 14], [14, 10], [9, 10], [9, 16]], 'w');
    },
  },
  {
    id: 'c3-double-step-ladder',
    name: '3-5: Double-Step Ladder',
    chapter: 3,
    description: 'Climb an expanding ladder whose vertical rungs grow by 1 step on each iteration.',
    hint: 'Use a(X):sa(X-1) with b(X):a(X)ra(2)lb(X+1) starting from b(1).',
    maxBytes: 19,
    basePoints: 250,
    startRow: 20,
    startCol: 5,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)ra(2)lb(X+1)\nb(1)',
    populate: (g): void => {
      traceWhitePath(g, 20, 5, 'u', 'a(X):sa(X-1)\nb(X):a(X)ra(2)lb(X+1)\nb(1)', 35, 2);
    },
  },
];

export const CHAPTER_3_LEVELS: readonly LevelDefinition[] = CHAPTER_3_SPECS.map(buildCampaignLevel);

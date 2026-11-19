import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_9_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c9-long-horizon-40x25',
    name: '9-1: The Long Horizon (40x25)',
    chapter: 9,
    width: 40,
    height: 25,
    description: 'A maximum-width 40x25 horizon! Sweep four 34-step lanes from west to east and back.',
    hint: 'Use a(X):sa(X-1) with b(X,Y):a(34)Xa(3)Xb(Y,X) called via b(r,l).',
    maxBytes: 22,
    basePoints: 500,
    startRow: 6,
    startCol: 3,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(34)Xa(3)Xb(Y,X)\nb(r,l)',
    populate: (g): void => {
      traceWhitePath(g, 6, 3, 'r', 'a(X):sa(X-1)\nb(X,Y):a(34)Xa(3)Xb(Y,X)\nb(r,l)', 200, 4);
    },
  },
  {
    id: 'c9-skyscraper-shaft-25x40',
    name: '9-2: Skyscraper Shaft (25x40)',
    chapter: 9,
    width: 25,
    height: 40,
    description: 'A towering 25x40 vertical shaft! Zigzag down eight skyscraper floors with alternating turns.',
    hint: 'Use a(X):sa(X-1) and b(X,Y):a(14)Xa(4)Xb(Y,X) called with b(r,l).',
    maxBytes: 22,
    basePoints: 525,
    startRow: 4,
    startCol: 5,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(14)Xa(4)Xb(Y,X)\nb(r,l)',
    populate: (g): void => {
      traceWhitePath(g, 4, 5, 'r', 'a(X):sa(X-1)\nb(X,Y):a(14)Xa(4)Xb(Y,X)\nb(r,l)', 220, 4);
    },
  },
  {
    id: 'c9-checkerboard-plaza-32x32',
    name: '9-3: Checkerboard Plaza (32x32)',
    chapter: 9,
    width: 32,
    height: 32,
    description: 'Navigate a 32x32 plaza guarded by off-lane gray checker traps across six wide avenues.',
    hint: 'Sweep 24-step lanes spaced 4 rows apart using b(X,Y):a(24)Xa(4)Xb(Y,X) and b(r,l).',
    maxBytes: 22,
    basePoints: 550,
    startRow: 5,
    startCol: 4,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(24)Xa(4)Xb(Y,X)\nb(r,l)',
    populate: (g): void => {
      for (let r = 7; r <= 23; r += 4) {
        placeLine(g, r, 8, r, 24, 'g', 4);
      }
      traceWhitePath(g, 5, 4, 'r', 'a(X):sa(X-1)\nb(X,Y):a(24)Xa(4)Xb(Y,X)\nb(r,l)', 200, 4);
    },
  },
  {
    id: 'c9-twin-towers-38x30',
    name: '9-4: Twin Towers (38x30)',
    chapter: 9,
    width: 38,
    height: 30,
    description: 'Tour the perimeter of the West Tower, cross a 16-step skybridge, and tour the identical East Tower!',
    hint: 'Define a tower perimeter b:a(20)ra(6)ra(20)ra(6)r, then execute ba(16)b.',
    maxBytes: 23,
    basePoints: 575,
    startRow: 24,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(20)ra(6)ra(20)ra(6)r\nba(16)b',
    populate: (g): void => {
      placePoints(g, [[14, 9], [14, 25]], 'g');
      traceWhitePath(g, 24, 6, 'u', 'a(X):sa(X-1)\nb:a(20)ra(6)ra(20)ra(6)r\nba(16)b', 200, 4);
    },
  },
  {
    id: 'c9-grand-colosseum-40x40',
    name: '9-5: Grand Colosseum (40x40)',
    chapter: 9,
    width: 40,
    height: 40,
    description: 'Our largest 40x40 Colosseum! Spiral inward from a 34-step outer rim, shrinking by 3 steps each turn.',
    hint: 'Combine a(X):sa(X-1) with b(X):a(X)rb(X-3) and start at b(34).',
    maxBytes: 18,
    basePoints: 600,
    startRow: 36,
    startCol: 3,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)rb(X-3)\nb(34)',
    populate: (g): void => {
      traceWhitePath(g, 36, 3, 'u', 'a(X):sa(X-1)\nb(X):a(X)rb(X-3)\nb(34)', 400, 5);
    },
  },
];

export const CHAPTER_9_LEVELS: readonly LevelDefinition[] = CHAPTER_9_SPECS.map(buildCampaignLevel);

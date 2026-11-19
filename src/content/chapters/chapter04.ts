import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_4_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c4-twin-counters',
    name: '4-1: Twin Counters',
    chapter: 4,
    description: 'Patrol a 10x6 rectangular vault using a two-parameter procedure that holds both side lengths.',
    hint: 'Use a(X):sa(X-1) and b(X,Y):a(X)ra(Y)rb(X,Y), then call b(10,6).',
    maxBytes: 22,
    basePoints: 250,
    startRow: 15,
    startCol: 7,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(X)ra(Y)rb(X,Y)\nb(6,10)',
    populate: (g): void => {
      placeLine(g, 9, 7, 9, 17, 'w', 2);
      placeLine(g, 15, 7, 15, 17, 'w', 2);
      placePoints(g, [[12, 7], [12, 17]], 'w');
      placePoints(g, [[12, 12]], 'g');
    },
  },
  {
    id: 'c4-rectangular-sweep-32x25',
    name: '4-2: Rectangular Sweep (32x25)',
    chapter: 4,
    width: 32,
    height: 25,
    description: 'Sweep a 32x25 warehouse in serpentine rows using two numeric parameters for width and row spacing.',
    hint: 'Define a(X):sa(X-1) and b(X,Y):a(X)ra(Y)ra(X)la(Y)lb(X,Y), then call b(22,3).',
    maxBytes: 28,
    basePoints: 265,
    startRow: 6,
    startCol: 4,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(X)ra(Y)ra(X)la(Y)lb(X,Y)\nb(22,3)',
    populate: (g): void => {
      traceWhitePath(g, 6, 4, 'r', 'a(X):sa(X-1)\nb(X,Y):a(X)ra(Y)ra(X)la(Y)lb(X,Y)\nb(22,3)', 140, 4);
    },
  },
  {
    id: 'c4-the-comb',
    name: '4-3: The Comb',
    chapter: 4,
    description: 'Press 5 parallel comb teeth of length 6, returning to the spine after each tooth.',
    hint: 'Track remaining teeth X and tooth length Y: b(X,Y):a(Y)rra(Y)rssrb(X-1,Y) called with b(5,6).',
    maxBytes: 28,
    basePoints: 275,
    startRow: 17,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(Y)rra(Y)lsslb(X-1,Y)\nb(5,6)',
    populate: (g): void => {
      traceWhitePath(g, 17, 6, 'u', 'a(X):sa(X-1)\nb(X,Y):a(Y)rra(Y)lsslb(X-1,Y)\nb(5,6)', 150, 2);
    },
  },
  {
    id: 'c4-wide-boulevard-35x25',
    name: '4-4: Grand Boulevard (35x25)',
    chapter: 4,
    width: 35,
    height: 25,
    description:
      'A wide 35x25 rectangular arena! Sweep across three 26-step horizontal avenues connected by vertical turns.',
    hint: 'Use a(X):sa(X-1) with a helper b(X):a(26)Xa(4)X across the 35-column grid.',
    maxBytes: 22,
    basePoints: 285,
    startRow: 8,
    startCol: 4,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(26)Xa(4)X\nb(r)b(l)a(26)',
    populate: (g): void => {
      for (let c = 8; c <= 30; c += 4) {
        g[8]![c] = 'w';
        g[12]![c] = 'w';
        g[16]![c] = 'w';
      }
      placePoints(g, [[10, 17], [14, 17]], 'g');
    },
  },
  {
    id: 'c4-converging-frame',
    name: '4-5: Converging Frame',
    chapter: 4,
    description: 'Collapse a rectangular spiral inward by decrementing both width X and height Y by 2 each half-turn.',
    hint: 'Define b(X,Y):a(X)ra(Y)rb(X-2,Y-2) and start from b(14,10).',
    maxBytes: 25,
    basePoints: 300,
    startRow: 17,
    startCol: 5,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(X)ra(Y)rb(X-2,Y-2)\nb(14,10)',
    populate: (g): void => {
      traceWhitePath(g, 17, 5, 'r', 'a(X):sa(X-1)\nb(X,Y):a(X)ra(Y)rb(X-2,Y-2)\nb(14,10)', 180, 3);
    },
  },
];

export const CHAPTER_4_LEVELS: readonly LevelDefinition[] = CHAPTER_4_SPECS.map(buildCampaignLevel);

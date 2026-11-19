import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_5_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c5-power-of-two',
    name: '5-1: Power of Two',
    chapter: 5,
    description: 'Walk 16 steps east, turn right, and walk 8 steps south using a 2-byte doubling macro!',
    hint: 'Define a(X):XX to double any command sequence. Then a(a(a(a(s)))) walks 16 steps!',
    maxBytes: 15,
    basePoints: 300,
    startRow: 7,
    startCol: 4,
    startDir: 'r',
    referenceSolution: 'a(X):XX\na(a(a(a(s))))ra(a(a(s)))',
    populate: (g): void => {
      placeLine(g, 7, 6, 7, 20, 'w', 2);
      placeLine(g, 9, 20, 15, 20, 'w', 2);
      placePoints(g, [[7, 21], [16, 20]], 'g');
    },
  },
  {
    id: 'c5-macro-spiral',
    name: '5-2: 9-Byte Macro Spiral',
    chapter: 5,
    description:
      'Solve the expanding spiral with a strict 10-byte limit! Pass a command sequence X that grows by one s on each recursive call.',
    hint: 'Define a(X):Xra(Xs) and call a(s) - that is only 9 bytes total!',
    maxBytes: 10,
    basePoints: 315,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):Xra(Xs)\na(s)',
    populate: (g): void => {
      placePoints(g, [[11, 12], [11, 14], [14, 14], [14, 10], [9, 10], [9, 16], [16, 16]], 'w');
    },
  },
  {
    id: 'c5-zigzag-stairs',
    name: '5-3: Polymorphic Staircase',
    chapter: 5,
    description:
      'Climb the diagonal staircase while dodging gray traps on both sides by swapping two command-sequence arguments on every recursive step.',
    hint: 'Use a(X,Y):Xa(Y,X) called with a(ssr,ssl).',
    maxBytes: 16,
    basePoints: 325,
    startRow: 18,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X,Y):Xa(Y,X)\na(ssr,ssl)',
    populate: (g): void => {
      placePoints(g, [[16, 6], [16, 8], [14, 8], [14, 10], [12, 10], [12, 12], [10, 12]], 'w');
      placePoints(g, [[15, 6], [16, 9], [13, 8]], 'g');
    },
  },
  {
    id: 'c5-mirror-wings',
    name: '5-4: Mirror Wings',
    chapter: 5,
    description: 'Two symmetric wing corridors branch east and west. Parameterize the turn direction X to reuse one procedure for both!',
    hint: 'Write a(X):sssXsssXss and call a(r) to sweep the right wing, then flip with rr and call a(l) or adjust orientation.',
    maxBytes: 18,
    basePoints: 340,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):sssXsssXss\na(r)rra(l)',
    populate: (g): void => {
      traceWhitePath(g, 12, 12, 'u', 'a(X):sssXsssXss\na(r)rra(l)', 80, 2);
    },
  },
  {
    id: 'c5-macro-sawtooth-36x25',
    name: '5-5: Macro Sawtooth (36x25)',
    chapter: 5,
    width: 36,
    height: 25,
    description: 'March east across a 36x25 arena in a repeating square-wave sawtooth using a doubling macro.',
    hint: 'Use a(X):XX with b:a(s)ra(s)la(s)la(s)rb to stamp a crisp sawtooth wave across all 36 columns.',
    maxBytes: 20,
    basePoints: 350,
    startRow: 12,
    startCol: 3,
    startDir: 'r',
    referenceSolution: 'a(X):XX\nb:a(s)ra(s)la(s)la(s)rb\nb',
    populate: (g): void => {
      traceWhitePath(g, 12, 3, 'r', 'a(X):XX\nb:a(s)ra(s)la(s)la(s)rb\nb', 130, 2);
    },
  },
];

export const CHAPTER_5_LEVELS: readonly LevelDefinition[] = CHAPTER_5_SPECS.map(buildCampaignLevel);

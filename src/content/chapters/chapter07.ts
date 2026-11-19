import { buildCampaignLevel, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_7_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c7-classic-diamond',
    name: '7-1: Classic Diamond',
    chapter: 7,
    description: 'Trace a 4-fold symmetric diagonal diamond inspired by classic Imagine Cup puzzles.',
    hint: 'Climb 4 diagonal steps with a(X):srsla(X-1), then rotate 90 degrees in b:a(4)rb.',
    maxBytes: 16,
    basePoints: 400,
    startRow: 12,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a(X):srsla(X-1)\nb:a(4)rb\nb',
    populate: (g): void => {
      placePoints(g, [[12, 12]], 'g');
      traceWhitePath(g, 12, 8, 'u', 'a(X):srsla(X-1)\nb:a(4)rb\nb', 120, 2);
    },
  },
  {
    id: 'c7-classic-windmill',
    name: '7-2: Classic Windmill',
    chapter: 7,
    description: 'Sweep all four hooked blades of a rotating windmill centered at the middle of the arena.',
    hint: 'Walk each blade out and back with a(X):sa(X-1) and b:a(5)rssrrssla(5)rb.',
    maxBytes: 22,
    basePoints: 415,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(5)rssrrssla(5)rb\nb',
    populate: (g): void => {
      traceWhitePath(g, 12, 12, 'u', 'a(X):sa(X-1)\nb:a(5)rssrrssla(5)rb\nb', 160, 2);
    },
  },
  {
    id: 'c7-classic-snake',
    name: '7-3: Classic Snake',
    chapter: 7,
    description: 'Coil across the board in a classic back-and-forth S-curve snake by swapping left and right turn arguments.',
    hint: 'Combine a(X):sa(X-1) with b(X,Y):a(12)Xa(2)Xb(Y,X) called via b(r,l).',
    maxBytes: 22,
    basePoints: 425,
    startRow: 6,
    startCol: 6,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb(X,Y):a(12)Xa(2)Xb(Y,X)\nb(r,l)',
    populate: (g): void => {
      traceWhitePath(g, 6, 6, 'r', 'a(X):sa(X-1)\nb(X,Y):a(12)Xa(2)Xb(Y,X)\nb(r,l)', 120, 3);
    },
  },
  {
    id: 'c7-classic-stairway',
    name: '7-4: Classic Stairway',
    chapter: 7,
    description: 'Ascend a tapering stairway whose horizontal and vertical treads shrink by 1 step at every landing.',
    hint: 'Define a(X):sa(X-1) and b(X):a(X)ra(X)lb(X-1), starting at b(5).',
    maxBytes: 19,
    basePoints: 440,
    startRow: 19,
    startCol: 5,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)ra(X)lb(X-1)\nb(5)',
    populate: (g): void => {
      traceWhitePath(g, 19, 5, 'u', 'a(X):sa(X-1)\nb(X):a(X)ra(X)lb(X-1)\nb(5)', 120, 2);
    },
  },
  {
    id: 'c7-pinwheel-courtyard',
    name: '7-5: Pinwheel Courtyard',
    chapter: 7,
    description: 'Tour four interlocking L-shaped courtyard wings in a single symmetric pinwheel loop.',
    hint: 'Each wing makes three right turns (270 degrees = 90 degrees left): b:a(6)ra(3)ra(6)rb.',
    maxBytes: 18,
    basePoints: 450,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(6)ra(3)ra(6)rb\nb',
    populate: (g): void => {
      traceWhitePath(g, 12, 12, 'u', 'a(X):sa(X-1)\nb:a(6)ra(3)ra(6)rb\nb', 160, 2);
    },
  },
];

export const CHAPTER_7_LEVELS: readonly LevelDefinition[] = CHAPTER_7_SPECS.map(buildCampaignLevel);

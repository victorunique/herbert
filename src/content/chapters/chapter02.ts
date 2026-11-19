import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_2_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c2-dead-end-bounce',
    name: '2-1: Dead-End Bounce',
    chapter: 2,
    description: 'Two solid walls cap a horizontal corridor. Overshoot into each wall and U-turn to light buttons on both sides.',
    hint: 'Walking into a wall is harmless. Try a:ssssssrr followed by aa.',
    maxBytes: 12,
    basePoints: 150,
    startRow: 12,
    startCol: 12,
    startDir: 'r',
    referenceSolution: 'a:ssssssrr\naa',
    populate: (g): void => {
      placePoints(g, [[12, 16], [12, 9]], '*');
      placePoints(g, [[12, 14], [12, 15], [12, 10], [12, 11]], 'w');
    },
  },
  {
    id: 'c2-wall-alignment',
    name: '2-2: Wall Alignment Vault',
    chapter: 2,
    description:
      'Four corridors of unequal lengths (4, 7, 5, and 9 steps) each end in a solid wall. Use wall alignment (overshooting into walls) to tour all four corridors with a single loop!',
    hint: 'Bumping into a wall does not hurt Herbert. Walk 9 steps every side and let the wall stop you!',
    maxBytes: 15,
    basePoints: 165,
    startRow: 12,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(9)rb\nb',
    populate: (g): void => {
      placePoints(g, [[7, 8], [8, 16], [14, 15], [13, 5]], '*');
      placePoints(g, [[9, 8], [8, 12], [8, 15], [11, 15], [13, 15], [13, 10], [13, 6]], 'w');
    },
  },
  {
    id: 'c2-pinball-corridor',
    name: '2-3: Pinball Corridor',
    chapter: 2,
    description: 'Zigzag up a walled chute by alternating right-turn and left-turn wall bounces.',
    hint: 'Define a:ssssr and b:ssssl, then alternate them inside c:abc.',
    maxBytes: 18,
    basePoints: 175,
    startRow: 20,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a:ssssr\nb:ssssl\nc:abc\nc',
    populate: (g): void => {
      placePoints(g, [[16, 8], [16, 12], [12, 12], [12, 16], [8, 16]], '*');
      traceWhitePath(g, 20, 8, 'u', 'a:ssssr\nb:ssssl\nc:abc\nc', 45, 2);
    },
  },
  {
    id: 'c2-boxed-in',
    name: '2-4: Boxed In',
    chapter: 2,
    description: 'An asymmetric walled chamber guides Herbert inward when you repeatedly walk 12 steps and turn right.',
    hint: 'Use a(X):sa(X-1) with b:a(12)rb and let the inner stopper walls align every turn.',
    maxBytes: 14,
    basePoints: 185,
    startRow: 18,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(12)rb\nb',
    populate: (g): void => {
      placePoints(g, [[5, 6], [6, 19], [19, 18], [18, 8], [8, 9], [9, 16], [16, 15]], '*');
      traceWhitePath(g, 18, 6, 'u', 'a(X):sa(X-1)\nb:a(12)rb\nb', 110, 3);
    },
  },
  {
    id: 'c2-narrow-gauntlet-30x25',
    name: '2-5: The Narrow Gauntlet (30x25)',
    chapter: 2,
    width: 30,
    height: 25,
    description: 'A 30x25 rectangular arena! Sweep the long walled track by overshooting into the far walls.',
    hint: 'Use a(X):sa(X-1) and loop b:a(26)ra(4)rb against the eastern and western boundary walls.',
    maxBytes: 16,
    basePoints: 200,
    startRow: 10,
    startCol: 3,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb:a(26)ra(4)rb\nb',
    populate: (g): void => {
      placeLine(g, 10, 6, 10, 26, 'w', 4);
      placeLine(g, 14, 6, 14, 26, 'w', 4);
      placeLine(g, 12, 8, 12, 22, 'g', 7);
    },
  },
];

export const CHAPTER_2_LEVELS: readonly LevelDefinition[] = CHAPTER_2_SPECS.map(buildCampaignLevel);

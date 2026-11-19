import { buildCampaignLevel, placeLine, placePoints, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_1_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c1-hello-herbert',
    name: '1-1: Hello Herbert',
    chapter: 1,
    description: 'Press all 4 white buttons in a straight line ahead, or use a 4-byte infinite loop!',
    hint: 'Try writing ssss (4 bytes) or a recursive procedure a:sa followed by a (4 bytes).',
    maxBytes: 6,
    basePoints: 100,
    startRow: 12,
    startCol: 8,
    startDir: 'r',
    referenceSolution: 'a:sa\na',
    populate: (g): void => {
      placeLine(g, 12, 10, 12, 16, 'w', 2);
    },
  },
  {
    id: 'c1-right-angle-relay',
    name: '1-2: Right-Angle Relay',
    chapter: 1,
    description: 'Walk 5 steps east, turn right, and walk 5 steps south to light both corridors.',
    hint: 'Reuse a 5-step helper procedure: a:sssss followed by ara.',
    maxBytes: 12,
    basePoints: 110,
    startRow: 9,
    startCol: 9,
    startDir: 'r',
    referenceSolution: 'a:sssss\nara',
    populate: (g): void => {
      placeLine(g, 9, 10, 9, 14, 'w', 2);
      placeLine(g, 10, 14, 14, 14, 'w', 2);
      placePoints(g, [[9, 15], [15, 14]], 'g');
    },
  },
  {
    id: 'c1-perimeter-patrol',
    name: '1-3: Perimeter Patrol',
    chapter: 1,
    description: 'Patrol all four sides of a 6x6 courtyard in a single endless loop without touching the center traps.',
    hint: 'Define a:ssssssra and call a to repeat 6 steps and a right turn forever.',
    maxBytes: 10,
    basePoints: 120,
    startRow: 9,
    startCol: 9,
    startDir: 'r',
    referenceSolution: 'a:ssssssra\na',
    populate: (g): void => {
      placeLine(g, 9, 11, 9, 15, 'w', 2);
      placeLine(g, 11, 15, 15, 15, 'w', 2);
      placeLine(g, 15, 13, 15, 9, 'w', 2);
      placeLine(g, 13, 9, 11, 9, 'w', 2);
      placePoints(g, [[12, 12], [11, 12], [13, 12], [12, 11], [12, 13]], 'g');
    },
  },
  {
    id: 'c1-four-corners',
    name: '1-4: Four Corners',
    chapter: 1,
    description:
      'Herbert starts inside a ring of 4 gray traps, with 4 white buttons at the outer corners. Step out before lighting any buttons, then loop the outer square!',
    hint: 'Stepping on a gray button when 0 white buttons are lit loses nothing! Exit to (10,10) with sslss, then loop with a:lssssa.',
    maxBytes: 16,
    basePoints: 135,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a:lssssa\nsslssa',
    populate: (g): void => {
      placePoints(g, [[11, 12], [13, 12], [12, 11], [12, 13]], 'g');
      placePoints(g, [[10, 10], [10, 14], [14, 10], [14, 14]], 'w');
    },
  },
  {
    id: 'c1-twin-squares',
    name: '1-5: Twin Squares',
    chapter: 1,
    description: 'Trace two adjacent 3x3 loops in a figure-eight pattern: clockwise on the right, counter-clockwise on the left.',
    hint: 'Create two small turning helpers a:sssr and c:sssl, double them with b:aa and d:cc, then call bbdd.',
    maxBytes: 22,
    basePoints: 150,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a:sssr\nb:aa\nc:sssl\nd:cc\nbbdd',
    populate: (g): void => {
      placePoints(g, [[9, 12], [9, 15], [12, 15], [9, 9], [12, 9]], 'w');
      placePoints(g, [[11, 14], [11, 10]], 'g');
    },
  },
];

export const CHAPTER_1_LEVELS: readonly LevelDefinition[] = CHAPTER_1_SPECS.map(buildCampaignLevel);

import { buildCampaignLevel, placeLine, placePoints, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_6_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c6-gray-sacrifice',
    name: '6-1: The Gray Sacrifice',
    chapter: 6,
    description:
      'A gray trap sits at (13,10) right below a white button at (12,10). Walk straight through both around the 4x4 square: the gray trap resets (12,10) on lap 1, and lap 2 re-lights (12,10) for instant victory right before the trap!',
    hint: 'Use a(X):sa(X-1) and b:a(4)lb so Herbert loops the 4x4 square and wins on the second visit to (12,10).',
    maxBytes: 15,
    basePoints: 350,
    startRow: 10,
    startCol: 10,
    startDir: 'd',
    referenceSolution: 'a(X):sa(X-1)\nb:a(4)lb\nb',
    populate: (g): void => {
      placePoints(g, [[13, 10]], 'g');
      placePoints(g, [[12, 10], [14, 12], [14, 14], [12, 14], [10, 14], [10, 12]], 'w');
    },
  },
  {
    id: 'c6-minefield-slalom',
    name: '6-2: Minefield Slalom',
    chapter: 6,
    description: 'Slalom diagonally through a tightly packed corridor of gray mines and stop before the final trap.',
    hint: 'Define a(X):ssrssla(X-1) and call a(6) to stop immediately before the mine at the end.',
    maxBytes: 14,
    basePoints: 365,
    startRow: 20,
    startCol: 4,
    startDir: 'u',
    referenceSolution: 'a(X):ssrssla(X-1)\na(6)',
    populate: (g): void => {
      placePoints(g, [[19, 5], [17, 7], [15, 9], [13, 11], [11, 13], [9, 15], [7, 16]], 'g');
      traceWhitePath(g, 20, 4, 'u', 'a(X):ssrssla(X-1)\na(6)', 150, 2);
    },
  },
  {
    id: 'c6-reset-bridge',
    name: '6-3: Reset Bridge',
    chapter: 6,
    description: 'A narrow walled bridge contains a gray reset tile. Cross it while 0 white buttons are lit, then loop the eastern vault.',
    hint: 'Walk 5 steps across the gray bridge first (sssss), then enter an endless 6x6 square loop a:ssssssra.',
    maxBytes: 16,
    basePoints: 375,
    startRow: 9,
    startCol: 5,
    startDir: 'r',
    referenceSolution: 'a:ssssssra\nsssssa',
    populate: (g): void => {
      placeLine(g, 8, 6, 8, 9, '*', 1);
      placeLine(g, 10, 6, 10, 9, '*', 1);
      placePoints(g, [[9, 8]], 'g');
      placePoints(g, [[9, 13], [9, 16], [12, 16], [15, 16], [15, 13], [15, 10], [12, 10]], 'w');
    },
  },
  {
    id: 'c6-false-dawn',
    name: '6-4: False Dawn',
    chapter: 6,
    description: 'A gray button guards the first edge of a 6x6 clockwise loop. Accept the early reset so lap 2 finishes the puzzle!',
    hint: 'Loop the 6x6 square with a(X):sa(X-1) and b:a(6)rb. The white button before the gray trap will be the final button lit on lap 2.',
    maxBytes: 16,
    basePoints: 385,
    startRow: 9,
    startCol: 9,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb:a(6)rb\nb',
    populate: (g): void => {
      placePoints(g, [[9, 11], [9, 15], [12, 15], [15, 15], [15, 12], [15, 9], [12, 9]], 'w');
      placePoints(g, [[9, 13]], 'g');
    },
  },
  {
    id: 'c6-twin-sacrifices',
    name: '6-5: Twin Sacrifices',
    chapter: 6,
    description: 'Two white buttons sit ahead of a gray trap on the opening corridor of a 5x5 square. Sacrifice both on lap 1 and reclaim them on lap 2.',
    hint: 'Loop the 5x5 perimeter with a(X):sa(X-1) and b:a(5)rb so both opening buttons re-light just before the gray trap on lap 2.',
    maxBytes: 16,
    basePoints: 400,
    startRow: 10,
    startCol: 10,
    startDir: 'r',
    referenceSolution: 'a(X):sa(X-1)\nb:a(5)rb\nb',
    populate: (g): void => {
      placePoints(g, [[10, 11], [10, 12], [10, 15], [12, 15], [15, 15], [15, 12], [15, 10], [12, 10]], 'w');
      placePoints(g, [[10, 13]], 'g');
    },
  },
];

export const CHAPTER_6_LEVELS: readonly LevelDefinition[] = CHAPTER_6_SPECS.map(buildCampaignLevel);

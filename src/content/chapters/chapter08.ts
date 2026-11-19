import { buildCampaignLevel, traceWhitePath, type GridBuilderSpec } from '../levelBuilder';
import type { LevelDefinition } from '../../core/types';

const CHAPTER_8_SPECS: readonly GridBuilderSpec[] = [
  {
    id: 'c8-hilbert-order-2',
    name: '8-1: Hilbert Order 2',
    chapter: 8,
    description: 'Trace a classic Order-2 Hilbert space-filling curve using a single mutually-symmetric recursive procedure!',
    hint: 'Pass depth N and turn pair (X,Y): a(N,X,Y):Xa(N-1,Y,X)sYa(N-1,X,Y)sa(N-1,X,Y)Ysa(N-1,Y,X)X and call a(2,l,r).',
    maxBytes: 38,
    basePoints: 450,
    startRow: 16,
    startCol: 10,
    startDir: 'u',
    referenceSolution: 'a(N,X,Y):Xa(N-1,Y,X)sYa(N-1,X,Y)sa(N-1,X,Y)Ysa(N-1,Y,X)X\na(2,l,r)',
    populate: (g): void => {
      traceWhitePath(
        g,
        16,
        10,
        'u',
        'a(N,X,Y):Xa(N-1,Y,X)sYa(N-1,X,Y)sa(N-1,X,Y)Ysa(N-1,Y,X)X\na(2,l,r)',
        200,
        1,
      );
    },
  },
  {
    id: 'c8-dragon-fold',
    name: '8-2: Dragon Fold',
    chapter: 8,
    description: 'Unfold an Order-4 Heighway Dragon fractal curve using mutual recursion between two procedures a(N) and b(N).',
    hint: 'Define a(N):a(N-1)rb(N-1)s and b(N):sa(N-1)lb(N-1), then start with sa(4).',
    maxBytes: 26,
    basePoints: 475,
    startRow: 14,
    startCol: 14,
    startDir: 'u',
    referenceSolution: 'a(N):a(N-1)rb(N-1)s\nb(N):sa(N-1)lb(N-1)\nsa(4)',
    populate: (g): void => {
      traceWhitePath(g, 14, 14, 'u', 'a(N):a(N-1)rb(N-1)s\nb(N):sa(N-1)lb(N-1)\nsa(4)', 200, 1);
    },
  },
  {
    id: 'c8-binary-tree-canopy',
    name: '8-3: Binary Tree Canopy',
    chapter: 8,
    description: 'Explore every branch of a depth-3 recursive binary tree and backtrack cleanly to each fork.',
    hint: 'Use a(X):ssla(X-1)rra(X-1)rssrr so every recursive call returns to its trunk facing the original direction.',
    maxBytes: 22,
    basePoints: 500,
    startRow: 18,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):ssla(X-1)rra(X-1)rssrr\na(3)',
    populate: (g): void => {
      traceWhitePath(g, 18, 12, 'u', 'a(X):ssla(X-1)rra(X-1)rssrr\na(3)', 250, 2);
    },
  },
  {
    id: 'c8-sierpinski-steps',
    name: '8-4: Sierpinski Steps',
    chapter: 8,
    description: 'Generate a self-similar fractal step pattern with triple self-recursion.',
    hint: 'Define a(X):a(X-1)rsa(X-1)la(X-1) and call a(3).',
    maxBytes: 18,
    basePoints: 525,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):a(X-1)rsa(X-1)la(X-1)\na(3)',
    populate: (g): void => {
      traceWhitePath(g, 12, 12, 'u', 'a(X):a(X-1)rsa(X-1)la(X-1)\na(3)', 200, 1);
    },
  },
  {
    id: 'c8-koch-cross',
    name: '8-5: Koch Cross',
    chapter: 8,
    description: 'Construct a closed Level-2 Koch square fractal cross using higher-order macro composition!',
    hint: 'Define a(X):XlXrXrXlX to replace any segment X with a square bump, then loop b:a(a(s))rb.',
    maxBytes: 18,
    basePoints: 550,
    startRow: 17,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a(X):XlXrXrXlX\nb:a(a(s))rb\nb',
    populate: (g): void => {
      traceWhitePath(g, 17, 8, 'u', 'a(X):XlXrXrXlX\nb:a(a(s))rb\nb', 300, 2);
    },
  },
];

export const CHAPTER_8_LEVELS: readonly LevelDefinition[] = CHAPTER_8_SPECS.map(buildCampaignLevel);

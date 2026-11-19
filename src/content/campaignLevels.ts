import { parseLevelText } from '../core/levelCodec';
import type { LevelDefinition, RobotDirection } from '../core/types';

export interface CampaignChapter {
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
}

export const CAMPAIGN_CHAPTERS: readonly CampaignChapter[] = [
  {
    number: 1,
    title: 'Chapter 1: First Steps & Procedures',
    subtitle: 'Master basic movement (s, l, r), walls, gray traps, and infinite loops.',
  },
  {
    number: 2,
    title: 'Chapter 2: Counting & Numeric Recursion',
    subtitle: 'Control exact distances using numeric arguments and the <= 0 base case.',
  },
  {
    number: 3,
    title: 'Chapter 3: Higher-Order Macros',
    subtitle: 'Pass command sequences as arguments to double steps and grow fractal paths.',
  },
  {
    number: 4,
    title: 'Chapter 4: Imagine Cup Classics & Wide Arenas',
    subtitle: 'Combine wall alignment, strategic gray resets, and rectangular odd-dimension maps.',
  },
];

interface GridBuilderSpec {
  readonly id: string;
  readonly name: string;
  readonly chapter: number;
  readonly description: string;
  readonly hint: string;
  readonly width?: number;
  readonly height?: number;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly startRow: number;
  readonly startCol: number;
  readonly startDir: RobotDirection;
  readonly referenceSolution: string;
  readonly populate: (grid: string[][]) => void;
}

function buildCampaignLevel(spec: GridBuilderSpec): LevelDefinition {
  const width = spec.width ?? 25;
  const height = spec.height ?? 25;
  const rows: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) =>
      r === 0 || r === height - 1 || c === 0 || c === width - 1 ? '*' : '.',
    ),
  );
  spec.populate(rows);
  rows[spec.startRow]![spec.startCol] = spec.startDir;
  const rawText = rows.map((r) => r.join('')).join('\n');
  const parsed = parseLevelText(rawText, {
    id: spec.id,
    fallbackName: spec.name,
    chapter: spec.chapter,
    description: spec.description,
    hint: spec.hint,
    maxBytes: spec.maxBytes,
    basePoints: spec.basePoints,
    referenceSolution: spec.referenceSolution,
  });
  return parsed.level!;
}

const LEVEL_SPECS: readonly GridBuilderSpec[] = [
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
      for (let c = 10; c <= 16; c += 2) g[12]![c] = 'w';
    },
  },
  {
    id: 'c1-four-corners',
    name: '1-2: Four Corners',
    chapter: 1,
    description:
      'Herbert starts inside a ring of 4 gray traps, with 4 white buttons at the outer corners. Step out before lighting any buttons, then loop the outer square!',
    hint: 'Stepping on a gray button when 0 white buttons are lit loses nothing! Exit to (10,10) with sslss, then loop with a:lssssa.',
    maxBytes: 16,
    basePoints: 150,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a:lssssa\nsslssa',
    populate: (g): void => {
      g[11]![12] = 'g';
      g[13]![12] = 'g';
      g[12]![11] = 'g';
      g[12]![13] = 'g';
      g[10]![10] = 'w';
      g[10]![14] = 'w';
      g[14]![10] = 'w';
      g[14]![14] = 'w';
    },
  },
  {
    id: 'c2-precision-stop',
    name: '2-1: Precision Countdown',
    chapter: 2,
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
      for (let c = 7; c <= 13; c += 1) g[12]![c] = 'w';
      g[12]![14] = 'g';
      for (let r = 13; r <= 16; r += 1) g[r]![13] = 'w';
    },
  },
  {
    id: 'c2-numeric-spiral',
    name: '2-2: Arithmetic Spiral',
    chapter: 2,
    description:
      'Light up the expanding clockwise spiral of white buttons by incrementing your step count after every 90-degree right turn.',
    hint: 'Combine a countdown step helper a(X):sa(X-1) with a growing spiral b(X):a(X)rb(X+1).',
    maxBytes: 18,
    basePoints: 250,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb(X):a(X)rb(X+1)\nb(1)',
    populate: (g): void => {
      g[11]![12] = 'w';
      g[11]![14] = 'w';
      g[14]![14] = 'w';
      g[14]![10] = 'w';
      g[9]![10] = 'w';
      g[9]![16] = 'w';
    },
  },
  {
    id: 'c3-macro-spiral',
    name: '3-1: 9-Byte Macro Spiral',
    chapter: 3,
    description:
      'Solve the expanding spiral with a strict 10-byte limit! Pass a command sequence X that grows by one s on each recursive call.',
    hint: 'Define a(X):Xra(Xs) and call a(s) - that is only 9 bytes total!',
    maxBytes: 10,
    basePoints: 300,
    startRow: 12,
    startCol: 12,
    startDir: 'u',
    referenceSolution: 'a(X):Xra(Xs)\na(s)',
    populate: (g): void => {
      g[11]![12] = 'w';
      g[11]![14] = 'w';
      g[14]![14] = 'w';
      g[14]![10] = 'w';
      g[9]![10] = 'w';
      g[9]![16] = 'w';
      g[16]![16] = 'w';
    },
  },
  {
    id: 'c3-zigzag-stairs',
    name: '3-2: Polymorphic Staircase',
    chapter: 3,
    description:
      'Climb the diagonal staircase while dodging gray traps on both sides by swapping two command-sequence arguments on every recursive step.',
    hint: 'Use a(X,Y):Xa(Y,X) called with a(ssr,ssl).',
    maxBytes: 16,
    basePoints: 350,
    startRow: 18,
    startCol: 6,
    startDir: 'u',
    referenceSolution: 'a(X,Y):Xa(Y,X)\na(ssr,ssl)',
    populate: (g): void => {
      g[16]![6] = 'w';
      g[16]![8] = 'w';
      g[14]![8] = 'w';
      g[14]![10] = 'w';
      g[12]![10] = 'w';
      g[12]![12] = 'w';
      g[10]![12] = 'w';
      g[15]![6] = 'g';
      g[16]![9] = 'g';
      g[13]![8] = 'g';
    },
  },
  {
    id: 'c4-wall-alignment',
    name: '4-1: Wall Alignment Vault',
    chapter: 4,
    description:
      'Four corridors of unequal lengths (4, 7, 5, and 9 steps) each end in a solid wall. Use wall alignment (overshooting into walls) to tour all four corridors with a single loop!',
    hint: 'Bumping into a wall does not hurt Herbert. Walk 9 steps every side and let the wall stop you!',
    maxBytes: 15,
    basePoints: 400,
    startRow: 12,
    startCol: 8,
    startDir: 'u',
    referenceSolution: 'a(X):sa(X-1)\nb:a(9)rb\nb',
    populate: (g): void => {
      g[7]![8] = '*';
      g[9]![8] = 'w';
      g[8]![16] = '*';
      g[8]![12] = 'w';
      g[8]![15] = 'w';
      g[14]![15] = '*';
      g[11]![15] = 'w';
      g[13]![15] = 'w';
      g[13]![5] = '*';
      g[13]![10] = 'w';
      g[13]![6] = 'w';
    },
  },
  {
    id: 'c4-wide-boulevard-35x25',
    name: '4-2: Grand Boulevard (35x25)',
    chapter: 4,
    width: 35,
    height: 25,
    description:
      'A wide 35x25 rectangular odd-dimension arena! Sweep across three 26-step horizontal avenues connected by vertical turns.',
    hint: 'Use a(X):sa(X-1) with a helper b(X):a(26)Xa(4)X across the 35-column grid.',
    maxBytes: 22,
    basePoints: 450,
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
      g[10]![17] = 'g';
      g[14]![17] = 'g';
    },
  },
  {
    id: 'c4-gray-sacrifice',
    name: '4-3: The Gray Sacrifice',
    chapter: 4,
    description:
      'A gray trap sits at (13,10) right below a white button at (12,10). Walk straight through both around the 4x4 square: the gray trap resets (12,10) on lap 1, and lap 2 re-lights (12,10) for instant victory right before the trap!',
    hint: 'Use a(X):sa(X-1) and b:a(4)lb so Herbert loops the 4x4 square and wins on the second visit to (12,10).',
    maxBytes: 15,
    basePoints: 500,
    startRow: 10,
    startCol: 10,
    startDir: 'd',
    referenceSolution: 'a(X):sa(X-1)\nb:a(4)lb\nb',
    populate: (g): void => {
      g[12]![10] = 'w';
      g[13]![10] = 'g';
      g[14]![12] = 'w';
      g[14]![14] = 'w';
      g[12]![14] = 'w';
      g[10]![14] = 'w';
      g[10]![12] = 'w';
    },
  },
];

export const CAMPAIGN_LEVELS: readonly LevelDefinition[] = LEVEL_SPECS.map(buildCampaignLevel);

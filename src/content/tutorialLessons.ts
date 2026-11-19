import { parseLevelText } from '../core/levelCodec';
import type { LevelDefinition, RobotDirection } from '../core/types';

export interface TutorialLesson {
  readonly id: string;
  readonly stepNumber: number;
  readonly title: string;
  readonly conceptBadge: string;
  readonly explanation: string;
  readonly keyTakeaways: readonly string[];
  readonly starterCode: string;
  readonly sampleSolution: string;
  readonly level: LevelDefinition;
}

function makeTutorialLevel(params: {
  readonly id: string;
  readonly name: string;
  readonly maxBytes: number;
  readonly startRow: number;
  readonly startCol: number;
  readonly startDir: RobotDirection;
  readonly populate: (g: string[][]) => void;
}): LevelDefinition {
  const rows: string[][] = Array.from({ length: 25 }, (_, r) =>
    Array.from({ length: 25 }, (__, c) =>
      r === 0 || r === 24 || c === 0 || c === 24 ? '*' : '.',
    ),
  );
  params.populate(rows);
  rows[params.startRow]![params.startCol] = params.startDir;
  const parsed = parseLevelText(rows.map((r) => r.join('')).join('\n'), {
    id: params.id,
    fallbackName: params.name,
    maxBytes: params.maxBytes,
    basePoints: 100,
  });
  return parsed.level!;
}

export const TUTORIAL_LESSONS: readonly TutorialLesson[] = [
  {
    id: 'lesson-1-primitives',
    stepNumber: 1,
    title: '1. Meet Herbert: Move & Turn (s, l, r)',
    conceptBadge: 'Primitives: s, l, r',
    explanation:
      'Herbert understands 3 basic single-letter commands: "s" (step forward 1 cell), "l" (turn left 90 degrees in place), and "r" (turn right 90 degrees in place). Your goal is to step onto every White Button (w) to light them all up!',
    keyTakeaways: [
      's = step forward 1 cell in the direction Herbert is facing.',
      'l = turn 90 degrees left (counter-clockwise); r = turn 90 degrees right (clockwise).',
      'Re-stepping on an already lit white button is completely safe.',
    ],
    starterCode: 'ssr',
    sampleSolution: 'ssrss',
    level: makeTutorialLevel({
      id: 'tut-1',
      name: 'Tutorial 1: Move & Turn',
      maxBytes: 6,
      startRow: 12,
      startCol: 10,
      startDir: 'u',
      populate: (g) => {
        g[10]![10] = 'w';
        g[10]![12] = 'w';
      },
    }),
  },
  {
    id: 'lesson-2-walls-and-traps',
    stepNumber: 2,
    title: '2. Walls (*) vs. Gray Button Traps (g)',
    conceptBadge: 'Physics & Traps',
    explanation:
      'Walls (*) block movement harmlessly: bumping into a wall leaves Herbert in place without crashing. Gray Buttons (g), however, are reset traps! Stepping on a gray button immediately resets ALL previously lit white buttons back to unlit.',
    keyTakeaways: [
      'Bumping into a Wall (*) is harmless and often useful to align Herbert.',
      'Stepping on a Gray Button (g) resets all lit White Buttons back to 0.',
      'Route around the gray button in the center to keep your progress!',
    ],
    starterCode: 'slss',
    sampleSolution: 'slssrss',
    level: makeTutorialLevel({
      id: 'tut-2',
      name: 'Tutorial 2: Dodging Gray Traps',
      maxBytes: 9,
      startRow: 14,
      startCol: 12,
      startDir: 'u',
      populate: (g) => {
        g[13]![12] = 'w';
        g[12]![12] = 'g';
        g[11]![10] = 'w';
      },
    }),
  },
  {
    id: 'lesson-3-procedures',
    stepNumber: 3,
    title: '3. Procedures & Endless Tail Recursion',
    conceptBadge: 'Procedures (a:body)',
    explanation:
      'Any lowercase letter except s, l, r (such as a, b, f) can define a reusable procedure on its own line before the final execution line. Even better: a level is solved the exact instant the last white button lights up, so an endless recursive loop like a:ssra will win automatically!',
    keyTakeaways: [
      'Define a procedure with name:body (e.g., a:ssra).',
      'A procedure can call itself at the end (tail recursion) to repeat forever.',
      'The game stops and declares victory the moment all white buttons are lit.',
    ],
    starterCode: 'a:ssra\n',
    sampleSolution: 'a:ssra\na',
    level: makeTutorialLevel({
      id: 'tut-3',
      name: 'Tutorial 3: Endless Square Loop',
      maxBytes: 8,
      startRow: 13,
      startCol: 11,
      startDir: 'u',
      populate: (g) => {
        g[11]![11] = 'w';
        g[11]![13] = 'w';
        g[13]![13] = 'w';
      },
    }),
  },
  {
    id: 'lesson-4-numeric-recursion',
    stepNumber: 4,
    title: '4. Numeric Arguments & The <= 0 Stop Rule',
    conceptBadge: 'Numeric Recursion',
    explanation:
      'H has no "if" or "for" keywords! Instead, uppercase letters (A-Z) act as parameters. When you call a procedure with a numeric argument that evaluates to 0 or negative (<= 0), that procedure call is skipped completely.',
    keyTakeaways: [
      'Parameters use single UPPERCASE letters (e.g., X, N).',
      'a(X):sa(X-1) steps forward X times and automatically stops when X-1 reaches 0.',
      'Punctuation : ( ) , + - and multi-digit digits are FREE (a whole number costs just 1 byte)!',
    ],
    starterCode: 'a(X):sa(X-1)\n',
    sampleSolution: 'a(X):sa(X-1)\na(6)ra(3)',
    level: makeTutorialLevel({
      id: 'tut-4',
      name: 'Tutorial 4: Countdown Stop',
      maxBytes: 12,
      startRow: 14,
      startCol: 8,
      startDir: 'r',
      populate: (g) => {
        g[14]![11] = 'w';
        g[14]![14] = 'w';
        g[14]![15] = 'g';
        g[17]![14] = 'w';
      },
    }),
  },
  {
    id: 'lesson-5-higher-order-macros',
    stepNumber: 5,
    title: '5. Higher-Order Code Arguments & Byte Golfing',
    conceptBadge: 'Code-as-Data & Bytes',
    explanation:
      'Parameters in H can also hold command sequences! For example, a(X):XX runs whatever action X you pass twice, and a(X):Xra(Xs) appends an extra step "s" on every recursive turn to draw an expanding spiral in just 9 bytes.',
    keyTakeaways: [
      'Pass command sequences directly into parameters: a(X):Xra(Xs) called with a(s).',
      'Byte Counting Rule: Each letter = 1 Byte, each number literal = 1 Byte.',
      'Colon (:), parentheses (), comma (,), plus (+), minus (-), and spaces cost 0 Bytes!',
    ],
    starterCode: 'a(X):Xra(Xs)\n',
    sampleSolution: 'a(X):Xra(Xs)\na(s)',
    level: makeTutorialLevel({
      id: 'tut-5',
      name: 'Tutorial 5: Macro Spiral',
      maxBytes: 10,
      startRow: 12,
      startCol: 12,
      startDir: 'u',
      populate: (g) => {
        g[11]![12] = 'w';
        g[11]![14] = 'w';
        g[14]![14] = 'w';
        g[14]![10] = 'w';
      },
    }),
  },
];

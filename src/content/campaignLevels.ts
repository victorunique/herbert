import type { LevelDefinition } from '../core/types';
import { CHAPTER_1_LEVELS } from './chapters/chapter01';
import { CHAPTER_2_LEVELS } from './chapters/chapter02';
import { CHAPTER_3_LEVELS } from './chapters/chapter03';
import { CHAPTER_4_LEVELS } from './chapters/chapter04';
import { CHAPTER_5_LEVELS } from './chapters/chapter05';
import { CHAPTER_6_LEVELS } from './chapters/chapter06';
import { CHAPTER_7_LEVELS } from './chapters/chapter07';
import { CHAPTER_8_LEVELS } from './chapters/chapter08';
import { CHAPTER_9_LEVELS } from './chapters/chapter09';
import { CHAPTER_10_LEVELS } from './chapters/chapter10';

export interface CampaignChapter {
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly difficulty: string;
}

export const CAMPAIGN_CHAPTERS: readonly CampaignChapter[] = [
  {
    number: 1,
    title: 'Chapter 1: First Steps & Endless Loops',
    subtitle: 'Master basic movement (s, l, r), reusable procedures, and infinite recursion.',
    difficulty: 'Beginner',
  },
  {
    number: 2,
    title: 'Chapter 2: Walls & Precision Alignment',
    subtitle: 'Use solid walls as natural stoppers to align unequal corridors with compact loops.',
    difficulty: 'Beginner+',
  },
  {
    number: 3,
    title: 'Chapter 3: Numeric Countdown & Arithmetic',
    subtitle: 'Control exact distances using numeric arguments, X-1 / X+1 math, and the <= 0 base case.',
    difficulty: 'Elementary',
  },
  {
    number: 4,
    title: 'Chapter 4: Multi-Parameter Control & Base Cases',
    subtitle: 'Coordinate multiple numeric parameters to sweep rectangular grids and shrinking frames.',
    difficulty: 'Intermediate',
  },
  {
    number: 5,
    title: 'Chapter 5: Higher-Order Macros (Code as Data)',
    subtitle: 'Pass command sequences as arguments to double steps, mirror paths, and compress loops.',
    difficulty: 'Intermediate+',
  },
  {
    number: 6,
    title: 'Chapter 6: Gray Button Mastery & Strategic Resets',
    subtitle: 'Turn gray reset traps from hazards into tactical tools using zero-loss crossings and two-lap loops.',
    difficulty: 'Intermediate+',
  },
  {
    number: 7,
    title: 'Chapter 7: Imagine Cup Classics & Symmetries',
    subtitle: 'Classic 4-fold diamonds, windmills, snakes, stairways, and pinwheels inspired by Herbert lore.',
    difficulty: 'Advanced',
  },
  {
    number: 8,
    title: 'Chapter 8: Space-Filling Curves & Fractals (HOJ)',
    subtitle: 'Generate Hilbert curves, Heighway dragons, binary trees, Sierpinski steps, and Koch fractals.',
    difficulty: 'Advanced+',
  },
  {
    number: 9,
    title: 'Chapter 9: Wide & Tall Arenas (26 to 40)',
    subtitle: 'Scale your algorithms across expansive rectangular and 40x40 arenas.',
    difficulty: 'Expert',
  },
  {
    number: 10,
    title: 'Chapter 10: Code Golf Grandmaster Gauntlet',
    subtitle: 'Push byte-count compression to the theoretical limit across ultimate Herbert puzzles.',
    difficulty: 'Grandmaster',
  },
];

export const CAMPAIGN_LEVELS: readonly LevelDefinition[] = [
  ...CHAPTER_1_LEVELS,
  ...CHAPTER_2_LEVELS,
  ...CHAPTER_3_LEVELS,
  ...CHAPTER_4_LEVELS,
  ...CHAPTER_5_LEVELS,
  ...CHAPTER_6_LEVELS,
  ...CHAPTER_7_LEVELS,
  ...CHAPTER_8_LEVELS,
  ...CHAPTER_9_LEVELS,
  ...CHAPTER_10_LEVELS,
];

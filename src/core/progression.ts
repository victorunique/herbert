import type { LevelDefinition } from './types';
import type { LevelProgressRecord } from '../storage/localRepository';

export interface ChapterCompletion {
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly isComplete: boolean;
}

export interface CampaignStats {
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly totalScore: number;
}

export function getChapterCompletion(
  chapterNumber: number,
  levels: readonly LevelDefinition[],
  progressMap: Readonly<Record<string, LevelProgressRecord>>,
): ChapterCompletion {
  const chapterLevels = levels.filter((lvl) => lvl.chapter === chapterNumber);
  let solvedCount = 0;
  for (const lvl of chapterLevels) {
    if (progressMap[lvl.id]?.solved) {
      solvedCount += 1;
    }
  }
  const totalCount = chapterLevels.length;
  return {
    solvedCount,
    totalCount,
    isComplete: totalCount > 0 && solvedCount === totalCount,
  };
}

export function getOverallCampaignStats(
  levels: readonly LevelDefinition[],
  progressMap: Readonly<Record<string, LevelProgressRecord>>,
): CampaignStats {
  let solvedCount = 0;
  let totalScore = 0;
  for (const lvl of levels) {
    const rec = progressMap[lvl.id];
    if (rec?.solved) solvedCount += 1;
    totalScore += rec?.bestScore ?? 0;
  }
  return { solvedCount, totalCount: levels.length, totalScore };
}

export function isChapterUnlocked(
  chapterNumber: number,
  levels: readonly LevelDefinition[],
  progressMap: Readonly<Record<string, LevelProgressRecord>>,
  requireSequentialUnlock: boolean,
): boolean {
  if (!requireSequentialUnlock || chapterNumber <= 1) {
    return true;
  }
  return getChapterCompletion(chapterNumber - 1, levels, progressMap).isComplete;
}

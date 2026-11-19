import { describe, expect, it } from 'vitest';
import { createBlankLevel } from '../../src/core/levelCodec';
import {
  getChapterCompletion,
  getOverallCampaignStats,
  isChapterUnlocked,
} from '../../src/core/progression';
import type { LevelDefinition } from '../../src/core/types';
import type { LevelProgressRecord } from '../../src/storage/localRepository';

function makeStubLevel(id: string, chapter: number): LevelDefinition {
  return { ...createBlankLevel({ id, name: id }), chapter };
}

function makeProgress(levelId: string, solved: boolean, bestScore = 100): LevelProgressRecord {
  return {
    levelId,
    draftCode: '',
    solved,
    bestBytes: solved ? 5 : null,
    bestScore: solved ? bestScore : 0,
    bestCode: solved ? 's' : '',
  };
}

describe('Campaign Progression & Chapter Unlock Rules', () => {
  const levels: readonly LevelDefinition[] = [
    makeStubLevel('c1-1', 1),
    makeStubLevel('c1-2', 1),
    makeStubLevel('c2-1', 2),
    makeStubLevel('c2-2', 2),
    makeStubLevel('c3-1', 3),
  ];

  it('computes per-chapter completion counts and overall campaign stats', () => {
    const progress: Record<string, LevelProgressRecord> = {
      'c1-1': makeProgress('c1-1', true, 120),
      'c1-2': makeProgress('c1-2', false, 0),
      'c2-1': makeProgress('c2-1', true, 250),
    };

    expect(getChapterCompletion(1, levels, progress)).toEqual({
      solvedCount: 1,
      totalCount: 2,
      isComplete: false,
    });
    expect(getChapterCompletion(2, levels, progress)).toEqual({
      solvedCount: 1,
      totalCount: 2,
      isComplete: false,
    });
    expect(getOverallCampaignStats(levels, progress)).toEqual({
      solvedCount: 2,
      totalCount: 5,
      totalScore: 370,
    });
  });

  it('unlocks all chapters when requireSequentialUnlock is false (default open mode)', () => {
    const emptyProgress: Record<string, LevelProgressRecord> = {};
    expect(isChapterUnlocked(1, levels, emptyProgress, false)).toBe(true);
    expect(isChapterUnlocked(2, levels, emptyProgress, false)).toBe(true);
    expect(isChapterUnlocked(3, levels, emptyProgress, false)).toBe(true);
  });

  it('enforces sequential chapter unlocking when requireSequentialUnlock is true', () => {
    const partialCh1: Record<string, LevelProgressRecord> = {
      'c1-1': makeProgress('c1-1', true),
    };
    expect(isChapterUnlocked(1, levels, partialCh1, true)).toBe(true);
    expect(isChapterUnlocked(2, levels, partialCh1, true)).toBe(false);
    expect(isChapterUnlocked(3, levels, partialCh1, true)).toBe(false);

    const completeCh1: Record<string, LevelProgressRecord> = {
      'c1-1': makeProgress('c1-1', true),
      'c1-2': makeProgress('c1-2', true),
    };
    expect(isChapterUnlocked(2, levels, completeCh1, true)).toBe(true);
    expect(isChapterUnlocked(3, levels, completeCh1, true)).toBe(false);
  });
});

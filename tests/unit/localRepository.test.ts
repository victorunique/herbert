import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankLevel } from '../../src/core/levelCodec';
import {
  deleteCustomLevel,
  loadCustomLevels,
  loadLevelProgress,
  loadThemePreference,
  loadTutorialCompletedIds,
  markTutorialLessonCompleted,
  recordLevelAttempt,
  saveCustomLevel,
  saveDraftCode,
  saveThemePreference,
} from '../../src/storage/localRepository';

describe('Local Storage Repository (Theme, Progress, Drafts, Custom Levels)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and loads theme preference with dark default', () => {
    expect(loadThemePreference()).toBe('dark');
    saveThemePreference('light');
    expect(loadThemePreference()).toBe('light');
  });

  it('persists draft code and keeps the best byte count and highest score across attempts', () => {
    saveDraftCode('lvl-1', 'sslr');
    expect(loadLevelProgress('lvl-1').draftCode).toBe('sslr');

    // First solved attempt: 12 bytes, 140 score
    recordLevelAttempt('lvl-1', {
      code: 'a:ssssra\na',
      byteCount: 12,
      score: 140,
      solved: true,
    });
    const p1 = loadLevelProgress('lvl-1');
    expect(p1.solved).toBe(true);
    expect(p1.bestBytes).toBe(12);
    expect(p1.bestScore).toBe(140);
    expect(p1.bestCode).toBe('a:ssssra\na');

    // Second solved attempt with worse bytes (16 bytes, 120 score) should NOT overwrite bestBytes/bestScore
    recordLevelAttempt('lvl-1', {
      code: 'ssssrssssrssssr',
      byteCount: 16,
      score: 120,
      solved: true,
    });
    const p2 = loadLevelProgress('lvl-1');
    expect(p2.bestBytes).toBe(12);
    expect(p2.bestScore).toBe(140);

    // Third solved attempt with better bytes (6 bytes, 170 score) SHOULD update best record
    recordLevelAttempt('lvl-1', {
      code: 'a:sra\na',
      byteCount: 6,
      score: 170,
      solved: true,
    });
    const p3 = loadLevelProgress('lvl-1');
    expect(p3.bestBytes).toBe(6);
    expect(p3.bestScore).toBe(170);
    expect(p3.bestCode).toBe('a:sra\na');
  });

  it('saves, updates, and deletes custom levels', () => {
    expect(loadCustomLevels()).toEqual([]);
    const lvl1 = createBlankLevel({ id: 'cust-1', name: 'First Map', width: 29, height: 25 });
    saveCustomLevel(lvl1);
    expect(loadCustomLevels()).toHaveLength(1);
    expect(loadCustomLevels()[0]?.width).toBe(29);

    const updated = createBlankLevel({ id: 'cust-1', name: 'Updated Map', width: 31, height: 25 });
    saveCustomLevel(updated);
    expect(loadCustomLevels()).toHaveLength(1);
    expect(loadCustomLevels()[0]?.name).toBe('Updated Map');

    deleteCustomLevel('cust-1');
    expect(loadCustomLevels()).toEqual([]);
  });

  it('tracks completed interactive tutorial lesson IDs', () => {
    expect(loadTutorialCompletedIds()).toEqual([]);
    markTutorialLessonCompleted('lesson-1');
    markTutorialLessonCompleted('lesson-2');
    markTutorialLessonCompleted('lesson-1');
    expect(loadTutorialCompletedIds()).toEqual(['lesson-1', 'lesson-2']);
  });
});

import { describe, expect, it } from 'vitest';
import { createSimulationSession } from '../../src/core/gridEngine';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_LEVELS } from '../../src/content/campaignLevels';
import { TUTORIAL_LESSONS } from '../../src/content/tutorialLessons';

describe('Campaign Levels & Interactive Tutorial Content Verification', () => {
  it('organizes built-in campaign levels into 10 progressive chapters with 5 challenges each (50 total)', () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(10);
    expect(CAMPAIGN_LEVELS).toHaveLength(50);

    const uniqueIds = new Set(CAMPAIGN_LEVELS.map((lvl) => lvl.id));
    expect(uniqueIds.size).toBe(50);

    for (const ch of CAMPAIGN_CHAPTERS) {
      const levelsInChapter = CAMPAIGN_LEVELS.filter((lvl) => lvl.chapter === ch.number);
      expect(levelsInChapter, `Chapter ${ch.number} should have 5 levels`).toHaveLength(5);
      expect(ch.difficulty.length).toBeGreaterThan(0);
    }

    for (const lvl of CAMPAIGN_LEVELS) {
      expect(lvl.width).toBeGreaterThanOrEqual(25);
      expect(lvl.width).toBeLessThanOrEqual(40);
      expect(lvl.height).toBeGreaterThanOrEqual(25);
      expect(lvl.height).toBeLessThanOrEqual(40);
      expect(lvl.whiteButtons.length).toBeGreaterThanOrEqual(1);
    }

    expect(CAMPAIGN_LEVELS.some((lvl) => lvl.width !== lvl.height)).toBe(true);
    expect(CAMPAIGN_LEVELS.some((lvl) => lvl.width === 40 && lvl.height === 40)).toBe(true);
  });

  it('verifies every campaign level is solved within maxBytes by its referenceSolution', () => {
    const failures: string[] = [];
    for (const level of CAMPAIGN_LEVELS) {
      if (!level.referenceSolution) {
        failures.push(`${level.name}: missing referenceSolution`);
        continue;
      }
      const session = createSimulationSession(level, level.referenceSolution, { maxSteps: 8000 });
      if (session.compileDiagnostics.length > 0) {
        failures.push(`${level.name}: compile errors (${session.compileDiagnostics.map((d) => d.message).join('; ')})`);
        continue;
      }
      if (session.runtimeError !== null) {
        failures.push(`${level.name}: runtime error (${session.runtimeError})`);
        continue;
      }
      const finalSnap = session.runToCompletion();
      if (!finalSnap.solved) {
        failures.push(
          `${level.name}: not solved (pressed ${finalSnap.litButtons.length}/${level.whiteButtons.length})`,
        );
        continue;
      }
      const score = session.getScoreBreakdown();
      if (score.byteCount > level.maxBytes) {
        failures.push(`${level.name}: ${score.byteCount}B > maxBytes ${level.maxBytes}B`);
      }
      if (score.totalScore < level.basePoints) {
        failures.push(`${level.name}: score ${score.totalScore} < basePoints ${level.basePoints}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('verifies all 5 interactive tutorial lessons are solved within maxBytes by their sampleSolution', () => {
    expect(TUTORIAL_LESSONS).toHaveLength(5);
    for (const lesson of TUTORIAL_LESSONS) {
      const session = createSimulationSession(lesson.level, lesson.sampleSolution, {
        maxSteps: 3000,
      });
      expect(session.compileDiagnostics, `Lesson ${lesson.title} compile errors`).toHaveLength(0);
      const finalSnap = session.runToCompletion();
      expect(finalSnap.solved, `Lesson ${lesson.title} failed to solve`).toBe(true);
      expect(session.byteCount).toBeLessThanOrEqual(lesson.level.maxBytes);
    }
  });
});

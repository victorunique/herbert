import { describe, expect, it } from 'vitest';
import { createSimulationSession } from '../../src/core/gridEngine';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_LEVELS } from '../../src/content/campaignLevels';
import { TUTORIAL_LESSONS } from '../../src/content/tutorialLessons';

describe('Campaign Levels & Interactive Tutorial Content Verification', () => {
  it('organizes built-in campaign levels into 4 progressive chapters and includes rectangular odd-dimension maps', () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(4);
    expect(CAMPAIGN_LEVELS.length).toBeGreaterThanOrEqual(8);
    expect(CAMPAIGN_LEVELS.some((lvl) => lvl.width !== lvl.height)).toBe(true);
  });

  it('verifies every campaign level is solved within maxBytes by its referenceSolution', () => {
    for (const level of CAMPAIGN_LEVELS) {
      expect(level.referenceSolution).toBeDefined();
      const session = createSimulationSession(level, level.referenceSolution!, { maxSteps: 8000 });
      expect(session.compileDiagnostics, `Level ${level.name} compile errors`).toHaveLength(0);
      expect(session.runtimeError, `Level ${level.name} runtime error`).toBeNull();

      const finalSnap = session.runToCompletion();
      expect(finalSnap.solved, `Level ${level.name} failed to solve`).toBe(true);

      const score = session.getScoreBreakdown();
      expect(
        score.byteCount,
        `Level ${level.name} solution (${score.byteCount}B) exceeds maxBytes (${level.maxBytes}B)`,
      ).toBeLessThanOrEqual(level.maxBytes);
      expect(score.totalScore).toBeGreaterThanOrEqual(level.basePoints);
    }
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

import { parseLevelText, serializeLevelToText } from '../core/levelCodec';
import type { LevelDefinition } from '../core/types';

export type ThemeMode = 'light' | 'dark';

export interface LevelProgressRecord {
  readonly levelId: string;
  readonly draftCode: string;
  readonly solved: boolean;
  readonly bestBytes: number | null;
  readonly bestScore: number;
  readonly bestCode: string;
}

interface StoredCustomLevelEntry {
  readonly id: string;
  readonly text: string;
}

const KEY_THEME = 'xherbert:theme';
const KEY_PROGRESS = 'xherbert:progress:v1';
const KEY_CUSTOM_LEVELS = 'xherbert:custom_levels:v1';
const KEY_TUTORIAL = 'xherbert:tutorial_completed:v1';

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadThemePreference(): ThemeMode {
  const raw = window.localStorage.getItem(KEY_THEME);
  return raw === 'light' ? 'light' : 'dark';
}

export function saveThemePreference(theme: ThemeMode): void {
  window.localStorage.setItem(KEY_THEME, theme);
}

export function loadAllProgress(): Record<string, LevelProgressRecord> {
  return readJsonStorage<Record<string, LevelProgressRecord>>(KEY_PROGRESS, {});
}

export function loadLevelProgress(levelId: string): LevelProgressRecord {
  const all = loadAllProgress();
  return (
    all[levelId] ?? {
      levelId,
      draftCode: '',
      solved: false,
      bestBytes: null,
      bestScore: 0,
      bestCode: '',
    }
  );
}

export function saveDraftCode(levelId: string, draftCode: string): LevelProgressRecord {
  const all = loadAllProgress();
  const prev = loadLevelProgress(levelId);
  const updated: LevelProgressRecord = { ...prev, draftCode };
  writeJsonStorage(KEY_PROGRESS, { ...all, [levelId]: updated });
  return updated;
}

function computeNextBest(
  prev: LevelProgressRecord,
  attempt: { code: string; byteCount: number; score: number; solved: boolean },
): { bestBytes: number | null; bestCode: string; bestScore: number } {
  const bestScore = Math.max(prev.bestScore, attempt.score);
  if (!attempt.solved) {
    return { bestBytes: prev.bestBytes, bestCode: prev.bestCode, bestScore };
  }
  const isBetterBytes = prev.bestBytes === null || attempt.byteCount <= prev.bestBytes;
  return {
    bestBytes: isBetterBytes ? attempt.byteCount : prev.bestBytes,
    bestCode: isBetterBytes ? attempt.code : prev.bestCode,
    bestScore,
  };
}

export function recordLevelAttempt(
  levelId: string,
  attempt: {
    readonly code: string;
    readonly byteCount: number;
    readonly score: number;
    readonly solved: boolean;
  },
): LevelProgressRecord {
  const all = loadAllProgress();
  const prev = loadLevelProgress(levelId);
  const nextBest = computeNextBest(prev, attempt);
  const updated: LevelProgressRecord = {
    levelId,
    draftCode: attempt.code,
    solved: prev.solved || attempt.solved,
    ...nextBest,
  };
  writeJsonStorage(KEY_PROGRESS, { ...all, [levelId]: updated });
  return updated;
}

export function loadCustomLevels(): LevelDefinition[] {
  const stored = readJsonStorage<StoredCustomLevelEntry[]>(KEY_CUSTOM_LEVELS, []);
  const levels: LevelDefinition[] = [];
  for (const item of stored) {
    const parsed = parseLevelText(item.text, { id: item.id });
    if (parsed.level) {
      levels.push(parsed.level);
    }
  }
  return levels;
}

export function saveCustomLevel(level: LevelDefinition): LevelDefinition[] {
  const stored = readJsonStorage<StoredCustomLevelEntry[]>(KEY_CUSTOM_LEVELS, []);
  const text = serializeLevelToText(level);
  const idx = stored.findIndex((item) => item.id === level.id);
  if (idx >= 0) {
    stored[idx] = { id: level.id, text };
  } else {
    stored.push({ id: level.id, text });
  }
  writeJsonStorage(KEY_CUSTOM_LEVELS, stored);
  return loadCustomLevels();
}

export function deleteCustomLevel(levelId: string): LevelDefinition[] {
  const stored = readJsonStorage<StoredCustomLevelEntry[]>(KEY_CUSTOM_LEVELS, []);
  const filtered = stored.filter((item) => item.id !== levelId);
  writeJsonStorage(KEY_CUSTOM_LEVELS, filtered);
  return loadCustomLevels();
}

export function loadTutorialCompletedIds(): string[] {
  return readJsonStorage<string[]>(KEY_TUTORIAL, []);
}

export function markTutorialLessonCompleted(lessonId: string): string[] {
  const current = loadTutorialCompletedIds();
  if (!current.includes(lessonId)) {
    const next = [...current, lessonId];
    writeJsonStorage(KEY_TUTORIAL, next);
    return next;
  }
  return current;
}

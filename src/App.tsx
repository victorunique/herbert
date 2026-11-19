import { useEffect, useState, type ReactElement } from 'react';
import { CAMPAIGN_LEVELS } from './content/campaignLevels';
import type { LevelDefinition } from './core/types';
import {
  deleteCustomLevel,
  loadAllProgress,
  loadCustomLevels,
  loadLevelProgress,
  loadThemePreference,
  loadTutorialCompletedIds,
  markTutorialLessonCompleted,
  recordLevelAttempt,
  saveCustomLevel,
  saveDraftCode,
  saveThemePreference,
  type LevelProgressRecord,
  type ThemeMode,
} from './storage/localRepository';
import { HeaderNav, type AppMode } from './ui/common/HeaderNav';
import { LevelEditorWorkspace } from './ui/create/LevelEditorWorkspace';
import { ComponentHarness } from './ui/harness/ComponentHarness';
import { TutorialWorkspace } from './ui/learn/TutorialWorkspace';
import { LevelSelectorModal } from './ui/play/LevelSelectorModal';
import { PlayWorkspace } from './ui/play/PlayWorkspace';

function getHarnessParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('harness');
}

function useThemeSync(): [ThemeMode, () => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemePreference());
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    saveThemePreference(theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

interface WorkspaceState {
  readonly mode: AppMode;
  readonly setMode: (m: AppMode) => void;
  readonly customLevels: LevelDefinition[];
  readonly setCustomLevels: (lvls: LevelDefinition[]) => void;
  readonly currentLevel: LevelDefinition;
  readonly progressMap: Record<string, LevelProgressRecord>;
  readonly code: string;
  readonly selectLevel: (lvl: LevelDefinition) => void;
  readonly updateCode: (next: string) => void;
  readonly recordAttempt: (attempt: { code: string; byteCount: number; score: number; solved: boolean }) => void;
  readonly nextLevel: () => void;
}

function useAppWorkspaceState(): WorkspaceState {
  const [mode, setMode] = useState<AppMode>('play');
  const [customLevels, setCustomLevels] = useState<LevelDefinition[]>(() => loadCustomLevels());
  const [currentLevel, setCurrentLevel] = useState<LevelDefinition>(() => CAMPAIGN_LEVELS[0]!);
  const [progressMap, setProgressMap] = useState<Record<string, LevelProgressRecord>>(() => loadAllProgress());
  const [code, setCode] = useState<string>(() => loadLevelProgress(CAMPAIGN_LEVELS[0]!.id).draftCode);

  const selectLevel = (lvl: LevelDefinition): void => {
    setCurrentLevel(lvl);
    const saved = loadLevelProgress(lvl.id);
    setCode(saved.draftCode || saved.bestCode || '');
    setMode('play');
  };
  const nextLevel = (): void => {
    const all = [...CAMPAIGN_LEVELS, ...customLevels];
    const next = all[(all.findIndex((l) => l.id === currentLevel.id) + 1) % all.length];
    if (next) selectLevel(next);
  };

  return {
    mode, setMode, customLevels, setCustomLevels, currentLevel, progressMap, code, selectLevel, nextLevel,
    updateCode: (next: string) => { setCode(next); saveDraftCode(currentLevel.id, next); setProgressMap(loadAllProgress()); },
    recordAttempt: (attempt) => { recordLevelAttempt(currentLevel.id, attempt); setProgressMap(loadAllProgress()); },
  };
}

function ActiveWorkspaceBody(props: {
  readonly ws: WorkspaceState;
  readonly tutorialDoneIds: readonly string[];
  readonly onMarkTutorialDone: (id: string) => void;
}): ReactElement {
  const { ws } = props;
  if (ws.mode === 'learn') {
    return <TutorialWorkspace completedIds={props.tutorialDoneIds} onMarkCompleted={props.onMarkTutorialDone} />;
  }
  if (ws.mode === 'create') {
    return (
      <LevelEditorWorkspace
        customLevels={ws.customLevels}
        onSaveLevel={(lvl) => ws.setCustomLevels(saveCustomLevel(lvl))}
        onDeleteLevel={(id) => ws.setCustomLevels(deleteCustomLevel(id))}
        onTestLevelInPlay={ws.selectLevel}
      />
    );
  }
  return <PlayWorkspace level={ws.currentLevel} code={ws.code} onChangeCode={ws.updateCode} onAttemptRecorded={ws.recordAttempt} onNextLevel={ws.nextLevel} />;
}

export function App(): ReactElement {
  const [theme, toggleTheme] = useThemeSync();
  const ws = useAppWorkspaceState();
  const [isLevelModalOpen, setIsLevelModalOpen] = useState<boolean>(false);
  const [tutorialDoneIds, setTutorialDoneIds] = useState<string[]>(() => loadTutorialCompletedIds());
  const harness = getHarnessParam();
  if (harness) return <ComponentHarness target={harness} />;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <HeaderNav mode={ws.mode} onSelectMode={ws.setMode} currentLevelName={ws.currentLevel.name} currentLevelDims={`${ws.currentLevel.width}x${ws.currentLevel.height}`} onOpenLevelModal={() => setIsLevelModalOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
      <ActiveWorkspaceBody ws={ws} tutorialDoneIds={tutorialDoneIds} onMarkTutorialDone={(id) => setTutorialDoneIds(markTutorialLessonCompleted(id))} />
      <LevelSelectorModal isOpen={isLevelModalOpen} onClose={() => setIsLevelModalOpen(false)} campaignLevels={CAMPAIGN_LEVELS} customLevels={ws.customLevels} currentLevelId={ws.currentLevel.id} progressMap={ws.progressMap} onSelectLevel={ws.selectLevel} />
    </div>
  );
}

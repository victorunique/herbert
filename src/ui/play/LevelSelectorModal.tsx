import type { ReactElement } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { CAMPAIGN_CHAPTERS, type CampaignChapter } from '../../content/campaignLevels';
import type { LevelDefinition } from '../../core/types';
import type { LevelProgressRecord } from '../../storage/localRepository';

export interface LevelSelectorModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly campaignLevels: readonly LevelDefinition[];
  readonly customLevels: readonly LevelDefinition[];
  readonly currentLevelId: string;
  readonly progressMap: Readonly<Record<string, LevelProgressRecord>>;
  readonly onSelectLevel: (level: LevelDefinition) => void;
}

function LevelCardBadges(props: { readonly level: LevelDefinition; readonly progress?: LevelProgressRecord }): ReactElement {
  const bestB = props.progress?.bestBytes ?? null;
  const bestScore = props.progress?.bestScore ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{props.level.width}x{props.level.height}</span>
      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-sky-300">Max {props.level.maxBytes}B</span>
      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">{props.level.basePoints} pts</span>
      {bestB !== null && (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Best: {bestB}B ({bestScore}p)</span>
      )}
    </div>
  );
}

function LevelCard(props: {
  readonly level: LevelDefinition;
  readonly isSelected: boolean;
  readonly progress?: LevelProgressRecord;
  readonly onSelect: () => void;
}): ReactElement {
  const solved = Boolean(props.progress?.solved);
  const borderCls = props.isSelected
    ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 hover:border-blue-400';

  return (
    <button
      type="button"
      data-testid={`select-level-${props.level.id}`}
      onClick={props.onSelect}
      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${borderCls}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{props.level.name}</div>
        {solved && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
      </div>
      <LevelCardBadges level={props.level} progress={props.progress} />
    </button>
  );
}

function ChapterSection(props: {
  readonly chapter: CampaignChapter;
  readonly levels: readonly LevelDefinition[];
  readonly currentLevelId: string;
  readonly progressMap: Readonly<Record<string, LevelProgressRecord>>;
  readonly onPick: (lvl: LevelDefinition) => void;
}): ReactElement {
  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-sm font-bold text-blue-600 dark:text-sky-400">{props.chapter.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{props.chapter.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {props.levels.map((lvl) => (
          <LevelCard
            key={lvl.id}
            level={lvl}
            isSelected={lvl.id === props.currentLevelId}
            progress={props.progressMap[lvl.id]}
            onSelect={() => props.onPick(lvl)}
          />
        ))}
      </div>
    </div>
  );
}

function CustomLevelsSection(props: {
  readonly customLevels: readonly LevelDefinition[];
  readonly currentLevelId: string;
  readonly progressMap: Readonly<Record<string, LevelProgressRecord>>;
  readonly onPick: (lvl: LevelDefinition) => void;
}): ReactElement | null {
  if (props.customLevels.length === 0) return null;
  return (
    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
        My Custom &amp; Imported Levels ({props.customLevels.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {props.customLevels.map((lvl) => (
          <LevelCard
            key={lvl.id}
            level={lvl}
            isSelected={lvl.id === props.currentLevelId}
            progress={props.progressMap[lvl.id]}
            onSelect={() => props.onPick(lvl)}
          />
        ))}
      </div>
    </div>
  );
}

function ModalHeader(props: { readonly onClose: () => void }): ReactElement {
  return (
    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Level (All Chapters Unlocked)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Follow the recommended chapter progression or jump directly to any challenge.
        </p>
      </div>
      <button type="button" onClick={props.onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function LevelSelectorModal(props: LevelSelectorModalProps): ReactElement | null {
  if (!props.isOpen) return null;
  const handlePick = (lvl: LevelDefinition): void => { props.onSelectLevel(lvl); props.onClose(); };

  return (
    <div data-testid="level-modal" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <ModalHeader onClose={props.onClose} />
        <div className="p-5 overflow-y-auto space-y-6">
          {CAMPAIGN_CHAPTERS.map((ch) => (
            <ChapterSection key={ch.number} chapter={ch} levels={props.campaignLevels.filter((l) => l.chapter === ch.number)} currentLevelId={props.currentLevelId} progressMap={props.progressMap} onPick={handlePick} />
          ))}
          <CustomLevelsSection customLevels={props.customLevels} currentLevelId={props.currentLevelId} progressMap={props.progressMap} onPick={handlePick} />
        </div>
      </div>
    </div>
  );
}

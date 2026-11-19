import { useState, type ReactElement } from 'react';
import { CheckCircle2, Trophy, X } from 'lucide-react';
import { CAMPAIGN_CHAPTERS, type CampaignChapter } from '../../content/campaignLevels';
import { getChapterCompletion, getOverallCampaignStats, isChapterUnlocked, type CampaignStats } from '../../core/progression';
import type { LevelDefinition } from '../../core/types';
import type { LevelProgressRecord } from '../../storage/localRepository';

type ChapterFilter = 'all' | 'custom' | number;

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
      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        {props.level.width}x{props.level.height}
      </span>
      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-sky-300">Max {props.level.maxBytes}B</span>
      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">{props.level.basePoints} pts</span>
      {bestB !== null && (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          Best: {bestB}B ({bestScore}p)
        </span>
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

function ChapterHeader(props: {
  readonly chapter: CampaignChapter;
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly isComplete: boolean;
}): ReactElement {
  const badgeCls = props.isComplete
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-bold text-blue-600 dark:text-sky-400">{props.chapter.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{props.chapter.subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
          {props.chapter.difficulty}
        </span>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeCls}`}>
          {props.solvedCount} / {props.totalCount} Solved
        </span>
      </div>
    </div>
  );
}

function ChapterSection(props: {
  readonly chapter: CampaignChapter;
  readonly allCampaignLevels: readonly LevelDefinition[];
  readonly currentLevelId: string;
  readonly progressMap: Readonly<Record<string, LevelProgressRecord>>;
  readonly onPick: (lvl: LevelDefinition) => void;
}): ReactElement {
  const levels = props.allCampaignLevels.filter((l) => l.chapter === props.chapter.number);
  const stats = getChapterCompletion(props.chapter.number, props.allCampaignLevels, props.progressMap);
  return (
    <div className="space-y-2.5">
      <ChapterHeader chapter={props.chapter} {...stats} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {levels.map((lvl) => (
          <LevelCard key={lvl.id} level={lvl} isSelected={lvl.id === props.currentLevelId} progress={props.progressMap[lvl.id]} onSelect={() => props.onPick(lvl)} />
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

function FilterPill(props: {
  readonly testId: string;
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}): ReactElement {
  const cls = props.active
    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400';
  return (
    <button
      type="button"
      data-testid={props.testId}
      onClick={props.onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${cls}`}
    >
      {props.label}
    </button>
  );
}

function ChapterFilterBar(props: {
  readonly activeFilter: ChapterFilter;
  readonly customCount: number;
  readonly onChange: (next: ChapterFilter) => void;
}): ReactElement {
  return (
    <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto">
      <FilterPill testId="chapter-filter-all" active={props.activeFilter === 'all'} label="All (50)" onClick={() => props.onChange('all')} />
      {CAMPAIGN_CHAPTERS.map((ch) => (
        <FilterPill
          key={ch.number}
          testId={`chapter-filter-${ch.number}`}
          active={props.activeFilter === ch.number}
          label={`Ch ${ch.number}`}
          onClick={() => props.onChange(ch.number)}
        />
      ))}
      {props.customCount > 0 && (
        <FilterPill
          testId="chapter-filter-custom"
          active={props.activeFilter === 'custom'}
          label={`Custom (${props.customCount})`}
          onClick={() => props.onChange('custom')}
        />
      )}
    </div>
  );
}

function ModalHeader(props: { readonly stats: CampaignStats; readonly onClose: () => void }): ReactElement {
  const pct = props.stats.totalCount > 0 ? Math.round((props.stats.solvedCount / props.stats.totalCount) * 100) : 0;
  return (
    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Level (All Chapters Unlocked)</h2>
          <span
            data-testid="campaign-progress-summary"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          >
            <Trophy className="w-3.5 h-3.5" />
            {props.stats.solvedCount} / {props.stats.totalCount} Solved ({pct}%)
          </span>
          {props.stats.totalScore > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {props.stats.totalScore} pts
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          10 progressive chapters (50 challenges). Follow the curriculum or jump directly to any chapter.
        </p>
      </div>
      <button type="button" onClick={props.onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 shrink-0">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ModalLevelGrid(props: {
  readonly activeFilter: ChapterFilter;
  readonly campaignLevels: readonly LevelDefinition[];
  readonly customLevels: readonly LevelDefinition[];
  readonly currentLevelId: string;
  readonly progressMap: Readonly<Record<string, LevelProgressRecord>>;
  readonly onPick: (lvl: LevelDefinition) => void;
}): ReactElement {
  const visibleChapters = CAMPAIGN_CHAPTERS.filter(
    (ch) =>
      (props.activeFilter === 'all' || props.activeFilter === ch.number) &&
      isChapterUnlocked(ch.number, props.campaignLevels, props.progressMap, false),
  );
  const showCustom = props.activeFilter === 'all' || props.activeFilter === 'custom';
  return (
    <div className="p-5 overflow-y-auto space-y-6">
      {visibleChapters.map((ch) => (
        <ChapterSection key={ch.number} chapter={ch} allCampaignLevels={props.campaignLevels} currentLevelId={props.currentLevelId} progressMap={props.progressMap} onPick={props.onPick} />
      ))}
      {showCustom && (
        <CustomLevelsSection customLevels={props.customLevels} currentLevelId={props.currentLevelId} progressMap={props.progressMap} onPick={props.onPick} />
      )}
    </div>
  );
}

export function LevelSelectorModal(props: LevelSelectorModalProps): ReactElement | null {
  const [activeFilter, setActiveFilter] = useState<ChapterFilter>('all');
  if (!props.isOpen) return null;

  const stats = getOverallCampaignStats(props.campaignLevels, props.progressMap);
  const handlePick = (lvl: LevelDefinition): void => {
    props.onSelectLevel(lvl);
    props.onClose();
  };

  return (
    <div data-testid="level-modal" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <ModalHeader stats={stats} onClose={props.onClose} />
        <ChapterFilterBar activeFilter={activeFilter} customCount={props.customLevels.length} onChange={setActiveFilter} />
        <ModalLevelGrid activeFilter={activeFilter} campaignLevels={props.campaignLevels} customLevels={props.customLevels} currentLevelId={props.currentLevelId} progressMap={props.progressMap} onPick={handlePick} />
      </div>
    </div>
  );
}

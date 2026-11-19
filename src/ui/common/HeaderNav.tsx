import type { ReactElement } from 'react';
import { BookOpen, Code2, Compass, HelpCircle, Layers, Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../../storage/localRepository';

export type AppMode = 'play' | 'learn' | 'create';

export interface HeaderNavProps {
  readonly mode: AppMode;
  readonly onSelectMode: (mode: AppMode) => void;
  readonly currentLevelName: string;
  readonly currentLevelDims: string;
  readonly onOpenLevelModal: () => void;
  readonly onOpenReference: () => void;
  readonly theme: ThemeMode;
  readonly onToggleTheme: () => void;
}

const NAV_ITEMS: readonly { readonly id: AppMode; readonly label: string; readonly Icon: typeof Code2 }[] = [
  { id: 'play', label: 'Play', Icon: Code2 },
  { id: 'learn', label: 'Learn', Icon: BookOpen },
  { id: 'create', label: 'Create', Icon: Layers },
];

function ModeTabs(props: { readonly mode: AppMode; readonly onSelectMode: (m: AppMode) => void }): ReactElement {
  return (
    <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-200/60 dark:bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-300/60 dark:border-slate-800 shrink-0">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const cls =
          props.mode === id
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800';
        return (
          <button
            key={id}
            type="button"
            data-testid={`nav-${id}`}
            onClick={() => props.onSelectMode(id)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${cls}`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function BrandLogo(): ReactElement {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm">
        h
      </div>
      <div className="hidden md:block">
        <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">XHerbert</span>
        <span className="ml-2 text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          H-Lang
        </span>
      </div>
    </div>
  );
}

function LevelSelectButton(props: { readonly name: string; readonly dims: string; readonly onClick: () => void }): ReactElement {
  return (
    <button
      type="button"
      data-testid="level-selector-btn"
      onClick={props.onClick}
      className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 transition-colors min-w-0 shrink"
    >
      <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
      <span data-testid="current-level-title" className="truncate max-w-[72px] sm:max-w-[200px]">{props.name}</span>
      <span data-testid="grid-dimensions-badge" className="hidden md:inline-block text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        {props.dims}
      </span>
    </button>
  );
}

function HeaderActions(props: HeaderNavProps): ReactElement {
  const btnCls = 'p-1.5 sm:p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shrink-0';
  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
      {props.mode === 'play' && (
        <LevelSelectButton name={props.currentLevelName} dims={props.currentLevelDims} onClick={props.onOpenLevelModal} />
      )}
      <button type="button" data-testid="reference-btn" onClick={props.onOpenReference} className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs sm:text-sm font-medium ${btnCls}`} title="H Language Reference Cheat Sheet">
        <HelpCircle className="w-4 h-4 text-indigo-500" />
        <span className="hidden md:inline">Reference</span>
      </button>
      <button type="button" data-testid="theme-toggle" onClick={props.onToggleTheme} aria-label="Toggle Light/Dark Theme" className={btnCls}>
        {props.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      </button>
    </div>
  );
}

export function HeaderNav(props: HeaderNavProps): ReactElement {
  return (
    <header className="min-h-14 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 sm:px-6 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <BrandLogo />
        <ModeTabs mode={props.mode} onSelectMode={props.onSelectMode} />
      </div>
      <HeaderActions {...props} />
    </header>
  );
}

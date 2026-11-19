import type { ReactElement } from 'react';
import { FastForward, Pause, Play, RotateCcw, SkipBack, SkipForward, Trophy } from 'lucide-react';
import type { CallStackFrame, ScoreBreakdown, SimulationSnapshot } from '../../core/types';

export interface DebuggerPanelProps {
  readonly snapshot: SimulationSnapshot;
  readonly isRunning: boolean;
  readonly canStepForward: boolean;
  readonly canStepBackward: boolean;
  readonly speedMs: number;
  readonly onChangeSpeedMs: (ms: number) => void;
  readonly onTogglePlay: () => void;
  readonly onStepForward: () => void;
  readonly onStepBackward: () => void;
  readonly onInstantRun: () => void;
  readonly onReset: () => void;
  readonly score: ScoreBreakdown;
  readonly runtimeError: string | null;
  readonly onNextLevel?: () => void;
}

function ActionButtonsGroup(props: DebuggerPanelProps): ReactElement {
  const iconCls = 'p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700';
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" data-testid="btn-play-pause" onClick={props.onTogglePlay} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs">
        {props.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <span>{props.isRunning ? 'Pause' : 'Run'}</span>
      </button>
      <button type="button" data-testid="btn-step-back" disabled={!props.canStepBackward} onClick={props.onStepBackward} title="Step Backward" className={iconCls}>
        <SkipBack className="w-4 h-4" />
      </button>
      <button type="button" data-testid="btn-step-forward" disabled={!props.canStepForward} onClick={props.onStepForward} title="Step Forward" className={iconCls}>
        <SkipForward className="w-4 h-4" />
      </button>
      <button type="button" data-testid="btn-instant-run" onClick={props.onInstantRun} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
        <FastForward className="w-3.5 h-3.5" />
        <span>Instant</span>
      </button>
      <button type="button" data-testid="btn-reset" onClick={props.onReset} title="Reset" className={iconCls}>
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}

function TransportControlsBar(props: DebuggerPanelProps): ReactElement {
  return (
    <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
      <ActionButtonsGroup {...props} />
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-slate-600 dark:text-slate-400">
          Step: <strong data-testid="step-counter" className="text-slate-900 dark:text-white">{props.snapshot.stepIndex}</strong>
        </span>
        <select
          aria-label="Execution Speed"
          value={props.speedMs}
          onChange={(e) => props.onChangeSpeedMs(Number(e.target.value))}
          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
        >
          <option value={240}>1x</option>
          <option value={80}>3x</option>
          <option value={20}>12x</option>
        </select>
      </div>
    </div>
  );
}

function StackFramesList(props: { readonly callStack: readonly CallStackFrame[] }): ReactElement {
  if (props.callStack.length === 0) {
    return <div className="text-slate-400 dark:text-slate-500 italic">main() - top-level execution</div>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {props.callStack.map((frame, idx) => {
        const entries = Object.entries(frame.params).map(([k, v]) => `${k}=${v}`).join(', ');
        return (
          <span key={`${frame.procName}-${idx}`} className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            {frame.procName}({entries})
          </span>
        );
      })}
    </div>
  );
}

function CallStackInspector(props: { readonly snapshot: SimulationSnapshot }): ReactElement {
  const { callStack, skippedCalls, lastCommand } = props.snapshot;
  const recentSkips = skippedCalls.slice(-3);

  return (
    <div data-testid="call-stack-panel" className="p-3 space-y-2 text-xs font-mono max-h-40 overflow-y-auto">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[11px]">Live Recursion Call Stack ({callStack.length})</span>
        {lastCommand && <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-sky-300">Last Cmd: {lastCommand}</span>}
      </div>
      <StackFramesList callStack={callStack} />
      {recentSkips.length > 0 && (
        <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400">
          Base case (&le; 0) skipped:{' '}
          {recentSkips.map((s, i) => (
            <span key={`${s.procName}-${i}`} className="mr-2">{s.procName}({s.argsSummary})</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SolvedBanner(props: {
  readonly snapshot: SimulationSnapshot;
  readonly score: ScoreBreakdown;
  readonly onNextLevel?: () => void;
}): ReactElement | null {
  if (!props.snapshot.solved) return null;
  const { score } = props;
  const scoreMsg = score.overByteLimit
    ? `Exceeded Max Bytes (${score.maxBytes}B) - 0 pts`
    : `Score: ${score.totalScore} pts (Base ${score.basePointsEarned} + Bonus ${score.efficiencyBonus})`;

  return (
    <div data-testid="solved-banner" className="p-3 bg-emerald-500/15 border-t border-emerald-500/40 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-xs">
          <div className="font-bold text-emerald-800 dark:text-emerald-200">Level Solved in {score.byteCount} Bytes ({props.snapshot.stepIndex} steps)!</div>
          <div className="text-emerald-700 dark:text-emerald-300 font-mono">{scoreMsg}</div>
        </div>
      </div>
      {props.onNextLevel && (
        <button type="button" data-testid="btn-next-level" onClick={props.onNextLevel} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs">
          Next Level &rarr;
        </button>
      )}
    </div>
  );
}

export function DebuggerPanel(props: DebuggerPanelProps): ReactElement {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm">
      <TransportControlsBar {...props} />
      <CallStackInspector snapshot={props.snapshot} />
      {props.runtimeError && (
        <div className="px-3 py-2 bg-rose-500/15 border-t border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
          Runtime Error: {props.runtimeError}
        </div>
      )}
      <SolvedBanner snapshot={props.snapshot} score={props.score} onNextLevel={props.onNextLevel} />
    </div>
  );
}

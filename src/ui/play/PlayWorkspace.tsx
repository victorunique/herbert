import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { createSimulationSession, type SimulationSession } from '../../core/gridEngine';
import type { LevelDefinition, SimulationSnapshot } from '../../core/types';
import { GridCanvas } from '../common/GridCanvas';
import { CodeEditorPanel } from './CodeEditorPanel';
import { DebuggerPanel } from './DebuggerPanel';

export interface PlayWorkspaceProps {
  readonly level: LevelDefinition;
  readonly code: string;
  readonly onChangeCode: (nextCode: string) => void;
  readonly onAttemptRecorded: (result: {
    readonly code: string;
    readonly byteCount: number;
    readonly score: number;
    readonly solved: boolean;
  }) => void;
  readonly onNextLevel?: () => void;
}

function usePlaybackTimer(isRunning: boolean, speedMs: number, onTick: () => void): void {
  const callbackRef = useRef(onTick);
  callbackRef.current = onTick;

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = window.setInterval(() => {
      callbackRef.current();
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isRunning, speedMs]);
}

function reportOutcome(session: SimulationSession, code: string, onAttemptRecorded: PlayWorkspaceProps['onAttemptRecorded']): void {
  const sc = session.getScoreBreakdown();
  onAttemptRecorded({ code, byteCount: sc.byteCount, score: sc.totalScore, solved: sc.solved });
}

interface SimController {
  readonly session: SimulationSession;
  readonly snapshot: SimulationSnapshot;
  readonly isRunning: boolean;
  readonly speedMs: number;
  readonly setSpeedMs: (ms: number) => void;
  readonly togglePlay: () => void;
  readonly stepForward: () => void;
  readonly stepBackward: () => void;
  readonly instantRun: () => void;
  readonly reset: () => void;
}

function useSimController(props: PlayWorkspaceProps): SimController {
  const session = useMemo(() => createSimulationSession(props.level, props.code, { maxSteps: 6000 }), [props.level, props.code]);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => session.getCurrentSnapshot());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(80);

  useEffect(() => { setIsRunning(false); setSnapshot(session.reset()); }, [session]);

  const stepForward = (): void => {
    if (!session.canStepForward()) return setIsRunning(false);
    const next = session.stepForward();
    setSnapshot(next);
    if (next.solved || !session.canStepForward()) { setIsRunning(false); reportOutcome(session, props.code, props.onAttemptRecorded); }
  };
  usePlaybackTimer(isRunning, speedMs, stepForward);

  return {
    session, snapshot, isRunning, speedMs, setSpeedMs, stepForward,
    togglePlay: () => setIsRunning((r) => !r),
    stepBackward: () => { setIsRunning(false); setSnapshot(session.stepBackward()); },
    instantRun: () => { setIsRunning(false); setSnapshot(session.runToCompletion()); reportOutcome(session, props.code, props.onAttemptRecorded); },
    reset: () => { setIsRunning(false); setSnapshot(session.reset()); },
  };
}

export function PlayWorkspace(props: PlayWorkspaceProps): ReactElement {
  const ctrl = useSimController(props);
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 sm:p-4 overflow-y-auto lg:overflow-hidden">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {props.level.description && (
          <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <strong className="text-slate-900 dark:text-white mr-1.5">{props.level.name}:</strong>{props.level.description}
          </div>
        )}
        <GridCanvas level={props.level} snapshot={ctrl.snapshot} />
      </div>
      <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col gap-3 shrink-0">
        <CodeEditorPanel code={props.code} onChangeCode={props.onChangeCode} maxBytes={props.level.maxBytes} basePoints={props.level.basePoints} diagnostics={ctrl.session.compileDiagnostics} activeToken={ctrl.snapshot.activeToken} hint={props.level.hint} />
        <DebuggerPanel snapshot={ctrl.snapshot} isRunning={ctrl.isRunning} canStepForward={ctrl.session.canStepForward()} canStepBackward={ctrl.session.canStepBackward()} speedMs={ctrl.speedMs} onChangeSpeedMs={ctrl.setSpeedMs} onTogglePlay={ctrl.togglePlay} onStepForward={ctrl.stepForward} onStepBackward={ctrl.stepBackward} onInstantRun={ctrl.instantRun} onReset={ctrl.reset} score={ctrl.session.getScoreBreakdown()} runtimeError={ctrl.session.runtimeError} onNextLevel={props.onNextLevel} />
      </div>
    </div>
  );
}

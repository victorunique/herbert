import { useState, type ReactElement } from 'react';
import { CheckCircle2, Play, Sparkles } from 'lucide-react';
import { TUTORIAL_LESSONS, type TutorialLesson } from '../../content/tutorialLessons';
import { createInitialSnapshot, createSimulationSession } from '../../core/gridEngine';
import { tokenize } from '../../core/lexer';
import type { SimulationSnapshot } from '../../core/types';
import { GridCanvas } from '../common/GridCanvas';

export interface TutorialWorkspaceProps {
  readonly completedIds: readonly string[];
  readonly onMarkCompleted: (lessonId: string) => void;
}

function LessonSidebar(props: {
  readonly lessons: readonly TutorialLesson[];
  readonly activeId: string;
  readonly completedIds: readonly string[];
  readonly onSelect: (lesson: TutorialLesson) => void;
}): ReactElement {
  return (
    <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 shrink-0">
      <div className="px-2 py-1"><h2 className="text-sm font-bold text-slate-900 dark:text-white">5-Minute Quick-Start Tutorial</h2><p className="text-xs text-slate-500 dark:text-slate-400">Completed {props.completedIds.length} / {props.lessons.length}</p></div>
      {props.lessons.map((lesson) => {
        const cls = lesson.id === props.activeId ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-sky-300 font-semibold' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60';
        return (
          <button key={lesson.id} type="button" data-testid={`tutorial-tab-${lesson.stepNumber}`} onClick={() => props.onSelect(lesson)} className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${cls}`}>
            <span className="truncate">{lesson.title}</span>
            {props.completedIds.includes(lesson.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          </button>
        );
      })}
    </aside>
  );
}

function LessonTheoryCard(props: { readonly lesson: TutorialLesson; readonly isCompleted: boolean }): ReactElement {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-sky-300 font-mono text-xs font-semibold">
          {props.lesson.conceptBadge}
        </span>
        <span data-testid="tutorial-lesson-status" className={`text-xs font-bold ${props.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {props.isCompleted ? 'Completed' : 'In Progress'}
        </span>
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{props.lesson.title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{props.lesson.explanation}</p>
      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
        {props.lesson.keyTakeaways.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function LessonSandboxEditor(props: {
  readonly lesson: TutorialLesson;
  readonly code: string;
  readonly onChangeCode: (next: string) => void;
  readonly onRunVerify: () => void;
  readonly feedback: string;
}): ReactElement {
  const byteCount = tokenize(props.code).byteCount;
  return (
    <div className="w-full xl:w-96 flex flex-col gap-3 shrink-0">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs"><span className="font-bold">Try It Yourself</span><span className="font-mono text-blue-600 dark:text-sky-400">{byteCount} / {props.lesson.level.maxBytes} Bytes</span></div>
        <textarea data-testid="tutorial-code-input" value={props.code} onChange={(e) => props.onChangeCode(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="w-full h-32 p-3 rounded-lg font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800" />
        <div className="flex items-center gap-2">
          <button type="button" data-testid="tutorial-use-solution" onClick={() => props.onChangeCode(props.lesson.sampleSolution)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold"><Sparkles className="w-3.5 h-3.5 text-amber-500" /><span>Load Sample Solution</span></button>
          <button type="button" data-testid="tutorial-run-verify" onClick={props.onRunVerify} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"><Play className="w-3.5 h-3.5" /><span>Run &amp; Verify</span></button>
        </div>
        <div data-testid="tutorial-feedback" className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300">{props.feedback}</div>
      </div>
    </div>
  );
}

function verifyTutorialAttempt(
  lesson: TutorialLesson,
  code: string,
  setSnapshot: (s: SimulationSnapshot) => void,
  setFeedback: (msg: string) => void,
  onMarkCompleted: (id: string) => void,
): void {
  const fresh = createSimulationSession(lesson.level, code, { maxSteps: 2000 });
  if (fresh.compileDiagnostics.length > 0) {
    setFeedback(`Syntax Error: ${fresh.compileDiagnostics[0]?.message ?? ''}`);
    return;
  }
  const endSnap = fresh.runToCompletion();
  setSnapshot(endSnap);
  if (endSnap.solved && fresh.byteCount <= lesson.level.maxBytes) {
    onMarkCompleted(lesson.id);
    setFeedback(`Awesome! Lesson solved in ${fresh.byteCount} Bytes!`);
  } else {
    setFeedback('Not all white buttons were lit within the byte limit. Try the sample solution!');
  }
}

export function TutorialWorkspace(props: TutorialWorkspaceProps): ReactElement {
  const [activeLesson, setActiveLesson] = useState<TutorialLesson>(() => TUTORIAL_LESSONS[0]!);
  const [code, setCode] = useState<string>(() => TUTORIAL_LESSONS[0]!.starterCode);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => createInitialSnapshot(TUTORIAL_LESSONS[0]!.level));
  const [feedback, setFeedback] = useState<string>('Write or load the sample solution and click Run & Verify.');

  return (
    <div data-testid="tutorial-workspace" className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 overflow-y-auto">
      <LessonSidebar
        lessons={TUTORIAL_LESSONS} activeId={activeLesson.id} completedIds={props.completedIds}
        onSelect={(lesson) => { setActiveLesson(lesson); setCode(lesson.starterCode); setSnapshot(createInitialSnapshot(lesson.level)); setFeedback('Ready to test.'); }}
      />
      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-w-0">
        <div className="flex-1 flex flex-col gap-3">
          <LessonTheoryCard lesson={activeLesson} isCompleted={props.completedIds.includes(activeLesson.id)} />
          <GridCanvas level={activeLesson.level} snapshot={snapshot} />
        </div>
        <LessonSandboxEditor lesson={activeLesson} code={code} onChangeCode={setCode} onRunVerify={() => verifyTutorialAttempt(activeLesson, code, setSnapshot, setFeedback, props.onMarkCompleted)} feedback={feedback} />
      </div>
    </div>
  );
}

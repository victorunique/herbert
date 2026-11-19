import type { ReactElement } from 'react';
import { X } from 'lucide-react';

export interface ReferenceDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface RefCardData {
  readonly title: string;
  readonly lines: readonly string[];
  readonly codeSample?: string;
}

const REFERENCE_SECTIONS: readonly RefCardData[] = [
  {
    title: '1. Primitive Robot Commands (1 Byte Each)',
    lines: [
      's : Step forward 1 cell. Bumping into a Wall (*) or border leaves Herbert in place.',
      'l : Turn left 90 degrees in place. r : Turn right 90 degrees in place.',
    ],
  },
  {
    title: '2. Map Elements & Instant Victory',
    lines: [
      'White Buttons (w): Press all of them to win! The level completes the instant the last white button lights up.',
      'Gray Buttons (g): Reset traps! Stepping on a gray button resets ALL lit white buttons back to unlit.',
    ],
  },
  {
    title: '3. Procedures, Parameters & The <= 0 Termination Rule',
    lines: [
      'Procedures: Any single lowercase letter except s, l, r (e.g., a:ssra).',
      'Parameters: Any single UPPERCASE letter A-Z.',
      'Non-Positive Stop Rule (<= 0): When any numeric argument evaluates to <= 0, that call is skipped!',
    ],
    codeSample: 'a(X):sa(X-1)\na(5)  // Steps forward 5 times, stops at a(0)',
  },
  {
    title: '4. Higher-Order Command Sequence Arguments',
    lines: ['Parameters can also accept command sequences, enabling fractal growth and step doubling:'],
    codeSample: 'a(X):Xra(Xs)\na(s)  // Executes: s r ss r sss r ssss r ... (9 Bytes!)',
  },
  {
    title: '5. Official Byte Counting Rules (Code Golfing)',
    lines: [
      '1 Byte: Each letter (command, procedure name, or parameter name) and each whole integer literal (1, 15, 255 all cost 1 Byte!).',
      '0 Bytes (FREE): Colon (:), parentheses ( ), comma (,), operators (+ -), spaces, and newlines.',
    ],
  },
];

function ReferenceCard(props: { readonly section: RefCardData }): ReactElement {
  return (
    <section className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <h3 className="text-sm font-bold text-blue-600 dark:text-sky-400">{props.section.title}</h3>
      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
        {props.section.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {props.section.codeSample && (
          <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-xs">{props.section.codeSample}</pre>
        )}
      </div>
    </section>
  );
}

export function ReferenceDrawer(props: ReferenceDrawerProps): ReactElement | null {
  if (!props.isOpen) return null;
  return (
    <div data-testid="reference-drawer" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">H Language Official Reference &amp; Cheat Sheet</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete syntax, grid physics, and official byte-counting rules.</p>
          </div>
          <button type="button" data-testid="close-reference-btn" onClick={props.onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {REFERENCE_SECTIONS.map((sec) => (
            <ReferenceCard key={sec.title} section={sec} />
          ))}
        </div>
      </div>
    </div>
  );
}

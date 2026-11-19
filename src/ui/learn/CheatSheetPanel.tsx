import type { ReactElement } from 'react';

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
    title: '2. Map Elements, Grid Size & Instant Victory',
    lines: [
      'Grid Size: Standard maps are 25x25. Custom maps support any integer width and height from 25 to 40 (square or rectangular).',
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
    <section className="space-y-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
      <h3 className="text-sm font-bold text-blue-600 dark:text-sky-400">{props.section.title}</h3>
      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
        {props.section.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {props.section.codeSample && (
          <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
            {props.section.codeSample}
          </pre>
        )}
      </div>
    </section>
  );
}

export function CheatSheetPanel(): ReactElement {
  return (
    <div data-testid="learn-cheatsheet-panel" className="flex-1 space-y-4 max-w-4xl">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          H Language Official Reference &amp; Cheat Sheet
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete syntax, grid physics, and official byte-counting rules in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REFERENCE_SECTIONS.map((sec) => (
          <ReferenceCard key={sec.title} section={sec} />
        ))}
      </div>
    </div>
  );
}

import { useState, type ReactElement } from 'react';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { tokenize } from '../../core/lexer';
import type { Diagnostic, Token } from '../../core/types';

export interface CodeEditorPanelProps {
  readonly code: string;
  readonly onChangeCode: (nextCode: string) => void;
  readonly maxBytes: number;
  readonly basePoints: number;
  readonly diagnostics: readonly Diagnostic[];
  readonly activeToken: Token | null;
  readonly hint?: string;
}

const QUICK_KEYS: readonly { readonly label: string; readonly insert: string; readonly id: string }[] = [
  { label: 's', insert: 's', id: 's' },
  { label: 'l', insert: 'l', id: 'l' },
  { label: 'r', insert: 'r', id: 'r' },
  { label: ':', insert: ':', id: 'colon' },
  { label: '(', insert: '(', id: 'lparen' },
  { label: ')', insert: ')', id: 'rparen' },
  { label: ',', insert: ',', id: 'comma' },
  { label: '-', insert: '-', id: 'minus' },
  { label: '+', insert: '+', id: 'plus' },
  { label: 'a', insert: 'a', id: 'a' },
  { label: 'b', insert: 'b', id: 'b' },
  { label: 'X', insert: 'X', id: 'X' },
  { label: 'Y', insert: 'Y', id: 'Y' },
  { label: '1', insert: '1', id: '1' },
  { label: '↵', insert: '\n', id: 'newline' },
];

function ByteQuotaHeader(props: { readonly byteCount: number; readonly maxBytes: number }): ReactElement {
  const over = props.byteCount > props.maxBytes;
  const pct = Math.min(100, Math.round((props.byteCount / Math.max(1, props.maxBytes)) * 100));
  const badgeColor = over
    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';

  return (
    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">H Program Editor</span>
        <span data-testid="byte-counter" className={`font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
          {props.byteCount} / {props.maxBytes} Bytes
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full transition-all ${over ? 'bg-rose-500' : 'bg-emerald-500'}`} />
      </div>
    </div>
  );
}

function TokenBadge(props: { readonly tok: Token; readonly isActive: boolean }): ReactElement {
  const costCls =
    props.tok.byteCost === 1
      ? 'bg-blue-500/15 text-blue-700 dark:text-sky-300 border-blue-500/30'
      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent';
  const activeCls = props.isActive ? 'ring-2 ring-amber-400 scale-110 font-bold' : '';
  return (
    <span title={`${props.tok.type}: ${props.tok.byteCost} Byte`} className={`px-1.5 py-0.2 rounded text-[11px] font-mono border ${costCls} ${activeCls}`}>
      {props.tok.value}
      <sub className="ml-0.5 text-[9px] opacity-70">{props.tok.byteCost}B</sub>
    </span>
  );
}

function TokenCostBreakdownStrip(props: { readonly tokens: readonly Token[]; readonly activeToken: Token | null }): ReactElement {
  const visible = props.tokens.filter((t) => t.type !== 'EOL');
  if (visible.length === 0) {
    return (
      <div className="px-3 py-1.5 text-[11px] text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
        1-Byte tokens (letters &amp; numbers) vs. 0-Byte free punctuation (: ( ) , + -) appear here.
      </div>
    );
  }
  return (
    <div data-testid="token-cost-strip" className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
      {visible.map((tok, idx) => (
        <TokenBadge key={`${tok.startOffset}-${idx}`} tok={tok} isActive={Boolean(props.activeToken && props.activeToken.startOffset === tok.startOffset)} />
      ))}
    </div>
  );
}

function resolveInsertedChar(val: string, upperMode: boolean): string {
  const isConvertibleLower = val.length === 1 && val >= 'a' && val <= 'z' && !['s', 'l', 'r'].includes(val);
  return isConvertibleLower && upperMode ? val.toUpperCase() : val;
}

function QuickSymbolBar(props: { readonly code: string; readonly onChangeCode: (next: string) => void }): ReactElement {
  const [upperMode, setUpperMode] = useState<boolean>(false);
  const caseCls = upperMode
    ? 'bg-indigo-600 text-white border-indigo-500'
    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  return (
    <div data-testid="quick-symbol-bar" className="px-2 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1">
      {QUICK_KEYS.map((k) => (
        <button
          key={k.id}
          type="button"
          data-testid={`quick-key-${k.id}`}
          onClick={() => props.onChangeCode(`${props.code}${resolveInsertedChar(k.insert, upperMode)}`)}
          className="px-2 py-1 min-w-[28px] rounded bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold shadow-2xs"
        >
          {k.label}
        </button>
      ))}
      <button type="button" data-testid="quick-key-case" onClick={() => setUpperMode((u) => !u)} className={`px-2 py-1 rounded font-mono text-xs font-semibold border ${caseCls}`}>
        a/A
      </button>
      <button type="button" data-testid="quick-key-backspace" onClick={() => props.onChangeCode(props.code.slice(0, -1))} className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono text-xs font-semibold">
        ⌫
      </button>
    </div>
  );
}

function DiagnosticsStatusStrip(props: { readonly diagnostics: readonly Diagnostic[] }): ReactElement {
  if (props.diagnostics.length === 0) {
    return (
      <div className="px-3 py-1 bg-emerald-500/5 border-t border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Syntax valid</span>
      </div>
    );
  }
  return (
    <div data-testid="compile-diagnostics" className="px-3 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-1 max-h-24 overflow-y-auto">
      {props.diagnostics.map((d, i) => (
        <div key={`${d.line}-${d.col}-${i}`} className="flex items-center gap-1.5 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Ln {d.line}, Col {d.col}: {d.message}</span>
        </div>
      ))}
    </div>
  );
}

function HintBar(props: { readonly hint?: string }): ReactElement | null {
  const [showHint, setShowHint] = useState<boolean>(false);
  if (!props.hint) return null;
  return (
    <div className="px-3 py-1.5 bg-amber-500/5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
      <button type="button" onClick={() => setShowHint((h) => !h)} className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium hover:underline">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
      </button>
      {showHint && <span className="text-slate-600 dark:text-slate-300 ml-2 truncate">{props.hint}</span>}
    </div>
  );
}

export function CodeEditorPanel(props: CodeEditorPanelProps): ReactElement {
  const lexed = tokenize(props.code);
  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm">
      <ByteQuotaHeader byteCount={lexed.byteCount} maxBytes={props.maxBytes} />
      <TokenCostBreakdownStrip tokens={lexed.tokens} activeToken={props.activeToken} />
      <div className="relative flex-1 min-h-[140px]">
        <textarea
          data-testid="code-editor"
          value={props.code}
          onChange={(e) => props.onChangeCode(e.target.value)}
          placeholder={'// Example:\na(X):sa(X-1)\na(4)'}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="w-full h-full min-h-[140px] p-3 font-mono text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y leading-relaxed"
        />
      </div>
      <HintBar hint={props.hint} />
      <DiagnosticsStatusStrip diagnostics={props.diagnostics} />
      <QuickSymbolBar code={props.code} onChangeCode={props.onChangeCode} />
    </div>
  );
}

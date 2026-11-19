import { useState, type ChangeEvent, type ReactElement } from 'react';
import { Download, Play, Save, Trash2, Upload } from 'lucide-react';
import {
  createBlankLevel,
  parseBatchLevelFiles,
  parseLevelText,
  serializeLevelToText,
  type BatchFileEntry,
} from '../../core/levelCodec';
import type { CellType, Coordinates, LevelDefinition, RobotDirection } from '../../core/types';
import { GridCanvas } from '../common/GridCanvas';

export interface LevelEditorWorkspaceProps {
  readonly customLevels: readonly LevelDefinition[];
  readonly onSaveLevel: (level: LevelDefinition) => void;
  readonly onDeleteLevel: (levelId: string) => void;
  readonly onTestLevelInPlay: (level: LevelDefinition) => void;
}

export type BrushTool = '.' | '*' | 'w' | 'g' | 'u' | 'r' | 'd' | 'l';
export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'four_way';

const GRID_DIMENSIONS: readonly number[] = Array.from({ length: 16 }, (_, i) => 25 + i);

const BRUSH_OPTIONS: readonly { readonly tool: BrushTool; readonly label: string }[] = [
  { tool: '*', label: 'Wall (*)' },
  { tool: 'w', label: 'White Btn (w)' },
  { tool: 'g', label: 'Gray Trap (g)' },
  { tool: '.', label: 'Eraser (.)' },
  { tool: 'u', label: 'Start Up (u)' },
  { tool: 'r', label: 'Start Right (r)' },
  { tool: 'd', label: 'Start Down (d)' },
  { tool: 'l', label: 'Start Left (l)' },
];

function computeSymmetricCoords(row: number, col: number, width: number, height: number, symmetry: SymmetryMode): Coordinates[] {
  const pts: Coordinates[] = [{ row, col }];
  const mirCol = width - 1 - col;
  const mirRow = height - 1 - row;
  if (symmetry === 'horizontal' || symmetry === 'four_way') pts.push({ row, col: mirCol });
  if (symmetry === 'vertical' || symmetry === 'four_way') pts.push({ row: mirRow, col });
  if (symmetry === 'four_way') pts.push({ row: mirRow, col: mirCol });
  return pts;
}

function collectButtonCoordinates(grid: readonly (readonly CellType[])[]): { whiteButtons: Coordinates[]; grayButtons: Coordinates[] } {
  const whiteButtons: Coordinates[] = [];
  const grayButtons: Coordinates[] = [];
  grid.forEach((rCells, r) =>
    rCells.forEach((cell, c) => {
      if (cell === 'w') whiteButtons.push({ row: r, col: c });
      if (cell === 'g') grayButtons.push({ row: r, col: c });
    }),
  );
  return { whiteButtons, grayButtons };
}

function paintLevelGrid(level: LevelDefinition, row: number, col: number, brush: BrushTool, symmetry: SymmetryMode): LevelDefinition {
  const mutableGrid: CellType[][] = level.grid.map((r) => [...r]);
  let start = level.start;
  let startDir: RobotDirection = level.startDir;

  if (brush === 'u' || brush === 'r' || brush === 'd' || brush === 'l') {
    mutableGrid[row]![col] = '.';
    start = { row, col };
    startDir = brush;
  } else {
    for (const pt of computeSymmetricCoords(row, col, level.width, level.height, symmetry)) {
      if (pt.row === start.row && pt.col === start.col) continue;
      mutableGrid[pt.row]![pt.col] = brush;
    }
  }
  const { whiteButtons, grayButtons } = collectButtonCoordinates(mutableGrid);
  return { ...level, grid: mutableGrid, start, startDir, whiteButtons, grayButtons };
}

function resizeLevelDraft(level: LevelDefinition, newWidth: number, newHeight: number): LevelDefinition {
  return createBlankLevel({
    id: level.id,
    name: level.name,
    width: newWidth,
    height: newHeight,
    maxBytes: level.maxBytes,
    basePoints: level.basePoints,
  });
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DimensionSelect(props: {
  readonly label: string;
  readonly testId: string;
  readonly value: number;
  readonly unit: string;
  readonly onChange: (v: number) => void;
}): ReactElement {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-slate-600 dark:text-slate-400">{props.label}</span>
      <select
        data-testid={props.testId}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
      >
        {GRID_DIMENSIONS.map((d) => (
          <option key={d} value={d}>{d} {props.unit}</option>
        ))}
      </select>
    </label>
  );
}

function SymmetrySelect(props: { readonly symmetry: SymmetryMode; readonly onChange: (s: SymmetryMode) => void }): ReactElement {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-slate-600 dark:text-slate-400">Symmetry Brush</span>
      <select
        data-testid="editor-symmetry-select"
        value={props.symmetry}
        onChange={(e) => props.onChange(e.target.value as SymmetryMode)}
        className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
      >
        <option value="none">None (Single)</option>
        <option value="horizontal">Horizontal Mirror</option>
        <option value="vertical">Vertical Mirror</option>
        <option value="four_way">4-Way Mirror</option>
      </select>
    </label>
  );
}

function EditorMetadataBar(props: {
  readonly draft: LevelDefinition;
  readonly onChangeDraft: (next: LevelDefinition) => void;
  readonly symmetry: SymmetryMode;
  readonly onChangeSymmetry: (s: SymmetryMode) => void;
}): ReactElement {
  const { draft } = props;
  const inputCls = 'px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700';
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Level Name</span>
        <input type="text" data-testid="editor-name-input" value={draft.name} onChange={(e) => props.onChangeDraft({ ...draft, name: e.target.value })} className={inputCls} />
      </label>
      <DimensionSelect label="Width (25-40)" testId="editor-width-select" value={draft.width} unit="cols" onChange={(w) => props.onChangeDraft(resizeLevelDraft(draft, w, draft.height))} />
      <DimensionSelect label="Height (25-40)" testId="editor-height-select" value={draft.height} unit="rows" onChange={(h) => props.onChangeDraft(resizeLevelDraft(draft, draft.width, h))} />
      <label className="flex flex-col gap-1">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Max Bytes</span>
        <input type="number" min={1} max={999} data-testid="editor-max-bytes-input" value={draft.maxBytes} onChange={(e) => props.onChangeDraft({ ...draft, maxBytes: Math.max(1, Number(e.target.value) || 1) })} className={`${inputCls} font-mono`} />
      </label>
      <SymmetrySelect symmetry={props.symmetry} onChange={props.onChangeSymmetry} />
    </div>
  );
}

function SavedCustomLevelsCard(props: {
  readonly customLevels: readonly LevelDefinition[];
  readonly onSelectDraft: (lvl: LevelDefinition) => void;
  readonly onDeleteLevel: (id: string) => void;
}): ReactElement {
  return (
    <div data-testid="custom-levels-list" className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 overflow-y-auto max-h-80">
      <div className="font-bold text-xs text-slate-700 dark:text-slate-300">Saved &amp; Imported Custom Levels ({props.customLevels.length})</div>
      {props.customLevels.length === 0 ? (
        <p className="text-xs text-slate-400">No custom levels saved yet.</p>
      ) : (
        props.customLevels.map((lvl) => (
          <div key={lvl.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <button type="button" onClick={() => props.onSelectDraft(lvl)} className="text-left font-medium hover:text-blue-500 truncate flex-1">
              {lvl.name} <span className="font-mono text-[10px] text-slate-400">({lvl.width}x{lvl.height})</span>
            </button>
            <button type="button" aria-label={`Delete ${lvl.name}`} onClick={() => props.onDeleteLevel(lvl.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function BatchImportExportSidebar(props: {
  readonly draft: LevelDefinition;
  readonly customLevels: readonly LevelDefinition[];
  readonly statusMsg: string;
  readonly onSelectDraft: (lvl: LevelDefinition) => void;
  readonly onDeleteLevel: (id: string) => void;
  readonly onSaveCurrent: () => void;
  readonly onTestCurrent: () => void;
  readonly onExportCurrent: () => void;
  readonly onBatchUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}): ReactElement {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between"><span className="font-bold text-sm">Level Actions</span><span data-testid="editor-dim-indicator" className="font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-sky-300">{props.draft.width} x {props.draft.height}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" data-testid="editor-save-btn" onClick={props.onSaveCurrent} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"><Save className="w-3.5 h-3.5" /><span>Save Level</span></button>
          <button type="button" data-testid="editor-test-btn" onClick={props.onTestCurrent} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"><Play className="w-3.5 h-3.5" /><span>Test in Play</span></button>
        </div>
        <button type="button" data-testid="editor-export-txt-btn" onClick={props.onExportCurrent} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold border border-slate-300 dark:border-slate-700"><Download className="w-3.5 h-3.5" /><span>Export Current Level (.txt)</span></button>
        <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold cursor-pointer"><Upload className="w-3.5 h-3.5" /><span>Batch Upload .txt Levels</span><input type="file" accept=".txt,text/plain" multiple data-testid="batch-upload-input" onChange={props.onBatchUpload} className="hidden" /></label>
        <div data-testid="editor-status-msg" className="p-2 rounded bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300">{props.statusMsg}</div>
      </div>
      <SavedCustomLevelsCard customLevels={props.customLevels} onSelectDraft={props.onSelectDraft} onDeleteLevel={props.onDeleteLevel} />
    </div>
  );
}

function BrushPaletteBar(props: { readonly brush: BrushTool; readonly onSelectBrush: (b: BrushTool) => void }): ReactElement {
  return (
    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
      {BRUSH_OPTIONS.map((opt) => (
        <button
          key={opt.tool}
          type="button"
          data-testid={`brush-${opt.tool}`}
          onClick={() => props.onSelectBrush(opt.tool)}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
            props.brush === opt.tool
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

async function processBatchUploadFiles(
  fileList: FileList,
  onSaveLevel: (lvl: LevelDefinition) => void,
  setDraft: (lvl: LevelDefinition) => void,
): Promise<string> {
  const entries: BatchFileEntry[] = [];
  for (const file of Array.from(fileList)) {
    entries.push({ filename: file.name, content: await file.text() });
  }
  const batch = parseBatchLevelFiles(entries);
  batch.validLevels.forEach(onSaveLevel);
  if (batch.validLevels[0]) setDraft(batch.validLevels[0]);
  const failText = batch.failedFiles.map((f) => `${f.filename}: ${f.errors[0] ?? 'Invalid'}`).join(' | ');
  return `Imported ${batch.validLevels.length} level(s). ${
    batch.failedFiles.length > 0 ? `Failed (${batch.failedFiles.length}): ${failText}` : ''
  }`;
}

function checkValidLevel(draft: LevelDefinition, setStatusMsg: (m: string) => void): LevelDefinition | null {
  const check = parseLevelText(serializeLevelToText(draft), {
    id: draft.id,
    fallbackName: draft.name,
    maxBytes: draft.maxBytes,
    basePoints: draft.basePoints,
  });
  if (!check.level) setStatusMsg(`Validation Error: ${check.errors.join('; ')}`);
  return check.level;
}

export function LevelEditorWorkspace(props: LevelEditorWorkspaceProps): ReactElement {
  const [draft, setDraft] = useState<LevelDefinition>(() => createBlankLevel({ id: `custom-${Date.now()}`, name: 'Custom Puzzle' }));
  const [brush, setBrush] = useState<BrushTool>('w');
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [statusMsg, setStatusMsg] = useState<string>('Select a brush and paint on the WxH grid (25 to 40).');
  const paintAt = (r: number, c: number): void => setDraft((prev) => paintLevelGrid(prev, r, c, brush, symmetry));

  return (
    <div data-testid="editor-workspace" className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 overflow-y-auto">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <EditorMetadataBar draft={draft} onChangeDraft={setDraft} symmetry={symmetry} onChangeSymmetry={setSymmetry} />
        <BrushPaletteBar brush={brush} onSelectBrush={setBrush} />
        <GridCanvas level={draft} interactive onCellClick={paintAt} onCellDrag={paintAt} />
      </div>
      <BatchImportExportSidebar
        draft={draft} customLevels={props.customLevels} statusMsg={statusMsg} onSelectDraft={setDraft} onDeleteLevel={props.onDeleteLevel}
        onSaveCurrent={() => { const valid = checkValidLevel(draft, setStatusMsg); if (valid) { props.onSaveLevel(valid); setStatusMsg(`Saved '${valid.name}' (${valid.width}x${valid.height}).`); } }}
        onTestCurrent={() => { const valid = checkValidLevel(draft, setStatusMsg); if (valid) { props.onSaveLevel(valid); props.onTestLevelInPlay(valid); } }}
        onExportCurrent={() => { const valid = checkValidLevel(draft, setStatusMsg); if (valid) downloadTextFile(`${valid.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'level'}.txt`, serializeLevelToText(valid)); }}
        onBatchUpload={async (e) => { if (e.target.files?.length) setStatusMsg(await processBatchUploadFiles(e.target.files, props.onSaveLevel, setDraft)); }}
      />
    </div>
  );
}

import { useState, type ReactElement } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { coordKey } from '../../core/gridEngine';
import type { CellType, LevelDefinition, RobotDirection, SimulationSnapshot } from '../../core/types';

export interface GridCanvasProps {
  readonly level: LevelDefinition;
  readonly snapshot?: SimulationSnapshot;
  readonly interactive?: boolean;
  readonly onCellClick?: (row: number, col: number) => void;
  readonly onCellDrag?: (row: number, col: number) => void;
}

const ROTATION_DEG: Readonly<Record<RobotDirection, number>> = { u: 0, r: 90, d: 180, l: 270 };

function CellGraphic(props: {
  readonly cell: CellType;
  readonly isLit: boolean;
  readonly hasRobot: boolean;
  readonly robotDir: RobotDirection;
}): ReactElement {
  if (props.hasRobot) {
    return (
      <svg viewBox="0 0 24 24" style={{ transform: `rotate(${ROTATION_DEG[props.robotDir]}deg)` }} className="w-4/5 h-4/5 text-blue-600 dark:text-sky-400 drop-shadow">
        <path fill="currentColor" d="M12 2L4 20l8-4 8 4-8-18z" />
      </svg>
    );
  }
  if (props.cell === 'w') {
    const litCls = props.isLit
      ? 'bg-emerald-500 dark:bg-emerald-400 border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.85)] scale-105'
      : 'bg-white dark:bg-slate-200 border-sky-500 dark:border-sky-400';
    return <div className={`w-3/5 h-3/5 rounded-full border-2 transition-all ${litCls}`} />;
  }
  if (props.cell === 'g') {
    return <div className="w-3/5 h-3/5 rounded-sm rotate-45 bg-rose-500/85 dark:bg-rose-500 border border-rose-200 shadow-sm" />;
  }
  return <span />;
}

function getCellBgClass(cell: CellType, isLit: boolean): string {
  if (cell === '*') return 'bg-slate-700 dark:bg-slate-600 border-slate-800 dark:border-slate-700 shadow-inner';
  if (cell === 'w' && isLit) return 'bg-emerald-500/20 dark:bg-emerald-500/25 border-emerald-400/50';
  if (cell === 'g') return 'bg-rose-500/15 dark:bg-rose-950/50 border-rose-400/40';
  return 'bg-slate-100 dark:bg-slate-800/85 border-slate-300/60 dark:border-slate-700/60';
}

function ZoomControls(props: {
  readonly zoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}): ReactElement {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={props.onZoomOut} aria-label="Zoom Out" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800">
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="font-mono text-[11px] px-1 text-slate-600 dark:text-slate-400">{Math.round(props.zoom * 100)}%</span>
      <button type="button" onClick={props.onZoomIn} aria-label="Zoom In" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800">
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={props.onResetZoom} aria-label="Reset Zoom" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-800">
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CanvasToolbar(props: {
  readonly level: LevelDefinition;
  readonly snapshot?: SimulationSnapshot;
  readonly zoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}): ReactElement {
  const robotR = props.snapshot?.robotRow ?? props.level.start.row;
  const robotC = props.snapshot?.robotCol ?? props.level.start.col;
  const litCount = props.snapshot?.litButtons.length ?? 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-200/70 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 text-xs">
      <div className="flex items-center gap-3 font-mono">
        <span className="text-slate-600 dark:text-slate-400">Map: <strong className="text-slate-900 dark:text-slate-100">{props.level.width}x{props.level.height}</strong></span>
        <span className="text-slate-600 dark:text-slate-400">Pos: <strong data-testid="robot-coords" className="text-blue-600 dark:text-sky-400">({robotR},{robotC})</strong></span>
        <span className="text-slate-600 dark:text-slate-400">White Buttons: <strong data-testid="lit-targets-count" className="text-emerald-600 dark:text-emerald-400">{litCount}/{props.level.whiteButtons.length}</strong></span>
      </div>
      <ZoomControls zoom={props.zoom} onZoomIn={props.onZoomIn} onZoomOut={props.onZoomOut} onResetZoom={props.onResetZoom} />
    </div>
  );
}

function computeBaseCellPx(width: number, height: number): number {
  const maxAxis = Math.max(width, height);
  if (maxAxis <= 27) return 18;
  return maxAxis <= 41 ? 14 : 10;
}

function getGridBorderClass(snapshot?: SimulationSnapshot): string {
  if (snapshot?.triggeredGrayReset) return 'border-rose-500 ring-2 ring-rose-500/40';
  if (snapshot?.bumpedWall) return 'border-amber-500';
  return 'border-slate-400 dark:border-slate-700';
}

function GridCellTile(props: {
  readonly r: number;
  readonly c: number;
  readonly cell: CellType;
  readonly isLit: boolean;
  readonly hasRobot: boolean;
  readonly robotDir: RobotDirection;
  readonly interactive?: boolean;
  readonly onDown: () => void;
  readonly onEnter: () => void;
}): ReactElement {
  const cls = getCellBgClass(props.cell, props.isLit);
  const hoverCls = props.interactive ? 'cursor-crosshair hover:brightness-110' : '';
  return (
    <div
      data-testid={`grid-cell-${props.r}-${props.c}`}
      onMouseDown={props.onDown}
      onMouseEnter={props.onEnter}
      className={`border-[0.5px] flex items-center justify-center ${cls} ${hoverCls}`}
    >
      <CellGraphic cell={props.cell} isLit={props.isLit} hasRobot={props.hasRobot} robotDir={props.robotDir} />
    </div>
  );
}

function GridBoardMatrix(props: {
  readonly level: LevelDefinition;
  readonly snapshot?: SimulationSnapshot;
  readonly cellPx: number;
  readonly interactive?: boolean;
  readonly isPainting: boolean;
  readonly setIsPainting: (v: boolean) => void;
  readonly onCellClick?: (r: number, c: number) => void;
  readonly onCellDrag?: (r: number, c: number) => void;
}): ReactElement {
  const robotRow = props.snapshot?.robotRow ?? props.level.start.row;
  const robotCol = props.snapshot?.robotCol ?? props.level.start.col;
  const robotDir = props.snapshot?.robotDir ?? props.level.startDir;
  const litSet = new Set(props.snapshot?.litButtons ?? []);
  const style = { display: 'grid', gridTemplateColumns: `repeat(${props.level.width}, ${props.cellPx}px)`, gridTemplateRows: `repeat(${props.level.height}, ${props.cellPx}px)` };

  return (
    <div data-testid="grid-canvas" style={style} className={`border-2 rounded shadow-md select-none ${getGridBorderClass(props.snapshot)}`}>
      {props.level.grid.map((row, r) =>
        row.map((cell, c) => (
          <GridCellTile
            key={coordKey(r, c)} r={r} c={c} cell={cell} isLit={litSet.has(coordKey(r, c))} hasRobot={r === robotRow && c === robotCol} robotDir={robotDir} interactive={props.interactive}
            onDown={() => { if (props.interactive) { props.setIsPainting(true); props.onCellClick?.(r, c); } }}
            onEnter={() => { if (props.interactive && props.isPainting) props.onCellDrag?.(r, c); }}
          />
        )),
      )}
    </div>
  );
}

export function GridCanvas(props: GridCanvasProps): ReactElement {
  const [zoom, setZoom] = useState<number>(1);
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const cellPx = Math.max(8, Math.round(computeBaseCellPx(props.level.width, props.level.height) * zoom));

  return (
    <div
      className="flex flex-col flex-1 min-h-[260px] bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm"
      onMouseUp={() => setIsPainting(false)}
      onMouseLeave={() => setIsPainting(false)}
    >
      <CanvasToolbar
        level={props.level}
        snapshot={props.snapshot}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
        onResetZoom={() => setZoom(1)}
      />
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4">
        <GridBoardMatrix {...props} cellPx={cellPx} isPainting={isPainting} setIsPainting={setIsPainting} />
      </div>
    </div>
  );
}

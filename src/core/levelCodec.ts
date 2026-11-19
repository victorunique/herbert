import type {
  CellType,
  Coordinates,
  LevelDefinition,
  LevelParseResult,
  RobotDirection,
} from './types';

export interface ParseLevelOptions {
  readonly id?: string;
  readonly fallbackName?: string;
  readonly maxBytes?: number;
  readonly basePoints?: number;
  readonly chapter?: number;
  readonly description?: string;
  readonly hint?: string;
  readonly referenceSolution?: string;
}

export interface BatchFileEntry {
  readonly filename: string;
  readonly content: string;
}

export interface BatchParseResult {
  readonly validLevels: readonly LevelDefinition[];
  readonly failedFiles: readonly { readonly filename: string; readonly errors: readonly string[] }[];
}

const MIN_DIM = 25;
const MAX_DIM = 75;
const START_DIRS = new Set<string>(['u', 'r', 'd', 'l']);
const CELL_CHARS = new Set<string>(['.', '*', 'w', 'g']);

export function isValidGridDimension(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_DIM && value <= MAX_DIM && value % 2 === 1;
}

function parseMetaComment(commentLine: string): { key: string; val: string } {
  const body = commentLine.slice(1).trim();
  const colonIdx = body.indexOf(':');
  if (colonIdx === -1) return { key: '', val: '' };
  return {
    key: body.slice(0, colonIdx).trim().toLowerCase(),
    val: body.slice(colonIdx + 1).trim(),
  };
}

function applyMetadataLine(
  comment: string,
  meta: { name: string; maxBytes: number; basePoints: number },
): void {
  const { key, val } = parseMetaComment(comment);
  if (key === 'name' && val) meta.name = val;
  if (key === 'max_bytes') {
    const parsed = Number.parseInt(val, 10);
    if (parsed > 0) meta.maxBytes = parsed;
  }
  if (key === 'points') {
    const parsed = Number.parseInt(val, 10);
    if (parsed > 0) meta.basePoints = parsed;
  }
}

function defaultMetadata(options?: ParseLevelOptions): {
  name: string;
  maxBytes: number;
  basePoints: number;
} {
  return {
    name: options?.fallbackName ?? 'Custom Level',
    maxBytes: options?.maxBytes ?? 25,
    basePoints: options?.basePoints ?? 100,
  };
}

function extractLinesAndMetadata(
  rawText: string,
  options?: ParseLevelOptions,
): {
  name: string;
  maxBytes: number;
  basePoints: number;
  gridLines: string[];
} {
  const meta = defaultMetadata(options);
  const gridLines: string[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      applyMetadataLine(trimmed, meta);
    } else {
      gridLines.push(trimmed);
    }
  }
  return { ...meta, gridLines };
}

function checkAxisDimension(label: string, val: number, errors: string[]): void {
  if (val < MIN_DIM || val > MAX_DIM) {
    errors.push(`Grid ${label} (${val}) must be between ${MIN_DIM} and ${MAX_DIM}`);
  } else if (val % 2 === 0) {
    errors.push(`Grid ${label} (${val}) must be an odd integer`);
  }
}

function validateDimensions(
  gridLines: readonly string[],
  errors: string[],
): { width: number; height: number } {
  const height = gridLines.length;
  const width = gridLines[0]?.length ?? 0;
  checkAxisDimension('height', height, errors);
  checkAxisDimension('width', width, errors);
  gridLines.forEach((line, idx) => {
    if (line.length !== width) {
      errors.push(`Row ${idx + 1} has length ${line.length}, expected uniform width ${width}`);
    }
  });
  return { width, height };
}

interface ScannedEntities {
  readonly grid: CellType[][];
  readonly starts: { pos: Coordinates; dir: RobotDirection }[];
  readonly whiteButtons: Coordinates[];
  readonly grayButtons: Coordinates[];
}

function scanRowCells(
  line: string,
  r: number,
  scanned: ScannedEntities,
  errors: string[],
): CellType[] {
  const rowCells: CellType[] = [];
  for (let c = 0; c < line.length; c += 1) {
    const ch = line[c] ?? '.';
    if (START_DIRS.has(ch)) {
      scanned.starts.push({ pos: { row: r, col: c }, dir: ch as RobotDirection });
      rowCells.push('.');
    } else if (CELL_CHARS.has(ch)) {
      const cell = ch as CellType;
      rowCells.push(cell);
      if (cell === 'w') scanned.whiteButtons.push({ row: r, col: c });
      if (cell === 'g') scanned.grayButtons.push({ row: r, col: c });
    } else {
      errors.push(`Invalid character '${ch}' at row ${r + 1}, col ${c + 1}`);
      rowCells.push('.');
    }
  }
  return rowCells;
}

function scanGridCells(gridLines: readonly string[], errors: string[]): ScannedEntities {
  const scanned: ScannedEntities = { grid: [], starts: [], whiteButtons: [], grayButtons: [] };
  gridLines.forEach((line, r) => {
    scanned.grid.push(scanRowCells(line, r, scanned, errors));
  });
  return scanned;
}

function validateEntities(scanned: ScannedEntities, errors: string[]): void {
  if (scanned.starts.length === 0) {
    errors.push("Missing start position ('u', 'r', 'd', or 'l')");
  } else if (scanned.starts.length > 1) {
    errors.push(`Multiple start positions found (${scanned.starts.length}); exactly 1 is required`);
  }
  if (scanned.whiteButtons.length === 0) {
    errors.push("Level must contain at least one white button ('w')");
  }
}

function buildLevelObject(
  meta: { name: string; maxBytes: number; basePoints: number },
  dims: { width: number; height: number },
  scanned: ScannedEntities,
  options?: ParseLevelOptions,
): LevelDefinition {
  const firstStart = scanned.starts[0]!;
  return {
    id: options?.id ?? `lvl-${meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: meta.name,
    chapter: options?.chapter,
    description: options?.description,
    hint: options?.hint,
    width: dims.width,
    height: dims.height,
    maxBytes: meta.maxBytes,
    basePoints: meta.basePoints,
    grid: scanned.grid,
    start: firstStart.pos,
    startDir: firstStart.dir,
    whiteButtons: scanned.whiteButtons,
    grayButtons: scanned.grayButtons,
    referenceSolution: options?.referenceSolution,
  };
}

export function parseLevelText(rawText: string, options?: ParseLevelOptions): LevelParseResult {
  const errors: string[] = [];
  const meta = extractLinesAndMetadata(rawText, options);
  const dims = validateDimensions(meta.gridLines, errors);
  const scanned = scanGridCells(meta.gridLines, errors);
  validateEntities(scanned, errors);

  if (errors.length > 0) {
    return { level: null, errors };
  }
  return { level: buildLevelObject(meta, dims, scanned, options), errors: [] };
}

export function serializeLevelToText(level: LevelDefinition): string {
  const header = [
    `# name: ${level.name}`,
    `# max_bytes: ${level.maxBytes}`,
    `# points: ${level.basePoints}`,
  ];
  const rows = level.grid.map((row, r) =>
    row
      .map((cell, c) =>
        r === level.start.row && c === level.start.col ? level.startDir : cell,
      )
      .join(''),
  );
  return [...header, ...rows].join('\n');
}

function buildBlankGridText(width: number, height: number): string {
  const rows: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) => {
      const isBorder = r === 0 || r === height - 1 || c === 0 || c === width - 1;
      return isBorder ? '*' : '.';
    }),
  );
  const centerR = Math.floor(height / 2);
  const centerC = Math.floor(width / 2);
  rows[centerR]![centerC] = 'u';
  rows[centerR - 2]![centerC] = 'w';
  return rows.map((r) => r.join('')).join('\n');
}

function normalizeDimension(val?: number): number {
  const candidate = val ?? 25;
  return isValidGridDimension(candidate) ? candidate : 25;
}

export function createBlankLevel(params: {
  readonly id?: string;
  readonly name?: string;
  readonly width?: number;
  readonly height?: number;
  readonly maxBytes?: number;
  readonly basePoints?: number;
} = {}): LevelDefinition {
  const width = normalizeDimension(params.width);
  const height = normalizeDimension(params.height);
  const parsed = parseLevelText(buildBlankGridText(width, height), {
    id: params.id ?? 'custom-level',
    fallbackName: params.name ?? 'New Custom Level',
    maxBytes: params.maxBytes ?? 20,
    basePoints: params.basePoints ?? 100,
  });
  return parsed.level!;
}

export function parseBatchLevelFiles(files: readonly BatchFileEntry[]): BatchParseResult {
  const validLevels: LevelDefinition[] = [];
  const failedFiles: { filename: string; errors: readonly string[] }[] = [];

  files.forEach((file, index) => {
    const cleanName = file.filename.replace(/\.txt$/i, '').replace(/[_-]+/g, ' ').trim();
    const res = parseLevelText(file.content, {
      id: `imported-${Date.now()}-${index}`,
      fallbackName: cleanName || `Imported Level ${index + 1}`,
    });
    if (res.level) {
      validLevels.push(res.level);
    } else {
      failedFiles.push({ filename: file.filename, errors: res.errors });
    }
  });
  return { validLevels, failedFiles };
}

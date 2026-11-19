import { readFileSync } from 'node:fs';
import { createBlankLevel, parseLevelText } from '../core/levelCodec';
import { createSimulationSession } from '../core/gridEngine';

function readCliArg(argv: readonly string[], flag: string, fallback: string): string {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1] !== undefined) {
    return argv[idx + 1] ?? fallback;
  }
  return fallback;
}

function runSimulateCli(): void {
  const argv = process.argv.slice(2);
  const code = readCliArg(argv, '--code', 's').replace(/\\n/g, '\n');
  const levelPath = readCliArg(argv, '--level', '');
  const maxSteps = Number.parseInt(readCliArg(argv, '--max-steps', '5000'), 10);

  const level = levelPath
    ? parseLevelText(readFileSync(levelPath, 'utf-8')).level
    : createBlankLevel();

  if (!level) {
    process.stderr.write('Failed to load level file\n');
    process.exitCode = 1;
    return;
  }

  const session = createSimulationSession(level, code, { maxSteps });
  const finalSnap = session.runToCompletion();
  const score = session.getScoreBreakdown();
  process.stdout.write(
    `${JSON.stringify({ finalSnapshot: finalSnap, score, runtimeError: session.runtimeError }, null, 2)}\n`,
  );
}

runSimulateCli();

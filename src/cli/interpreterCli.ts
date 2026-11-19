import { parseProgram } from '../core/parser';
import { runProgramToSteps } from '../core/interpreter';

function readArgValue(argv: readonly string[], flag: string, fallback: string): string {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1] !== undefined) {
    return argv[idx + 1] ?? fallback;
  }
  return fallback;
}

function runInterpreterCli(): void {
  const argv = process.argv.slice(2);
  const code = readArgValue(argv, '--code', '').replace(/\\n/g, '\n');
  const maxSteps = Number.parseInt(readArgValue(argv, '--max-steps', '1000'), 10);
  const parsed = parseProgram(code);
  if (!parsed.ast) {
    process.stderr.write(`${JSON.stringify(parsed.diagnostics, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }
  const steps = runProgramToSteps(parsed.ast, { maxSteps });
  const summary = {
    byteCount: parsed.byteCount,
    totalSteps: steps.length,
    commands: steps.map((s) => s.command).join(''),
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

runInterpreterCli();

import { parseProgram } from '../core/parser';

function parseCliCodeArg(argv: readonly string[]): string {
  const codeIdx = argv.indexOf('--code');
  if (codeIdx !== -1 && argv[codeIdx + 1] !== undefined) {
    return (argv[codeIdx + 1] ?? '').replace(/\\n/g, '\n');
  }
  return '';
}

function runParserCli(): void {
  const code = parseCliCodeArg(process.argv.slice(2));
  const result = parseProgram(code);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.diagnostics.length > 0) {
    process.exitCode = 1;
  }
}

runParserCli();

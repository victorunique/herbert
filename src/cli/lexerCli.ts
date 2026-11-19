import { tokenize } from '../core/lexer';

function parseCliArgs(argv: readonly string[]): string {
  const codeIdx = argv.indexOf('--code');
  if (codeIdx !== -1 && argv[codeIdx + 1] !== undefined) {
    return (argv[codeIdx + 1] ?? '').replace(/\\n/g, '\n');
  }
  return '';
}

function runLexerCli(): void {
  const code = parseCliArgs(process.argv.slice(2));
  const result = tokenize(code);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.diagnostics.length > 0) {
    process.exitCode = 1;
  }
}

runLexerCli();

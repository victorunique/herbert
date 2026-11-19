import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/unit/lexer.test.ts',
      'tests/unit/parser.test.ts',
      'tests/unit/interpreter.test.ts',
      'tests/unit/levelCodec.test.ts',
      'tests/unit/gridEngine.test.ts',
      'tests/unit/progression.test.ts',
      'tests/integration/gameSimulation.test.ts',
      'tests/integration/campaignSolutions.test.ts',
    ],
  },
});

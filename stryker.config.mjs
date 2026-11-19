/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.stryker.config.ts',
  },
  mutate: [
    'src/core/**/*.ts',
    '!src/core/types.ts',
  ],
  reporters: ['clear-text', 'progress'],
  thresholds: {
    high: 90,
    low: 85,
    break: 85,
  },
  concurrency: 4,
};

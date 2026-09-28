/**
 * Browser test configuration, kept apart from jest.config.js so that the
 * unit-test run (and the CI job that runs it) does not need a web build or a
 * browser. It is stateful and slow, so it runs as a single worker.
 */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/e2e/**/*.spec.ts'],
  testTimeout: 120000,
  maxWorkers: 1
}

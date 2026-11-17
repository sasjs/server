/**
 * The conformance run, kept apart from the unit suite and from the browser one.
 *
 * It boots `setupRoutes` and opens a socket, so the client under test speaks HTTP
 * to a server that is really running - and it is stateful in the order its cases
 * run (a sign-in, then the estate that sign-in reaches), so it runs as a single
 * worker.
 *
 * It needs no web build and no browser, which is what keeps it apart from
 * jest.e2e.config.js: this one runs wherever the unit suite runs.
 */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/conformance/**/*.spec.ts'],
  setupFiles: ['<rootDir>/src/setupEnv.ts'],
  testTimeout: 180000,
  maxWorkers: 1
}

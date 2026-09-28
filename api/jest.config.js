module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  // FIXME: improve test coverage and uncomment below lines
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10
  //   }
  // },
  collectCoverageFrom: ['src/**/{!(index),}.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/build/',
    // The browser test needs a web build and a browser, so it runs through
    // jest.e2e.config.js (`npm run test:e2e`) instead.
    '<rootDir>/src/e2e/'
  ]
}

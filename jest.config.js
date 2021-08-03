module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  },
  collectCoverageFrom: ['src/**/{!(index),}.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/']
}

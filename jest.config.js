module.exports = {
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    verbose: false,
    coverageThreshold: {
      "global": {
        "branches": 0,
        "functions": 10,
        "lines": 25,
        "statements": 25
      }
    }
  }

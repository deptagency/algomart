const base = require('../../jest.config')

process.env.API_KEY = 'test-api-key'
process.env.EMAIL_TRANSPORT = 'smtp'

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleNameMapper: {
    ...(base.moduleNameMapper && {}),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
}

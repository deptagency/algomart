process.env.API_KEY = 'test-api-key'
process.env.EMAIL_TRANSPORT = 'smtp'

module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@api/(.*)': '<rootDir>/src/$1',
    '@api-tests/(.*)': '<rootDir>/test/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
}

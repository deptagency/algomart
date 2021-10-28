const base = require('../../jest.config')

module.exports = {
  ...base,
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.husky/',
    '<rootDir>/cypress/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/.husky/'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    '@/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
}

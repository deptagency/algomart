module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nrwl/react/plugins/jest',
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      {
        presets: ['@nrwl/next/babel'],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    ],
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.husky/',
    '<rootDir>/cypress/',
  ],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    'test/(.*)': '<rootDir>/test/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(ky)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/web',
  setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
}

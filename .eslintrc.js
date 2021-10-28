const defaultRules = {
  // These rules are a bit too aggressive
  'unicorn/no-null': 'off',
  'unicorn/filename-case': 'off',
  'unicorn/prefer-module': 'off',

  // Allow some common abbreviations
  'unicorn/prevent-abbreviations': [
    'error',
    {
      allowList: {
        props: true,
        Props: true,
        params: true,
        Params: true,
        args: true,
        func: true,
      },
    },
  ],

  // Allow @ts-* with descriptions
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': 'allow-with-description',
      'ts-check': 'allow-with-description',
    },
  ],

  // Enforce consistent import ordering
  'simple-import-sort/imports': [
    'error',
    {
      groups: [
        // Side effect imports.
        ['^\\u0000'],
        // Internal packages, then alphabetical third party packages
        ['^@?\\w'],
        // Parent imports. Put `..` last.
        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
        // Other relative imports. Put same-folder imports and `.` last.
        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        // Style imports.
        ['^.+\\.s?css$'],
      ],
    },
  ],
}

const defaultExtends = [
  'eslint:recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:unicorn/recommended',
  'plugin:react/recommended',
  'plugin:react-hooks/recommended',
  'plugin:react/jsx-runtime',
  'plugin:jsx-a11y/recommended',
  'plugin:@next/next/recommended',
  'prettier',
]

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  extends: defaultExtends,
  rules: defaultRules,
  settings: {
    react: {
      version: 'detect',
    },
    next: {
      rootDir: './apps/web/',
    },
  },
  overrides: [
    {
      files: [
        '**/.eslintrc.js',
        '**/babel.config.js',
        '**/next.config.js',
        '**/jest.config.js',
        '**/tailwind.config.js',
        './apps/cms/extensions/migrations/*.js',
      ],
      rules: {
        ...defaultRules,
        '@typescript-eslint/no-var-requires': 'off',
        'unicorn/prefer-module': 'off',
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      excludedFiles: ['**/cypress/**/*.[jt]s?(x)'],
      extends: [
        ...defaultExtends,
        'plugin:jest/recommended',
        'plugin:jest-dom/recommended',
        'plugin:testing-library/react',
      ],
      rules: {
        ...defaultRules,
      },
    },
  ],
}

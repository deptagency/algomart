const defaultRules = {
  // These rules are a bit too aggressive
  'unicorn/no-null': 'off',
  'unicorn/filename-case': 'off',
  'unicorn/prefer-module': 'off',
  'unicorn/no-array-reduce': 'off',
  'unicorn/prefer-top-level-await': 'off',

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
        env: true,
        prod: true,
        dev: true,
      },
    },
  ],

  // Disable video track requirement
  'jsx-a11y/media-has-caption': 'off',

  // Require AppLink and LinkButton to be valid links
  'jsx-a11y/anchor-is-valid': [
    'error',
    {
      components: ['AppLink', 'LinkButton'],
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

  // Allow using any for rest arguments (i.e. `...any[]`)
  '@typescript-eslint/no-explicit-any': [
    'error',
    { ignoreRestArgs: true, fixToUnknown: true },
  ],

  '@nrwl/nx/enforce-module-boundaries': [
    2,
    {
      allowCircularSelfDependency: true,
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
  'plugin:jsx-a11y/recommended',
  'plugin:unicorn/recommended',
  'prettier',
]

const defaultPlugins = ['simple-import-sort']

module.exports = {
  root: true,
  ignorePatterns: ['**/*'],
  plugins: ['@nrwl/nx'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        ...defaultRules,

        '@nrwl/nx/enforce-module-boundaries': [
          'error',
          {
            enforceBuildableLibDependency: true,
            allow: [],
            depConstraints: [
              {
                sourceTag: '*',
                onlyDependOnLibsWithTags: ['*'],
              },
            ],
          },
        ],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: [...defaultExtends, 'plugin:@nrwl/nx/typescript'],
      plugins: [...defaultPlugins],
      rules: {
        ...defaultRules,
      },
    },
    {
      files: ['*.js', '*.jsx'],
      extends: [...defaultExtends, 'plugin:@nrwl/nx/javascript'],
      plugins: [...defaultPlugins],
      rules: {
        ...defaultRules,
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
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
    {
      files: ['**/?(*.)+(spec).[jt]s?(x)'],
      excludedFiles: ['**/cypress/**/*.[jt]s?(x)'],
      extends: [...defaultExtends, 'plugin:cypress/recommended'],
      rules: {
        ...defaultRules,
      },
    },
  ],
}

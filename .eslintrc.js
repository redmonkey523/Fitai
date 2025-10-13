module.exports = {
  root: true,
  extends: [
    '@expo/metro-runtime/babel-preset',
    'expo',
    'prettier'
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // Custom rule to prevent mock imports in production code
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['msw', 'msw/*'],
            message: 'MSW should only be used in test files'
          },
          {
            group: ['miragejs', 'miragejs/*'],
            message: 'MirageJS should only be used in test files'
          },
          {
            group: ['json-server', 'json-server/*'],
            message: 'json-server should only be used in test files'
          },
          {
            group: ['axios-mock-adapter', 'axios-mock-adapter/*'],
            message: 'axios-mock-adapter should only be used in test files'
          },
          {
            group: ['nock', 'nock/*'],
            message: 'nock should only be used in test files'
          },
          {
            group: ['fetch-mock', 'fetch-mock/*'],
            message: 'fetch-mock should only be used in test files'
          }
        ]
      }
    ]
  },
  overrides: [
    {
      // Allow mock imports in test files
      files: [
        '**/__tests__/**/*',
        '**/__mocks__/**/*',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/test-*.js',
        '**/setupTests.js',
        '**/jest.setup.js'
      ],
      rules: {
        'no-restricted-imports': 'off'
      }
    }
  ]
};

import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    // Global ignores
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: pluginReact,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
      sonarjs,
      unicorn,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.strict.rules,
      ...pluginReact.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...unicorn.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'error',
      'no-useless-escape': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'no-unused-vars': 'off',
      // Unicorn rules to disable
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/prefer-structured-clone': 'off',

      // Sonarjs rules - Configured for code quality improvement
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 25],
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/constructor-for-side-effects': 'warn',
      'sonarjs/pseudo-random': 'warn',
      // Note: slow-regex disabled - most regex patterns in this project are safe
      // (PGN parsing, notation, etc. use controlled input sources)
      'sonarjs/slow-regex': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Configuration for test files and setup files
  {
    files: [
      '**/*.test.{js,mjs,cjs,ts,jsx,tsx}',
      '**/*.spec.{js,mjs,cjs,ts,jsx,tsx}',
      'tests/setup.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest, // Enable Jest globals
      },
    },
  },
];

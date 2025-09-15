import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    // Global ignores
    ignores: ['dist/', 'node_modules/'],
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
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off', // Temporarily disable
      'no-useless-escape': 'off', // Temporarily disable
      '@typescript-eslint/no-unused-vars': 'off', // Temporarily disable
      'no-unused-vars': 'off', // Temporarily disable from @eslint/js
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

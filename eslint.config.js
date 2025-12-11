import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    // Global ignores
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'build/',
      '*.config.js',
      '*.config.cjs',
      'tests/__mocks__/**',
      'demo/**',
      'examples/**',
      'scripts/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json', // Pour les règles TypeScript avancées
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
      sonarjs,
      unicorn,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.strictTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...unicorn.configs.recommended.rules,

      // === React Rules ===
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // TypeScript gère le typage
      'react/jsx-uses-react': 'off',
      'react/no-unescaped-entities': 'error',
      'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],

      // === React Hooks Rules ===
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',

      // === Prettier ===
      'prettier/prettier': 'error',

      // === TypeScript Rules ===
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // error au lieu de warn
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Peut être trop strict
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // === JavaScript Rules ===
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-useless-escape': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // === Unicorn Rules (ajustées) ===
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
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-useless-undefined': 'off',

      // === SonarJS Rules ===
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 20], // Plus strict
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/constructor-for-side-effects': 'warn',
      'sonarjs/pseudo-random': 'warn',
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/function-return-type': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-undefined-argument': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Configuration pour les tests
  {
    files: [
      '**/*.test.{js,mjs,cjs,ts,jsx,tsx}',
      '**/*.spec.{js,mjs,cjs,ts,jsx,tsx}',
      'tests/**/*.{js,ts,tsx}',
      '**/__tests__/**/*.{js,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      // R?gles plus souples pour les tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
      'react-hooks/immutability': 'off',
      'sonarjs/no-undefined-argument': 'off',
    },
  },
  // Configuration pour la demo
  {
    files: ['demo/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    rules: {
      'sonarjs/function-return-type': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'unicorn/prefer-global-this': 'off',
    },
  },
// Configuration pour les fichiers JavaScript
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  // Configuration pour les fichiers de config
  {
    files: ['*.config.{js,ts,mjs}', 'vite.config.ts', 'vitest.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];

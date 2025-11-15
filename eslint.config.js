import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginImport from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.FlatConfig} */
export default [
  // Allow Vite virtual modules
  {
    files: ['index.tsx'],
    rules: {
      'import/no-unresolved': [
        'error',
        {
          ignore: ['virtual:pwa-register'],
        },
      ],
    },
  },
  // TypeScript project files only (with project reference)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['src/types/*.d.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // Other TS/JS/JSX files (no project reference)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // Shared config
  {
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      import: eslintPluginImport,
    },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': 'warn',
      'import/no-unresolved': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      },
    },
    ignores: [
      'node_modules',
      'dist',
      'build',
      'public',
      'dist/**',
      'build/**',
      'src/types/shims.d.ts',
    ],
  },
];

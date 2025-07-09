import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import testingLibrary from 'eslint-plugin-testing-library';
import formatjs from 'eslint-plugin-formatjs';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/graphql-generated.ts']),
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/out/**',
      '**/public/**',
      '**/.turbo/**',
      '**/graphql-generated.ts',
    ],

    extends: compat.extends(
      'next/core-web-vitals',
      'next/typescript',
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:storybook/recommended'
    ),

    plugins: {
      '@typescript-eslint': typescriptEslint,
      'testing-library': testingLibrary,
      formatjs,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'debug'],
        },
      ],

      'formatjs/enforce-default-message': ['error', 'literal'],
    },
  },
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    extends: compat.extends('plugin:testing-library/react'),
  },
]);

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'build', 'coverage']),

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node, // Provides process, __dirname, console, Buffer, etc.
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Commonly allowed in backend services for logging
    },
  },

  // Must be last to turn off conflicting formatting rules
  prettierConfig,
]);

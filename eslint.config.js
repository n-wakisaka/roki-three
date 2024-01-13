import globals from 'globals'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import typescriptEslintParser from '@typescript-eslint/parser'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import vitest from 'eslint-plugin-vitest'

export default [
  {
    ignores: ['vite.config.ts', '*.js'],
  },

  js.configs.recommended,
  eslintConfigPrettier,

  // javascript
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // typescript-eslint
  {
    files: ['src/**/*.ts'],

    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-type-checked'].rules,
      'no-unused-vars': 'off',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
    },
  },

  // vitest
  {
    files: ['tests/**/*.ts'],

    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './test/tsconfig.json',
      },
      globals: {
        ...vitest.environments.env.globals,
      },
    },

    plugins: {
      vitest,
      '@typescript-eslint': typescriptEslint,
    },

    rules: {
      ...vitest.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-type-checked'].rules,
    },
  },
]

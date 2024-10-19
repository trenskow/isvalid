import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [...compat.extends('eslint:recommended'), {
	languageOptions: {
		globals: {
			...globals.node,
			...globals.mocha,
		},

		ecmaVersion: 'latest',
		sourceType: 'module',
	},

	rules: {
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],

		'no-console': ['error', {
			allow: ['warn', 'error', 'info'],
		}],

		'no-unused-vars': ['error', {
			argsIgnorePattern: '^_',
		}],

		'no-empty': ['error', {
			allowEmptyCatch: true,
		}],

		'no-trailing-spaces': ['error', {
			ignoreComments: true,
		}],

		'require-atomic-updates': 'off',
	},
}];
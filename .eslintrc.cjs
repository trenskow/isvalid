module.exports = {
	'env': {
		'es6': true,
		'node': true,
		'mocha': true
	},
	'parserOptions': {
		'ecmaVersion': 2018,
		'sourceType': 'module'
	},
	'extends': 'eslint:recommended',
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		],
		'no-console': [
			'error', {
				'allow': [
					'warn',
					'error',
					'info'
				]
			}
		],
		'no-unused-vars': [
			'error', {
				'argsIgnorePattern': '^_'
			}
		],
		'no-empty': [
			'error', {
				'allowEmptyCatch': true
			}
		],
		'no-trailing-spaces': [
			'error', {
				'ignoreComments': true
			}
		],
		'require-atomic-updates': 'off'
	}
};

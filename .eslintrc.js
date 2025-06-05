module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-native/all',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react', 'react-native'],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		project: './tsconfig.json',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		'react/react-in-jsx-scope': 'off',
		'react-native/no-inline-styles': 'warn',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'error',
	},
	env: {
		'react-native/react-native': true,
	},
}; 
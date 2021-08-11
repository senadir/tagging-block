module.exports = {
	extends: [
		'plugin:@woocommerce/eslint-plugin/recommended',
		'plugin:you-dont-need-lodash-underscore/compatible',
	],
	globals: {
		jQuery: 'readonly',
		IntersectionObserver: 'readonly',
	},
	settings: {
		'import/core-modules': [
			'@wordpress/a11y',
			'@wordpress/api-fetch',
			'@wordpress/block-editor',
			'@wordpress/compose',
			'@wordpress/data',
			'@wordpress/escape-html',
			'@wordpress/hooks',
			'@wordpress/keycodes',
			'@wordpress/url',
			'@wordpress/element',
			'@wordpress/components',
		],
		'import/resolver': {
			node: {},
			webpack: {},
			typescript: {},
		},
	},
	rules: {
		'react-hooks/exhaustive-deps': 'error',
		'react/jsx-fragments': [ 'error', 'syntax' ],
		'jsdoc/require-param': 'off',
		'@woocommerce/dependency-group': 'off',
		camelcase: [
			'error',
			{
				properties: 'never',
				ignoreGlobals: true,
			},
		],
	},
};

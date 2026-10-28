/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte'],
	overrides: [
		{ files: '*.svelte', options: { parser: 'svelte' } },
		// En CSS se usan comillas dobles en los selectores de atributo (convención de la librería)
		{ files: '*.css', options: { singleQuote: false } }
	]
};

export default config;

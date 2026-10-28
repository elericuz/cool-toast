import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// Condición 'browser' para que Svelte resuelva su build de cliente en jsdom
	resolve: {
		conditions: ['browser']
	},
	test: {
		environment: 'jsdom',
		globals: false,
		setupFiles: ['tests/setup.ts'],
		include: ['tests/**/*.test.ts'],
		// rAF queda real (síncrono vía tests/setup.ts); solo se falsean timers y Date
		fakeTimers: {
			toFake: [
				'setTimeout',
				'clearTimeout',
				'setInterval',
				'clearInterval',
				'setImmediate',
				'clearImmediate',
				'Date'
			]
		}
	}
});

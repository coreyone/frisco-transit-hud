import { relative, sep } from 'node:path';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		},
	},
	kit: {
		adapter: adapter({
			fallback: '200.html',
			precompress: true,
			strict: false,
		}),
		output: {
			bundleStrategy: 'split',
			preloadStrategy: 'preload-js',
		},
		prerender: {
			handleUnseenRoutes: 'ignore',
		},
		version: {
			name: 'frisco-transit-v1',
		},
	},
};

export default config;

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `frisco-transit-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(ASSETS);
		})(),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) {
					await caches.delete(key);
				}
			}
		})(),
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const asset = new URL(event.request.url).pathname;

			if (ASSETS.includes(asset)) {
				return (await cache.match(asset)) ?? fetch(event.request);
			}

			try {
				const response = await fetch(event.request);

				if (response.status === 200) {
					cache.put(event.request, response.clone());
				}

				return response;
			} catch (error) {
				const cached = await cache.match(event.request);

				if (cached) {
					return cached;
				}

				throw error;
			}
		})(),
	);
});

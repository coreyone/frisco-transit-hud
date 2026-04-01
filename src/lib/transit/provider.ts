import { env } from '$env/dynamic/public';
import { buildMockSnapshot, DEFAULT_USER_LOCATION } from './data';
import type { Coordinates, TransitSnapshot } from './types';
import { isSafeTransitEndpoint, isTransitSnapshot } from './validation';

type LoadTransitSnapshotArgs = {
	previous?: TransitSnapshot;
	userLocation?: Coordinates;
};

async function loadRemoteSnapshot(endpoint: string) {
	const response = await fetch(endpoint, {
		headers: { accept: 'application/json' },
		cache: 'no-store',
		credentials: 'omit',
		redirect: 'error',
		referrerPolicy: 'no-referrer',
	});

	if (!response.ok) {
		throw new Error(`Transit feed failed with ${response.status}`);
	}

	return response.json();
}

export async function loadTransitSnapshot({
	previous,
	userLocation = DEFAULT_USER_LOCATION,
}: LoadTransitSnapshotArgs = {}) {
	const mode = env.PUBLIC_TRANSIT_DATA_MODE ?? 'live';
	const endpoint = env.PUBLIC_TRANSIT_DATA_ENDPOINT;

	if (mode !== 'mock' && endpoint && isSafeTransitEndpoint(endpoint)) {
		try {
			const data = await loadRemoteSnapshot(endpoint);

			if (isTransitSnapshot(data)) {
				return {
					...data,
					source: 'live' as const,
					stale: false,
					defaultUserLocation: userLocation,
				};
			}
		} catch (error) {
			console.warn('Falling back to mock transit data', error);
		}
	}

	return buildMockSnapshot(new Date(), previous, userLocation);
}

import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	getCurrentLocation,
	initPushNotifications,
	onAppResume,
	pulseUrgency,
	scheduleDepartureNotification,
	watchConnectivity,
	watchLocation,
} from '$lib/native/capacitor';
import { buildMockSnapshot, DEFAULT_USER_LOCATION } from './data';
import { loadTransitSnapshot } from './provider';
import type { Coordinates, TransitSnapshot } from './types';
import {
	computeGoState,
	getFavoriteCollections,
	getNearbyArrivals,
} from './utils';
import {
	isTransitSnapshot,
	sanitizeStringArray,
	sanitizeStringOrNull,
} from './validation';

type RefreshMeta = {
	refreshing: boolean;
	lastSuccessAt: string | null;
	nextRefreshAt: string | null;
	error: string | null;
};

type NetworkState = {
	connected: boolean;
	connectionType: string;
};

function persistentStore<T>(key: string, initialValue: T) {
	const store = writable(initialValue);

	if (browser) {
		const existing = localStorage.getItem(key);

		if (existing) {
			try {
				const parsed = JSON.parse(existing);

				if (Array.isArray(initialValue)) {
					store.set(
						sanitizeStringArray(
							parsed,
							initialValue as unknown as string[],
						) as T,
					);
				} else {
					store.set(
						sanitizeStringOrNull(parsed, initialValue as string | null) as T,
					);
				}
			} catch (error) {
				console.warn(`Failed to hydrate ${key}`, error);
			}
		}

		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (error) {
				console.warn(`Failed to persist ${key}`, error);
			}
		});
	}

	return store;
}

let initialized = false;
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;
let releaseNetwork: (() => void) | undefined;
let releaseResume: (() => void) | undefined;
let releaseLocationWatch: (() => void) | undefined;

export const snapshot = writable<TransitSnapshot>(buildMockSnapshot());
export const clock = writable(new Date().toISOString());
export const userLocation = writable<Coordinates>(DEFAULT_USER_LOCATION);
export const refreshMeta = writable<RefreshMeta>({
	refreshing: false,
	lastSuccessAt: null,
	nextRefreshAt: null,
	error: null,
});
export const networkState = writable<NetworkState>({
	connected: true,
	connectionType: 'unknown',
});
export const favorites = persistentStore<string[]>('frisco-transit:favorites', [
	'powell',
	'bart-red',
	'muni-n',
]);
export const recentSearches = persistentStore<string[]>(
	'frisco-transit:recent-searches',
	['Powell St Station', 'Dolores Park'],
);
export const activeGoPlanId = persistentStore<string | null>(
	'frisco-transit:active-go-plan',
	'powell-to-dolores',
);

/**
 * Increased radius and limit for a more robust 'Flight Board'.
 * 1200m (~15 min walk) provides better context for the transit network 
 * and prevents cards from dropping out due to GPS drift.
 */
export const nearbyArrivals = derived(
	[snapshot, userLocation],
	([$snapshot, $userLocation]) =>
		getNearbyArrivals($snapshot, $userLocation, 10000, 24),
);

export const favoriteCollections = derived(
	[snapshot, favorites],
	([$snapshot, $favorites]) => getFavoriteCollections($snapshot, $favorites),
);

export const activeGoPlan = derived(
	[snapshot, activeGoPlanId, clock],
	([$snapshot, $planId, $clock]) => {
		const plan = $snapshot.itineraries.find(
			(candidate) => candidate.id === $planId,
		);

		if (!plan) {
			return null;
		}

		return {
			plan,
			state: computeGoState(plan, new Date($clock).getTime()),
		};
	},
);

async function cacheSnapshot(value: TransitSnapshot) {
	if (!browser) {
		return;
	}

	localStorage.setItem('frisco-transit:last-snapshot', JSON.stringify(value));
}

function getCachedSnapshot() {
	if (!browser) {
		return null;
	}

	const value = localStorage.getItem('frisco-transit:last-snapshot');

	if (!value) {
		return null;
	}

	try {
		return JSON.parse(value) as TransitSnapshot;
	} catch (error) {
		console.warn('Failed to parse cached snapshot', error);
		return null;
	}
}

function scheduleNextRefreshWindow() {
	refreshMeta.update((meta) => ({
		...meta,
		nextRefreshAt: new Date(Date.now() + 20_000).toISOString(),
	}));
}

export async function refreshTransit() {
	const currentSnapshot = get(snapshot);
	const currentLocation = get(userLocation);

	refreshMeta.update((meta) => ({ ...meta, refreshing: true, error: null }));

	try {
		const nextSnapshot = await loadTransitSnapshot({
			previous: currentSnapshot,
			userLocation: currentLocation,
		});

		snapshot.set(nextSnapshot);
		await cacheSnapshot(nextSnapshot);
		refreshMeta.set({
			refreshing: false,
			lastSuccessAt: new Date().toISOString(),
			nextRefreshAt: new Date(Date.now() + 20_000).toISOString(),
			error: null,
		});
	} catch (error) {
		const cachedSnapshot = getCachedSnapshot();

		if (cachedSnapshot && isTransitSnapshot(cachedSnapshot)) {
			snapshot.set({ ...cachedSnapshot, stale: true, source: 'cached' });
		}

		refreshMeta.update((meta) => ({
			...meta,
			refreshing: false,
			error: error instanceof Error ? error.message : 'Feed refresh failed',
		}));
	}
}

export async function initializeTransit() {
	if (!browser || initialized) {
		return;
	}

	initialized = true;

	const location = await getCurrentLocation(get(userLocation));
	userLocation.set(location);

	releaseLocationWatch = await watchLocation((nextLocation) => {
		userLocation.set(nextLocation);
	});

	await refreshTransit();
	await initPushNotifications();

	releaseNetwork = await watchConnectivity((status) => {
		networkState.set(status);
	});
	releaseResume = await onAppResume(async () => {
		await refreshTransit();
	});

	clockTimer = setInterval(() => {
		clock.set(new Date().toISOString());
	}, 1_000);

	refreshTimer = setInterval(async () => {
		scheduleNextRefreshWindow();
		await refreshTransit();
	}, 20_000);
}

export function teardownTransit() {
	refreshTimer && clearInterval(refreshTimer);
	clockTimer && clearInterval(clockTimer);
	releaseNetwork?.();
	releaseResume?.();
	releaseLocationWatch?.();
	initialized = false;
}

export function updateUserLocation(location: Coordinates) {
	userLocation.set(location);
	void refreshTransit();
}

export function toggleFavorite(id: string) {
	favorites.update((value) =>
		value.includes(id) ? value.filter((entry) => entry !== id) : [...value, id],
	);
}

export function recordRecentSearch(label: string) {
	recentSearches.update((searches) =>
		[label, ...searches.filter((entry) => entry !== label)].slice(0, 5),
	);
}

export function setActiveGoPlan(planId: string) {
	activeGoPlanId.set(planId);
	void pulseUrgency('medium');
}

export function clearActiveGoPlan() {
	activeGoPlanId.set(null);
}

export async function schedulePlanReminder(planId: string) {
	const currentSnapshot = get(snapshot);
	const plan = currentSnapshot.itineraries.find(
		(candidate) => candidate.id === planId,
	);

	if (!plan) {
		return;
	}

	const reminderTime = new Date(new Date(plan.leaveAt).getTime() - 5 * 60_000);

	await scheduleDepartureNotification({
		id: Math.abs(
			Array.from(planId).reduce(
				(hash, char) => (hash * 31 + char.charCodeAt(0)) | 0,
				0,
				0,
			),
		),
		title: 'Leave in 5 min',
		body: `${plan.originLabel} → ${plan.destinationLabel}`,
		at: reminderTime,
	});
}

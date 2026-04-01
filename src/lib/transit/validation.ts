import type { TransitSnapshot } from './types';

const SAFE_TRANSIT_ENDPOINT_BASE = 'https://frisco-transit.local';

export function sanitizeStringArray(value: unknown, fallback: string[]) {
	if (
		!Array.isArray(value) ||
		value.some((entry) => typeof entry !== 'string')
	) {
		return fallback;
	}

	return value
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.slice(0, 20);
}

export function sanitizeStringOrNull(value: unknown, fallback: string | null) {
	if (value === null) {
		return null;
	}

	if (typeof value !== 'string') {
		return fallback;
	}

	const nextValue = value.trim();
	return nextValue.length > 0 ? nextValue : fallback;
}

export function isTransitSnapshot(value: unknown): value is TransitSnapshot {
	if (!value || typeof value !== 'object') {
		return false;
	}

	return (
		Array.isArray((value as TransitSnapshot).stops) &&
		Array.isArray((value as TransitSnapshot).routes) &&
		Array.isArray((value as TransitSnapshot).arrivals) &&
		Array.isArray((value as TransitSnapshot).vehicles) &&
		Array.isArray((value as TransitSnapshot).alerts) &&
		Array.isArray((value as TransitSnapshot).itineraries)
	);
}

export function isSafeTransitEndpoint(value: string) {
	try {
		const url = new URL(value, SAFE_TRANSIT_ENDPOINT_BASE);

		return (
			url.protocol === 'https:' &&
			url.username.length === 0 &&
			url.password.length === 0
		);
	} catch {
		return false;
	}
}

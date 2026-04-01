import { describe, expect, it } from 'vitest';
import { buildMockSnapshot } from './data';
import {
	isSafeTransitEndpoint,
	isTransitSnapshot,
	sanitizeStringArray,
	sanitizeStringOrNull,
} from './validation';

describe('sanitizeStringArray', () => {
	it('rejects malformed storage payloads', () => {
		expect.assertions(2);
		expect(sanitizeStringArray(null, ['fallback'])).toEqual(['fallback']);
		expect(sanitizeStringArray(['a', 1, 'b'], ['fallback'])).toEqual([
			'fallback',
		]);
	});
});

describe('sanitizeStringOrNull', () => {
	it('rejects malformed scalar payloads', () => {
		expect.assertions(2);
		expect(sanitizeStringOrNull(null, 'fallback')).toBeNull();
		expect(sanitizeStringOrNull(123, 'fallback')).toBe('fallback');
	});
});

describe('isTransitSnapshot', () => {
	it('accepts known-good transit snapshots and rejects junk', () => {
		expect.assertions(2);
		expect(isTransitSnapshot(buildMockSnapshot())).toBe(true);
		expect(
			isTransitSnapshot({
				stops: [],
				routes: [],
			}),
		).toBe(false);
	});
});

describe('isSafeTransitEndpoint', () => {
	it('allows only safe transit feed endpoints', () => {
		expect.assertions(4);
		expect(
			isSafeTransitEndpoint('https://feeds.example.com/transit.json'),
		).toBe(true);
		expect(isSafeTransitEndpoint('/api/transit')).toBe(true);
		expect(isSafeTransitEndpoint('javascript:alert(1)')).toBe(false);
		expect(isSafeTransitEndpoint('http://feeds.example.com/transit.json')).toBe(
			false,
		);
	});
});

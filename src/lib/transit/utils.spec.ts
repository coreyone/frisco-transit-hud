import { describe, expect, it } from 'vitest';
import {
	buildTransferRiskLabel,
	haversineDistanceMeters,
	smoothEta,
} from './utils';

describe('smoothEta', () => {
	it('blends new eta values without jumping', () => {
		expect.assertions(1);
		expect(smoothEta(600, 300)).toBe(504);
	});
});

describe('buildTransferRiskLabel', () => {
	it('escalates risk thresholds predictably', () => {
		expect.assertions(3);
		expect(buildTransferRiskLabel(0.2)).toBe('low');
		expect(buildTransferRiskLabel(0.5)).toBe('medium');
		expect(buildTransferRiskLabel(0.9)).toBe('high');
	});
});

describe('haversineDistanceMeters', () => {
	it('returns realistic nearby stop distances', () => {
		expect.assertions(1);
		expect(
			Math.round(
				haversineDistanceMeters(
					{ lat: 37.7843, lng: -122.4079 },
					{ lat: 37.7894, lng: -122.4011 },
				),
			),
		).toBe(824);
	});
});

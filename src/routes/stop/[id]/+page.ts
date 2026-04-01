import { buildMockSnapshot } from '$lib/transit/data';

export const entries = () => buildMockSnapshot().stops.map((stop) => ({
	id: stop.id,
}));

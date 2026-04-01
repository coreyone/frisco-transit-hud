import { buildMockSnapshot } from '$lib/transit/data';

export const entries = () => buildMockSnapshot().routes.map((route) => ({
	id: route.id,
}));

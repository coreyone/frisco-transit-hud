import { buildMockSnapshot } from '$lib/transit/data';

export const entries = () => buildMockSnapshot().itineraries.map((itinerary) => ({
	id: itinerary.id,
}));

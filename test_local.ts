import { buildMockSnapshot, DEFAULT_USER_LOCATION } from './src/lib/transit/data.ts';
import { getGroupedNearbyArrivals, getNearbyArrivals } from './src/lib/transit/utils.ts';
const userLocation = { lat: 40.7128, lng: -74.0060 }; // NYC
const snapshot = buildMockSnapshot(new Date(), undefined, userLocation);
const nearby = getNearbyArrivals(snapshot, userLocation, 1200, 24);
console.log("nearby.length:", nearby.length);
const grouped = getGroupedNearbyArrivals(nearby);
console.log("grouped.length:", grouped.length);

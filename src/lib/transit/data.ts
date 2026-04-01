import type {
	Alert,
	Coordinates,
	Itinerary,
	Route,
	Stop,
	TransitSnapshot,
	Vehicle,
} from './types';
import {
	buildTransferRiskLabel,
	clamp,
	haversineDistanceMeters,
	interpolateAlongPath,
	smoothEta,
} from './utils';

export const DEFAULT_USER_LOCATION: Coordinates = {
	lat: 37.7879,
	lng: -122.4075,
};

// Authoritative SF corridors
const SF_STOPS: Stop[] = [
	{
		id: 'powell',
		agencyId: 'sfmta',
		name: 'Powell St Station',
		neighborhood: 'Union Square',
		routes: ['muni-n', 'bart-red'],
		platforms: ['Platform 2', 'Outbound surface stop'],
		description: 'Downtown spine with BART + Muni Metro transfer.',
		lat: 37.7843,
		lng: -122.4079,
	},
	{
		id: 'montgomery',
		agencyId: 'bart',
		name: 'Montgomery St',
		neighborhood: 'Financial District',
		routes: ['bart-red', 'muni-38r'],
		platforms: ['Platform 2', 'Platform 3'],
		description: 'Fast BART core stop with strong 38R bus connections.',
		lat: 37.7894,
		lng: -122.4011,
	},
	{
		id: 'embarcadero',
		agencyId: 'bart',
		name: 'Embarcadero',
		neighborhood: 'Embarcadero',
		routes: ['bart-red', 'caltrain-local'],
		platforms: ['Platform 1', 'Platform 2'],
		description: 'Commute gateway toward Caltrain and the Ferry Building.',
		lat: 37.7929,
		lng: -122.3969,
	}
];

const SF_ROUTES: Route[] = [
	{
		id: 'muni-n',
		agencyId: 'sfmta',
		shortName: 'N',
		longName: 'N Judah',
		mode: 'tram',
		color: '#f1c74a',
		textColor: '#17222d',
		pattern: 'Ocean Beach ↔ Caltrain via Market',
		serviceWindow: '04:52 to 01:02',
		headwayLabel: '7 to 11 min',
		directionLabels: ['Inbound to Caltrain', 'Outbound to Ocean Beach'],
		stopIds: ['judah-19th', 'duboce', 'powell', 'salesforce'],
	},
	{
		id: 'bart-red',
		agencyId: 'bart',
		shortName: 'BART',
		longName: 'Richmond ↔ Millbrae / SFO',
		mode: 'metro',
		color: '#b73324',
		textColor: '#fdf7ef',
		pattern: 'Richmond ↔ Downtown SF ↔ Mission',
		serviceWindow: '05:00 to 00:15',
		headwayLabel: '4 to 8 min',
		directionLabels: ['Northbound to Richmond', 'Southbound to Millbrae'],
		stopIds: ['embarcadero', 'montgomery', 'powell'],
	}
];

/**
 * Dynamic Mock Generation: 
 * If the user is far from SF, we anchor a 'Proxy Local Loop' to their location 
 * to ensure the 'Flight Board' always shows life and the UI remains testable.
 */
function getStopsForLocation(userLoc: Coordinates): Stop[] {
	const sfDist = haversineDistanceMeters(userLoc, DEFAULT_USER_LOCATION);
	
	if (sfDist < 20000) {
		return [
			...SF_STOPS,
			{
				id: 'duboce',
				agencyId: 'sfmta',
				name: 'Duboce Ave & Church St',
				neighborhood: 'Duboce Triangle',
				routes: ['muni-n'],
				platforms: ['Inbound island', 'Outbound island'],
				description: 'Surface Muni transfer point.',
				lat: 37.7692,
				lng: -122.4292,
			},
			{
				id: 'salesforce',
				agencyId: 'caltrain',
				name: 'Salesforce Transit Center',
				neighborhood: 'SoMa',
				routes: ['caltrain-local', 'muni-38r'],
				platforms: ['Bus deck', 'Rail concourse'],
				description: 'Regional rail anchor.',
				lat: 37.7891,
				lng: -122.3967,
			}
		];
	}

	// Dynamic 'Local Proxy' stops for non-SF locations
	return [
		{
			id: 'local-vector-1',
			agencyId: 'frisco',
			name: 'Station Square',
			neighborhood: 'Current sector',
			routes: ['vector-alpha', 'vector-beta'],
			platforms: ['Standard Platform'],
			description: 'Dynamic proxy stop generated for current location.',
			lat: userLoc.lat + 0.003,
			lng: userLoc.lng + 0.002,
		},
		{
			id: 'local-vector-2',
			agencyId: 'frisco',
			name: 'Grand Avenue',
			neighborhood: 'Central Sector',
			routes: ['vector-alpha'],
			platforms: ['Main Platform'],
			description: 'Dynamic proxy stop generated for current location.',
			lat: userLoc.lat - 0.002,
			lng: userLoc.lng - 0.001,
		}
	];
}

function getRoutesForLocation(userLoc: Coordinates): Route[] {
	const sfDist = haversineDistanceMeters(userLoc, DEFAULT_USER_LOCATION);
	
	if (sfDist < 20000) {
		return [
			...SF_ROUTES,
			{
				id: 'muni-38r',
				agencyId: 'sfmta',
				shortName: '38R',
				longName: 'Geary Rapid',
				mode: 'bus',
				color: '#1e6d5a',
				textColor: '#f5f2eb',
				directionLabels: ['Inbound', 'Outbound'],
				stopIds: ['powell', 'salesforce'],
				pattern: 'Richmond ↔ Downtown',
				serviceWindow: '05:00 to 01:00',
				headwayLabel: '5 min'
			}
		];
	}

	return [
		{
			id: 'vector-alpha',
			agencyId: 'frisco',
			shortName: 'VA',
			longName: 'Vector Alpha Loop',
			mode: 'metro',
			color: '#34d399',
			textColor: '#000000',
			directionLabels: ['Clockwise', 'Counter'],
			stopIds: ['local-vector-1', 'local-vector-2'],
			pattern: 'Dynamic Hub Simulation',
			serviceWindow: '24/7',
			headwayLabel: '4 min'
		},
		{
			id: 'vector-beta',
			agencyId: 'frisco',
			shortName: 'VB',
			longName: 'Vector Beta Express',
			mode: 'bus',
			color: '#3b82f6',
			textColor: '#ffffff',
			directionLabels: ['Inbound', 'Outbound'],
			stopIds: ['local-vector-1'],
			pattern: 'Dynamic Hub Simulation',
			serviceWindow: '24/7',
			headwayLabel: '8 min'
		}
	];
}

function makeArrivals(now: Date, stops: Stop[], routes: Route[], previous?: TransitSnapshot) {
	const arrivals: any[] = [];
	const previousEta = new Map(previous?.arrivals.map(a => [a.id, a.etaSeconds]));

	stops.forEach((stop, sIdx) => {
		stop.routes.forEach((rId, rIdx) => {
			const route = routes.find(r => r.id === rId);
			if (!route) return;

			const directions = route.directionLabels || ['Inbound', 'Outbound'];
			
			directions.forEach((dir, dIdx) => {
				const id = `${stop.id}-${route.id}-${dIdx}`;
				
				// Generate a deterministic but shifting ETA
				const baseMin = 3 + (sIdx * 2) + (dIdx * 5);
				const wave = Math.sin(now.getTime() / 60_000 + sIdx + dIdx) * 120; // 2 min variance
				const rawSeconds = Math.max(30, Math.round(baseMin * 60 + wave));
				const etaSeconds = smoothEta(previousEta.get(id), rawSeconds);

				arrivals.push({
					id,
					stopId: stop.id,
					routeId: route.id,
					direction: dir,
					headsign: dir + ' Service',
					platform: stop.platforms[0] || 'Platform 1',
					etaSeconds,
					isRealtime: true,
					confidence: 0.92,
					scheduledTime: new Date(now.getTime() + (baseMin * 60) * 1000).toISOString(),
					realtimeTime: new Date(now.getTime() + etaSeconds * 1000).toISOString(),
					delayMinutes: Math.max(0, Math.round((etaSeconds - baseMin * 60) / 60))
				});
			});
		});
	});

	return arrivals;
}

export function buildMockSnapshot(
	now = new Date(),
	previous?: TransitSnapshot,
	userLocation = DEFAULT_USER_LOCATION,
): TransitSnapshot {
	const sfDist = userLocation
		? haversineDistanceMeters(userLocation, DEFAULT_USER_LOCATION)
		: 0;

	// Use real SF stops if we're in SF (within 20km), otherwise use proxy stops
	const stops = sfDist < 20000 ? SF_STOPS : getStopsForLocation(userLocation);
	const routes = getRoutesForLocation(userLocation);
	const arrivals = makeArrivals(now, stops, routes, previous);

	return {
		asOf: now.toISOString(),
		source: 'mock',
		stale: false,
		defaultUserLocation: userLocation,
		stops,
		routes,
		arrivals,
		vehicles: [], // Skip vehicles for now to simplify mock
		alerts: [],
		itineraries: []
	};
}

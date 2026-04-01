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

// Authoritative SF corridors (Expanded for city-wide coverage)
const SF_STOPS: Stop[] = [
	{
		id: 'powell',
		agencyId: 'sfmta',
		name: 'Powell St Station',
		neighborhood: 'Union Square',
		routes: ['muni-n', 'bart-red', 'muni-38r'],
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
	},
	{
		id: 'civic-center',
		agencyId: 'sfmta',
		name: 'Civic Center / UN Plaza',
		neighborhood: 'Tenderloin',
		routes: ['bart-red', 'muni-n'],
		platforms: ['Concourse', 'Main'],
		description: 'BART/Muni Metro hub at the heart of Civic Center.',
		lat: 37.7797,
		lng: -122.4141,
	},
	{
		id: 'mission-16th',
		agencyId: 'bart',
		name: '16th St Mission',
		neighborhood: 'Mission District',
		routes: ['bart-red', 'muni-22'],
		platforms: ['Lower Level'],
		description: 'Mission District corridor anchor.',
		lat: 37.7650,
		lng: -122.4196,
	},
	{
		id: 'fourth-king',
		agencyId: 'caltrain',
		name: '4th & King (Caltrain)',
		neighborhood: 'SoMa',
		routes: ['caltrain-local', 'muni-n'],
		platforms: ['Track 1', 'Track 2'],
		description: 'Primary terminus for Caltrain service.',
		lat: 37.7766,
		lng: -122.3952,
	},
	{
		id: 'castro',
		agencyId: 'sfmta',
		name: 'Castro Station',
		neighborhood: 'Castro',
		routes: ['muni-n'],
		platforms: ['Inbound', 'Outbound'],
		description: 'Muni Metro gateway to the Castro.',
		lat: 37.7621,
		lng: -122.4350,
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
		stopIds: ['fourth-king', 'powell', 'civic-center', 'castro'],
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
		stopIds: ['embarcadero', 'montgomery', 'powell', 'civic-center', 'mission-16th'],
	},
	{
		id: 'muni-38r',
		agencyId: 'sfmta',
		shortName: '38R',
		longName: '38R Geary Rapid',
		mode: 'bus',
		color: '#b73324',
		textColor: '#ffffff',
		pattern: 'Transbay Terminal ↔ Lands End',
		serviceWindow: '00:00 to 23:59',
		headwayLabel: '6 to 10 min',
		directionLabels: ['Inbound to Transbay', 'Outbound to Lands End'],
		stopIds: ['montgomery', 'powell'],
	},
	{
		id: 'caltrain-local',
		agencyId: 'caltrain',
		shortName: 'CT',
		longName: 'Caltrain Local',
		mode: 'rail',
		color: '#b73324',
		textColor: '#ffffff',
		pattern: 'San Francisco ↔ San Jose',
		serviceWindow: '05:00 to 00:00',
		headwayLabel: '30 to 60 min',
		directionLabels: ['Northbound to SF', 'Southbound to San Jose'],
		stopIds: ['fourth-king', 'embarcadero'],
	}
];

function getStopsForLocation(userLoc: Coordinates): Stop[] {
	const sfDist = haversineDistanceMeters(userLoc, DEFAULT_USER_LOCATION);
	
	if (sfDist < 20000) {
		return SF_STOPS;
	}

	return [
		{
			id: 'local-vector-1',
			agencyId: 'sfmta',
			name: 'North Local Nexus',
			neighborhood: 'Nexus Sector',
			routes: ['vector-a', 'vector-b'],
			platforms: ['Platform A1'],
			description: 'Dynamic proxy stop generated for current location.',
			lat: userLoc.lat + 0.002,
			lng: userLoc.lng + 0.001,
		},
		{
			id: 'local-vector-2',
			agencyId: 'sfmta',
			name: 'Main Axis Station',
			neighborhood: 'Core Axis',
			routes: ['vector-a', 'vector-b'],
			platforms: ['Main Concourse'],
			description: 'Dynamic proxy stop generated for current location.',
			lat: userLoc.lat - 0.001,
			lng: userLoc.lng - 0.002,
		},
	];
}

function getRoutesForLocation(userLoc: Coordinates): Route[] {
	const sfDist = haversineDistanceMeters(userLoc, DEFAULT_USER_LOCATION);
	
	if (sfDist < 20000) {
		return SF_ROUTES;
	}

	return [
		{
			id: 'vector-a',
			agencyId: 'sfmta',
			shortName: 'VA',
			longName: 'Vector Alpha',
			mode: 'metro',
			color: '#00aaff',
			textColor: '#000000',
			pattern: 'Clockwise Service',
			serviceWindow: '24 Hours',
			headwayLabel: '4 min',
			directionLabels: ['Inbound Service', 'Outbound Service'],
			stopIds: ['local-vector-1', 'local-vector-2'],
		},
		{
			id: 'vector-b',
			agencyId: 'sfmta',
			shortName: 'VB',
			longName: 'Vector Beta',
			mode: 'bus',
			color: '#00aaff',
			textColor: '#000000',
			pattern: 'Anti-clockwise Service',
			serviceWindow: '24 Hours',
			headwayLabel: '4 min',
			directionLabels: ['Inbound Service', 'Outbound Service'],
			stopIds: ['local-vector-1', 'local-vector-2'],
		},
	];
}

export function buildMockSnapshot(
	timestamp: Date = new Date(),
	previous?: TransitSnapshot,
	userLocation?: Coordinates
): TransitSnapshot {
	const userLoc = userLocation || DEFAULT_USER_LOCATION;
	const stops = getStopsForLocation(userLoc);
	const routes = getRoutesForLocation(userLoc);
	
	const vehicles: Vehicle[] = [];
	const alerts: Alert[] = [];

	// Simple simulation of vehicles
	routes.forEach(route => {
		route.stopIds.forEach(stopId => {
			vehicles.push({
				id: `v-${route.id}-${stopId}`,
				routeId: route.id,
				stopId,
				status: 'in_transit',
				lat: userLoc.lat + (Math.random() - 0.5) * 0.01,
				lng: userLoc.lng + (Math.random() - 0.5) * 0.01,
				timestamp: timestamp.getTime(),
				occupancy: 'many_seats_available',
			});
		});
	});

	return {
		timestamp: timestamp.getTime(),
		stops,
		routes,
		vehicles,
		alerts,
		itineraries: [],
		source: 'mock',
		stale: false,
		defaultUserLocation: userLoc
	};
}

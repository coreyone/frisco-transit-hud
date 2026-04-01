export type AgencyId = 'sfmta' | 'bart' | 'caltrain' | 'frisco';
export type RouteMode = 'tram' | 'bus' | 'metro' | 'rail';
export type SnapshotSource = 'mock' | 'live' | 'cached';

export type Coordinates = {
	lat: number;
	lng: number;
};

export type Stop = Coordinates & {
	id: string;
	agencyId: AgencyId;
	name: string;
	neighborhood: string;
	routes: string[];
	platforms: string[];
	description: string;
};

export type Route = {
	id: string;
	agencyId: AgencyId;
	shortName: string;
	longName: string;
	mode: RouteMode;
	color: string;
	textColor: string;
	pattern: string;
	serviceWindow: string;
	headwayLabel: string;
	directionLabels: [string, string];
	stopIds: string[];
};

export type Arrival = {
	id: string;
	stopId: string;
	routeId: string;
	headsign: string;
	direction: string;
	platform: string;
	scheduledTime: string;
	realtimeTime: string;
	etaSeconds: number;
	delayMinutes: number;
	isRealtime: boolean;
	confidence: number;
	vehicleId?: string;
};

export type Vehicle = Coordinates & {
	id: string;
	routeId: string;
	tripId: string;
	bearing: number;
	status: 'approaching' | 'boarding' | 'in_transit';
	nextStopId: string;
	speedMph: number;
};

export type Alert = {
	id: string;
	agencyId: AgencyId;
	severity: 'info' | 'warning' | 'major';
	headline: string;
	detail: string;
	affectedRouteIds: string[];
	affectedStopIds: string[];
	updatedAt: string;
};

export type ItineraryStep = {
	id: string;
	kind: 'walk' | 'ride' | 'transfer';
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	distanceMeters?: number;
	routeId?: string;
	fromStopId?: string;
	toStopId?: string;
	platform?: string;
	risk?: 'low' | 'medium' | 'high';
};

export type Itinerary = {
	id: string;
	originLabel: string;
	destinationLabel: string;
	leaveAt: string;
	arriveAt: string;
	totalMinutes: number;
	confidence: number;
	transferRisk: 'low' | 'medium' | 'high';
	steps: ItineraryStep[];
};

export type TransitSnapshot = {
	asOf: string;
	source: SnapshotSource;
	stale: boolean;
	defaultUserLocation: Coordinates;
	stops: Stop[];
	routes: Route[];
	arrivals: Arrival[];
	vehicles: Vehicle[];
	alerts: Alert[];
	itineraries: Itinerary[];
};

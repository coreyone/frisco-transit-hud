import type {
	Arrival,
	Coordinates,
	Itinerary,
	ItineraryStep,
	Route,
	Stop,
	TransitSnapshot,
} from './types';

export type ArrivalWithContext = Arrival & {
	stop: Stop;
	route: Route;
	distanceMeters?: number;
};

export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export function smoothEta(
	previousSeconds: number | undefined,
	nextSeconds: number,
) {
	if (previousSeconds === undefined) {
		return nextSeconds;
	}

	return Math.round(previousSeconds * 0.68 + nextSeconds * 0.32);
}

export function haversineDistanceMeters(a: Coordinates, b: Coordinates) {
	const earthRadiusMeters = 6_371_000;
	const toRadians = (value: number) => (value * Math.PI) / 180;
	const deltaLat = toRadians(b.lat - a.lat);
	const deltaLng = toRadians(b.lng - a.lng);
	const latA = toRadians(a.lat);
	const latB = toRadians(b.lat);

	const haversine =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) ** 2;

	return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export function formatEta(etaSeconds: number) {
	if (etaSeconds <= 45) {
		return 'Due';
	}

	return `${Math.ceil(etaSeconds / 60)} min`;
}

export function formatDistance(distanceMeters: number) {
	if (distanceMeters < 1000) {
		return `${Math.round(distanceMeters)} m`;
	}

	return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatTime(value: string) {
	return new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value));
}

export function formatConfidence(confidence: number) {
	return `${Math.round(confidence * 100)}% confidence`;
}

export function alphaFromRisk(risk: Itinerary['transferRisk']) {
	switch (risk) {
		case 'low':
			return 'Low risk';
		case 'medium':
			return 'Watch transfer';
		case 'high':
			return 'Tight transfer';
	}
}

export function getStopById(snapshot: TransitSnapshot, stopId: string) {
	return snapshot.stops.find((stop) => stop.id === stopId);
}

export function getRouteById(snapshot: TransitSnapshot, routeId: string) {
	return snapshot.routes.find((route) => route.id === routeId);
}

export function getArrivalsWithContext(
	snapshot: TransitSnapshot,
): ArrivalWithContext[] {
	return snapshot.arrivals
		.map((arrival) => {
			const stop = getStopById(snapshot, arrival.stopId);
			const route = getRouteById(snapshot, arrival.routeId);

			if (!stop || !route) {
				return null;
			}

			return { ...arrival, stop, route };
		})
		.filter((arrival): arrival is ArrivalWithContext => arrival !== null)
		.sort((a, b) => a.etaSeconds - b.etaSeconds);
}

export function getNearbyArrivals(
	snapshot: TransitSnapshot,
	userLocation: Coordinates,
	radiusMeters = 450,
	limit = 24,
) {
	// For mock data, we anchor the distance to the snapshot's reference point 
	// to prevent flickering as the high-freq GPS store jitters between 20s refreshes.
	const anchor = snapshot.source === 'mock' ? snapshot.defaultUserLocation : userLocation;

	const arrivals = getArrivalsWithContext(snapshot)
		.map((arrival) => ({
			...arrival,
			distanceMeters: haversineDistanceMeters(anchor, arrival.stop),
		}))
		// Add 200m of 'hysteresis' slack if the snapshot is already active 
		// to prevent routes at the edge of the radius from popping in/out.
		.filter((arrival) => arrival.distanceMeters <= radiusMeters + 200);

	const vectorMap = new Map<string, typeof arrivals[number]>();

	for (const arrival of arrivals) {
		const key = `${arrival.routeId}-${arrival.direction}`;
		const existing = vectorMap.get(key);

		if (!existing || arrival.etaSeconds < existing.etaSeconds) {
			vectorMap.set(key, arrival);
		} else if (
			Math.abs(arrival.etaSeconds - existing.etaSeconds) < 30 &&
			arrival.distanceMeters < existing.distanceMeters
		) {
			vectorMap.set(key, arrival);
		}
	}

	return Array.from(vectorMap.values())
		.sort((a, b) => {
			const distDiff = (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0);
			if (Math.abs(distDiff) > 100) return distDiff;
			return a.etaSeconds - b.etaSeconds;
		})
		.slice(0, limit);
}

export function getRouteStops(snapshot: TransitSnapshot, routeId: string) {
	const route = getRouteById(snapshot, routeId);

	if (!route) {
		return [];
	}

	return route.stopIds
		.map((stopId) => getStopById(snapshot, stopId))
		.filter((stop): stop is Stop => Boolean(stop));
}

export function getRouteVehicles(snapshot: TransitSnapshot, routeId: string) {
	return snapshot.vehicles.filter((vehicle) => vehicle.routeId === routeId);
}

export function getStopArrivals(snapshot: TransitSnapshot, stopId: string) {
	return getArrivalsWithContext(snapshot).filter(
		(arrival) => arrival.stopId === stopId,
	);
}

export function groupArrivalsByDirection(arrivals: ArrivalWithContext[]) {
	return arrivals.reduce<Record<string, ArrivalWithContext[]>>(
		(groups, arrival) => {
			groups[arrival.direction] ??= [];
			groups[arrival.direction].push(arrival);
			return groups;
		},
		{},
	);
}

export function computeGoState(plan: Itinerary, nowMs: number) {
	const currentStepIndex = plan.steps.findIndex((step) => {
		const start = new Date(step.startTime).getTime();
		const end = new Date(step.endTime).getTime();
		return nowMs >= start && nowMs < end;
	});

	if (currentStepIndex === -1) {
		if (nowMs < new Date(plan.leaveAt).getTime()) {
			return {
				phase: 'pre_departure',
				label: 'Leave window open',
				currentStepIndex: 0,
				urgency: clamp(
					(new Date(plan.leaveAt).getTime() - nowMs) / (15 * 60 * 1000),
					0,
					1,
				),
			} as const;
		}

		return {
			phase: 'arrived',
			label: 'Trip complete',
			currentStepIndex: plan.steps.length - 1,
			urgency: 0,
		} as const;
	}

	const step = plan.steps[currentStepIndex];
	const remaining = new Date(step.endTime).getTime() - nowMs;

	return {
		phase: step.kind,
		label: step.title,
		currentStepIndex,
		urgency: clamp(1 - remaining / (12 * 60 * 1000), 0, 1),
	} as const;
}

export function buildTransferRiskLabel(riskScore: number) {
	if (riskScore >= 0.72) {
		return 'high';
	}

	if (riskScore >= 0.42) {
		return 'medium';
	}

	return 'low';
}

export function interpolateAlongPath(
	points: Coordinates[],
	progress: number,
): Coordinates {
	if (points.length === 0) {
		return { lat: 0, lng: 0 };
	}

	if (points.length === 1) {
		return points[0];
	}

	const clampedProgress = clamp(progress, 0, 0.9999) * (points.length - 1);
	const startIndex = Math.floor(clampedProgress);
	const endIndex = Math.min(points.length - 1, startIndex + 1);
	const localProgress = clampedProgress - startIndex;
	const start = points[startIndex];
	const end = points[endIndex];

	return {
		lat: start.lat + (end.lat - start.lat) * localProgress,
		lng: start.lng + (end.lng - start.lng) * localProgress,
	};
}

export function getCurrentStep(
	plan: Itinerary,
	index: number,
): ItineraryStep | undefined {
	return plan.steps[index];
}

export function getFavoriteCollections(
	snapshot: TransitSnapshot,
	favorites: string[],
) {
	return {
		stops: snapshot.stops.filter((stop) => favorites.includes(stop.id)),
		routes: snapshot.routes.filter((route) => favorites.includes(route.id)),
	};
}

/**
 * Groups a flat list of arrivals by Route, providing a consolidated view for a HUD board.
 * Each entry contains the route and a map of arrivals grouped by direction.
 */
export function getGroupedNearbyArrivals(arrivals: ArrivalWithContext[], limit = 16) {
	const map = new Map<string, {
		route: Route;
		allArrivals: ArrivalWithContext[];
		minDistance: number;
		minEta: number;
	}>();
	
	for (const arrival of arrivals) {
		const rid = arrival.route.id;
		if (!map.has(rid)) {
			map.set(rid, {
				route: arrival.route,
				allArrivals: [],
				minDistance: arrival.distanceMeters ?? Infinity,
				minEta: arrival.etaSeconds ?? Infinity
			});
		}
		
		const entry = map.get(rid)!;
		entry.allArrivals.push(arrival);
		entry.minDistance = Math.min(entry.minDistance, arrival.distanceMeters ?? Infinity);
		entry.minEta = Math.min(entry.minEta, arrival.etaSeconds ?? Infinity);
	}
	
	// Sort by distance first, then ETA for a sticky board layout
	return Array.from(map.values())
		.sort((a, b) => a.minDistance - b.minDistance || a.minEta - b.minEta)
		.map((entry) => ({
			route: entry.route,
			arrivalsByDirection: groupArrivalsByDirection(entry.allArrivals)
		}))
		.slice(0, limit);
}

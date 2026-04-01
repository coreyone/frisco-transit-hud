import { describe, expect, it } from 'vitest';
import { getNearbyArrivals } from './utils';
import type { TransitSnapshot, AgencyId, Route, Stop } from './types';

describe('getNearbyArrivals TDD', () => {
    const mockRoute: Route = {
        id: 'n-judah',
        agencyId: 'sfmta' as AgencyId,
        shortName: 'N',
        longName: 'N Judah',
        mode: 'tram',
        color: '#ff0000',
        textColor: '#ffffff',
        stopIds: ['stop-1', 'stop-2'],
        pattern: '',
        serviceWindow: '6am-12am',
        headwayLabel: '10 min',
        directionLabels: ['Inbound', 'Outbound']
    };

    const mockStop1: Stop = {
        id: 'stop-1',
        agencyId: 'sfmta' as AgencyId,
        name: 'Stop 1',
        lat: 37.7801,
        lng: -122.4101,
        routes: ['n-judah'],
        platforms: [],
        neighborhood: 'Mission',
        description: 'Mock Stop 1'
    };

    const mockStop2: Stop = {
        id: 'stop-2',
        agencyId: 'sfmta' as AgencyId,
        name: 'Stop 2',
        lat: 37.7810,
        lng: -122.4110,
        routes: ['n-judah'],
        platforms: [],
        neighborhood: 'Mission',
        description: 'Mock Stop 2'
    };

    const mockSnapshot: TransitSnapshot = {
        asOf: '2026-04-01T00:00:00Z',
        source: 'mock',
        stale: false,
        defaultUserLocation: { lat: 37.78, lng: -122.41 },
        stops: [mockStop1, mockStop2],
        routes: [mockRoute],
        arrivals: [
            { id: 'a1', stopId: 'stop-1', routeId: 'n-judah', direction: 'Inbound', etaSeconds: 120, isRealtime: true, confidence: 1, scheduledTime: '', headsign: '', platform: 'A', realtimeTime: '', delayMinutes: 0 },
            { id: 'a2', stopId: 'stop-1', routeId: 'n-judah', direction: 'Inbound', etaSeconds: 600, isRealtime: true, confidence: 1, scheduledTime: '', headsign: '', platform: 'A', realtimeTime: '', delayMinutes: 0 },
            { id: 'a3', stopId: 'stop-2', routeId: 'n-judah', direction: 'Inbound', etaSeconds: 300, isRealtime: true, confidence: 1, scheduledTime: '', headsign: '', platform: 'B', realtimeTime: '', delayMinutes: 0 }
        ],
        vehicles: [],
        alerts: [],
        itineraries: []
    };

    const userLoc = { lat: 37.78, lng: -122.41 };

    it('deduplicates arrivals by Route + Direction to prevent clutter', () => {
        const results = getNearbyArrivals(mockSnapshot, userLoc, 2000, 10);
        const ids = results.map(r => r.id);
        expect(ids).toContain('a1');
        expect(ids).not.toContain('a2');
        expect(ids).not.toContain('a3');
    });

    it('implements hysteresis: keeps arrivals visible even slightly outside radius', () => {
        // Stop 1 is ~15m away (37.7801 lat).
        // 500m radius is tight. Let's test the 200m grace zone.
        
        // Scenario: Stop is at 600m. Radius is 450m.
        // Without hysteresis, it drops. With hysteresis (+200m), it stays.
        const distantStop: Stop = { ...mockStop1, lat: 37.7854, lng: -122.41 }; // ~600m away
        const distantSnapshot: TransitSnapshot = {
            ...mockSnapshot,
            stops: [distantStop],
            defaultUserLocation: { lat: 37.78, lng: -122.41 }
        };

        const standardRadius = 450;
        const results = getNearbyArrivals(distantSnapshot, userLoc, standardRadius);
        
        // Even though 600m > 450m, the grace zone (650m) should keep it.
        expect(results.length).toBeGreaterThan(0);
    });
});

# Transit Integration Notes

## Current provider contract

The UI consumes a single snapshot:

- stops
- routes
- arrivals
- vehicles
- alerts
- itineraries

That shape lives in `src/lib/transit/types.ts` as `TransitSnapshot`.

## Environment flags

```sh
PUBLIC_TRANSIT_DATA_MODE=mock
PUBLIC_TRANSIT_DATA_ENDPOINT=
```

Switch `PUBLIC_TRANSIT_DATA_MODE` to `live` and point `PUBLIC_TRANSIT_DATA_ENDPOINT` at a backend or edge proxy that returns the snapshot contract.

## Recommended production feed path

1. Use 511.org as the regional backbone.
2. Layer BART direct data where it materially improves prediction quality.
3. Normalize agency payloads server-side into `TransitSnapshot`.
4. Keep smoothing and confidence scoring in the normalization layer so the mobile UI only renders.

## Production backlog

- GTFS static ingest and stop proximity indexing
- GTFS-Realtime protobuf parsing
- confidence scoring based on feed freshness and vehicle/trip agreement
- actual routing engine instead of mock itineraries
- remote push provider and token registration backend


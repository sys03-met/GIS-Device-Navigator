import { IRoutingAdapter, RouteOptions, RouteResult, TripOptions, TripResult } from './routing.interface';
import { Coordinate } from '@equipnav/contracts';

// Great-circle / Haversine distance helper
function haversineDistanceMeters(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000; // Earth radius in meters
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class FallbackRoutingAdapter implements IRoutingAdapter {
  public isAvailable(): boolean {
    return true;
  }

  public getEngineName(): string {
    return 'Fallback Distance Router (Geodesic Interpolation)';
  }

  public async calculateRoute(options: RouteOptions): Promise<RouteResult> {
    const coords = options.coordinates;
    if (coords.length < 2) {
      throw new Error('경로 계산에는 최소 2개 이상의 좌표가 필요합니다.');
    }

    let totalDistance = 0;
    const interpolatedCoords: Coordinate[] = [coords[0]];

    for (let i = 0; i < coords.length - 1; i++) {
      const c1 = coords[i];
      const c2 = coords[i + 1];
      const dist = haversineDistanceMeters(c1, c2);
      totalDistance += dist;

      // Add intermediate points for smooth polyline rendering
      const steps = Math.max(5, Math.floor(dist / 500));
      for (let s = 1; s <= steps; s++) {
        const lng = c1[0] + (c2[0] - c1[0]) * (s / steps);
        const lat = c1[1] + (c2[1] - c1[1]) * (s / steps);
        interpolatedCoords.push([lng, lat]);
      }
    }

    // Estimate speed as 40km/h (11.11 m/s) in fallback mode
    const durationSeconds = Math.round(totalDistance / 11.11);

    return {
      distance_meters: Math.round(totalDistance),
      duration_seconds: durationSeconds,
      geometry_geojson: {
        type: 'LineString',
        coordinates: interpolatedCoords,
      },
    };
  }

  public async optimizeTrip(options: TripOptions): Promise<TripResult> {
    const coords = options.coordinates;
    if (coords.length < 2) {
      throw new Error('방문 경로 최적화에는 최소 2개 이상의 좌표가 필요합니다.');
    }

    // Nearest Neighbor TSP heuristic for fallback
    const n = coords.length;
    const visited = new Array(n).fill(false);
    const order: number[] = [0];
    visited[0] = true;

    // Fix origin (0) and destination (n-1) if specified
    const fixLast = options.destination === 'last';
    const endIdx = fixLast ? n - 1 : -1;
    if (fixLast) {
      visited[n - 1] = true;
    }

    let current = 0;
    for (let i = 1; i < (fixLast ? n - 1 : n); i++) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const d = haversineDistanceMeters(coords[current], coords[j]);
          if (d < minDistance) {
            minDistance = d;
            nearest = j;
          }
        }
      }

      if (nearest !== -1) {
        visited[nearest] = true;
        order.push(nearest);
        current = nearest;
      }
    }

    if (fixLast) {
      order.push(n - 1);
    }

    const orderedCoords = order.map(idx => coords[idx]);
    const routeRes = await this.calculateRoute({ coordinates: orderedCoords });

    return {
      distance_meters: routeRes.distance_meters,
      duration_seconds: routeRes.duration_seconds,
      waypoint_order: order,
      geometry_geojson: routeRes.geometry_geojson,
    };
  }
}

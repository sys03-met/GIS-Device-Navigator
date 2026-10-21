import * as turf from '@turf/turf';
import {
  Coordinate,
  Equipment,
  GeoJSONLineString,
  NearbyEquipmentResult,
  RouteCalculateResponse,
  RouteOptimizeResponse,
} from '@equip-nav/contracts';
import { OsrmRoutingAdapter } from '../adapters/osrmRoutingAdapter.js';
import { EquipmentRepository } from '../repositories/equipmentRepository.js';

export class RoutingService {
  constructor(
    private osrmAdapter: OsrmRoutingAdapter,
    private equipmentRepo: EquipmentRepository
  ) {}

  public async calculateRoute(
    origin: Coordinate,
    destination: Coordinate,
    viaEquipmentIds: string[] = []
  ): Promise<RouteCalculateResponse> {
    const coordinates: Coordinate[] = [origin];

    for (const eqId of viaEquipmentIds) {
      const eq = this.equipmentRepo.findByEquipmentId(eqId);
      if (eq) {
        coordinates.push([eq.longitude, eq.latitude]);
      }
    }

    coordinates.push(destination);

    return await this.osrmAdapter.calculateRoute(coordinates);
  }

  public findNearbyEquipmentOnRoute(
    routeGeometry: GeoJSONLineString,
    radiusMeters: number
  ): NearbyEquipmentResult[] {
    if (!routeGeometry || !routeGeometry.coordinates || routeGeometry.coordinates.length < 2) {
      return [];
    }

    const line = turf.lineString(routeGeometry.coordinates);
    const bbox = turf.bbox(line); // [minLng, minLat, maxLng, maxLat]

    // Convert buffer radius to rough degrees (~111km per degree)
    const bufferDegrees = (radiusMeters + 500) / 111000;
    const minLng = bbox[0] - bufferDegrees;
    const minLat = bbox[1] - bufferDegrees;
    const maxLng = bbox[2] + bufferDegrees;
    const maxLat = bbox[3] + bufferDegrees;

    // Filter equipment within bbox first
    const candidateEquipments = this.equipmentRepo.findAll({
      minLng,
      maxLng,
      minLat,
      maxLat,
    });

    const results: NearbyEquipmentResult[] = [];

    for (const eq of candidateEquipments) {
      const pt = turf.point([eq.longitude, eq.latitude]);
      const distanceMeters = turf.pointToLineDistance(pt, line, { units: 'meters' });

      if (distanceMeters <= radiusMeters) {
        results.push({
          equipment: eq,
          distanceFromRouteMeters: Math.round(distanceMeters * 10) / 10,
        });
      }
    }

    // Sort by distance from route
    results.sort((a, b) => a.distanceFromRouteMeters - b.distanceFromRouteMeters);

    return results;
  }

  public async optimizeRouteVisits(
    origin: Coordinate,
    destination: Coordinate,
    viaEquipmentIds: string[]
  ): Promise<RouteOptimizeResponse> {
    if (viaEquipmentIds.length === 0) {
      const basic = await this.calculateRoute(origin, destination, []);
      return {
        optimizedEquipmentIds: [],
        distance: basic.distance,
        duration: basic.duration,
        geometry: basic.geometry,
      };
    }

    const equipmentList: Equipment[] = [];
    const waypoints: Coordinate[] = [origin];

    for (const eqId of viaEquipmentIds) {
      const eq = this.equipmentRepo.findByEquipmentId(eqId);
      if (eq) {
        equipmentList.push(eq);
        waypoints.push([eq.longitude, eq.latitude]);
      }
    }
    waypoints.push(destination);

    const tripRes = await this.osrmAdapter.optimizeTrip(waypoints);

    // Default order fallback if OSRM Trip logic doesn't return exact ordering
    tripRes.optimizedEquipmentIds = equipmentList.map((e) => e.equipment_id);

    return tripRes;
  }
}

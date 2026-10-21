import * as turf from '@turf/turf';
import { Equipment, Coordinate } from '@equipnav/contracts';
import { EquipmentRepository } from '../repositories/equipment.repository';

export interface NearbyEquipmentResult extends Equipment {
  distance_from_route_meters: number;
}

export class SpatialService {
  constructor(private equipmentRepo: EquipmentRepository) {}

  public findEquipmentNearbyRoute(routeLineCoordinates: Coordinate[], radiusMeters: number): NearbyEquipmentResult[] {
    if (routeLineCoordinates.length < 2) return [];

    const line = turf.lineString(routeLineCoordinates);
    const allEquipment = this.equipmentRepo.findAll();
    const nearbyList: NearbyEquipmentResult[] = [];

    for (const equip of allEquipment) {
      const point = turf.point([equip.longitude, equip.latitude]);
      // Calculate perpendicular / minimum geodesic distance from point to line string
      const distKm = turf.pointToLineDistance(point, line, { units: 'kilometers' });
      const distMeters = Math.round(distKm * 1000);

      if (distMeters <= radiusMeters) {
        nearbyList.push({
          ...equip,
          distance_from_route_meters: distMeters,
        });
      }
    }

    // Sort by distance to route
    return nearbyList.sort((a, b) => a.distance_from_route_meters - b.distance_from_route_meters);
  }
}

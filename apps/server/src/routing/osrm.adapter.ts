import path from 'path';
import fs from 'fs';
import { IRoutingAdapter, RouteOptions, RouteResult, TripOptions, TripResult } from './routing.interface';

export class OsrmRoutingAdapter implements IRoutingAdapter {
  private osrmInstance: any = null;
  private isLoaded = false;

  constructor(osrmDataFilePath?: string) {
    const targetOsrmFile = osrmDataFilePath || process.env.OSRM_DATA_PATH || path.join(process.cwd(), 'data', 'osrm', 'korea.osrm');

    if (fs.existsSync(targetOsrmFile)) {
      try {
        const OSRM = require('@project-osrm/osrm');
        this.osrmInstance = new OSRM({
          path: targetOsrmFile,
          algorithm: 'MLD',
        });
        this.isLoaded = true;
        console.log(`[OSRM Adapter] Successfully loaded OSRM dataset from ${targetOsrmFile}`);
      } catch (err: any) {
        console.warn(`[OSRM Adapter] Failed to initialize native OSRM binding: ${err.message}`);
      }
    } else {
      console.log(`[OSRM Adapter] OSRM dataset file not found at ${targetOsrmFile}.`);
    }
  }

  public isAvailable(): boolean {
    return this.isLoaded && this.osrmInstance !== null;
  }

  public getEngineName(): string {
    return this.isAvailable() ? 'OSRM Native Binding (MLD)' : 'OSRM Native Engine Unavailable';
  }

  public async calculateRoute(options: RouteOptions): Promise<RouteResult> {
    if (!this.isAvailable()) {
      throw new Error('OSRM 도로망 데이터셋이 로드되지 않았거나 OSRM 네이티브 엔진을 사용할 수 없습니다.');
    }

    return new Promise((resolve, reject) => {
      this.osrmInstance.route({
        coordinates: options.coordinates,
        geometries: 'geojson',
        overview: 'full',
      }, (err: any, result: any) => {
        if (err) {
          return reject(new Error(`OSRM 경로 계산 실패: ${err.message}`));
        }

        if (!result || !result.routes || result.routes.length === 0) {
          return reject(new Error('경로를 찾을 수 없는 좌표입니다.'));
        }

        const primaryRoute = result.routes[0];
        resolve({
          distance_meters: Math.round(primaryRoute.distance),
          duration_seconds: Math.round(primaryRoute.duration),
          geometry_geojson: primaryRoute.geometry,
        });
      });
    });
  }

  public async optimizeTrip(options: TripOptions): Promise<TripResult> {
    if (!this.isAvailable()) {
      throw new Error('OSRM 도로망 데이터셋이 로드되지 않았거나 OSRM 네이티브 엔진을 사용할 수 없습니다.');
    }

    return new Promise((resolve, reject) => {
      this.osrmInstance.trip({
        coordinates: options.coordinates,
        source: options.source || 'first',
        destination: options.destination || 'last',
        geometries: 'geojson',
        overview: 'full',
      }, (err: any, result: any) => {
        if (err) {
          return reject(new Error(`OSRM 방문 경로 최적화 실패: ${err.message}`));
        }

        if (!result || !result.trips || result.trips.length === 0) {
          return reject(new Error('방문 경로 최적화에 실패했습니다.'));
        }

        const trip = result.trips[0];
        const waypointOrder = result.waypoints ? result.waypoints.map((wp: any) => wp.waypoint_index) : options.coordinates.map((_, i) => i);

        resolve({
          distance_meters: Math.round(trip.distance),
          duration_seconds: Math.round(trip.duration),
          waypoint_order: waypointOrder,
          geometry_geojson: trip.geometry,
        });
      });
    });
  }
}

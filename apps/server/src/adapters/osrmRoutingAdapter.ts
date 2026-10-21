import OSRM, { RouteResult, TripResult, TableResult } from '@project-osrm/osrm';
import fs from 'fs';
import {
  Coordinate,
  RouteCalculateResponse,
  RouteOptimizeResponse,
  GeoJSONLineString,
} from '@equip-nav/contracts';

export class OsrmRoutingAdapter {
  private osrm: OSRM | null = null;
  private isLoaded = false;

  constructor(osrmPath?: string) {
    if (osrmPath) {
      this.loadDataset(osrmPath);
    }
  }

  public loadDataset(osrmPath: string): boolean {
    if (!fs.existsSync(osrmPath)) {
      console.warn(`[OSRM Adapter] OSRM 데이터셋 파일이 존재하지 않습니다: ${osrmPath}`);
      this.isLoaded = false;
      this.osrm = null;
      return false;
    }

    try {
      this.osrm = new OSRM({ path: osrmPath, algorithm: 'MLD' });
      this.isLoaded = true;
      console.log(`[OSRM Adapter] OSRM 데이터셋 로드 완료: ${osrmPath}`);
      return true;
    } catch (err) {
      console.error('[OSRM Adapter] OSRM 데이터셋 로드 실패:', err);
      this.isLoaded = false;
      this.osrm = null;
      return false;
    }
  }

  public isReady(): boolean {
    return this.isLoaded && this.osrm !== null;
  }

  public async calculateRoute(coordinates: Coordinate[]): Promise<RouteCalculateResponse> {
    if (!this.isReady()) {
      throw new Error('OSRM 라우팅 엔진이 준비되지 않았증니다. OSRM 데이터셋을 먼저 확인해 주세요.');
    }

    return new Promise((resolve, reject) => {
      this.osrm!.route(
        {
          coordinates,
          overview: 'full',
          geometries: 'geojson',
          steps: false,
        },
        (err: Error | null, result: RouteResult) => {
          if (err || !result || !result.routes || result.routes.length === 0) {
            return reject(new Error(err ? err.message : '경로를 탐색할 수 없는 좌표입니다.'));
          }

          const route = result.routes[0];
          const waypoints = (result.waypoints || []).map((wp) => ({
            name: wp.name,
            location: wp.location as Coordinate,
          }));

          resolve({
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry as GeoJSONLineString,
            waypoints,
          });
        }
      );
    });
  }

  public async optimizeTrip(coordinates: Coordinate[]): Promise<RouteOptimizeResponse> {
    if (!this.isReady()) {
      throw new Error('OSRM 라우팅 엔진이 준비되지 않았습니다.');
    }

    if (coordinates.length < 2) {
      throw new Error('경로 최적화를 위해 최소 2개 이상의 좌표가 필요합니다.');
    }

    return new Promise((resolve, reject) => {
      this.osrm!.trip(
        {
          coordinates,
          overview: 'full',
          geometries: 'geojson',
          source: 'first',
          destination: 'last',
        },
        (err: Error | null, result: TripResult) => {
          if (err || !result || !result.trips || result.trips.length === 0) {
            return reject(new Error(err ? err.message : '방문 순서 최적화에 실패하였습니다.'));
          }

          const trip = result.trips[0];

          resolve({
            optimizedEquipmentIds: [],
            distance: trip.distance,
            duration: trip.duration,
            geometry: trip.geometry as GeoJSONLineString,
          });
        }
      );
    });
  }

  public async getTable(coordinates: Coordinate[]): Promise<{ durations: number[][]; distances?: number[][] }> {
    if (!this.isReady()) {
      throw new Error('OSRM 라우팅 엔진이 준비되지 않았습니다.');
    }

    return new Promise((resolve, reject) => {
      this.osrm!.table({ coordinates }, (err: Error | null, result: TableResult) => {
        if (err || !result) {
          return reject(new Error(err ? err.message : '매트릭스 테이블 계산에 실패하였습니다.'));
        }
        resolve({
          durations: result.durations || [],
        });
      });
    });
  }
}

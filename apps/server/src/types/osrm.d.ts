declare module '@project-osrm/osrm' {
  export interface RouteOptions {
    coordinates: number[][];
    overview?: 'full' | 'simplified' | 'false';
    geometries?: 'geojson' | 'polyline' | 'polyline6';
    steps?: boolean;
    annotations?: boolean;
  }

  export interface TripOptions {
    coordinates: number[][];
    overview?: 'full' | 'simplified' | 'false';
    geometries?: 'geojson' | 'polyline' | 'polyline6';
    source?: 'any' | 'first';
    destination?: 'any' | 'last';
  }

  export interface TableOptions {
    coordinates: number[][];
    sources?: number[];
    destinations?: number[];
  }

  export interface RouteResult {
    routes: Array<{
      distance: number;
      duration: number;
      geometry: {
        type: 'LineString';
        coordinates: number[][];
      };
    }>;
    waypoints: Array<{
      name?: string;
      location: number[];
    }>;
  }

  export interface TripResult {
    trips: Array<{
      distance: number;
      duration: number;
      geometry: {
        type: 'LineString';
        coordinates: number[][];
      };
    }>;
    waypoints: Array<{
      name?: string;
      location: number[];
      waypoint_index: number;
      trips_index: number;
    }>;
  }

  export interface TableResult {
    durations: number[][];
    distances?: number[][];
  }

  export default class OSRM {
    constructor(options: { path: string; algorithm?: 'MLD' | 'CH' });
    route(options: RouteOptions, callback: (err: Error | null, result: RouteResult) => void): void;
    trip(options: TripOptions, callback: (err: Error | null, result: TripResult) => void): void;
    table(options: TableOptions, callback: (err: Error | null, result: TableResult) => void): void;
    nearest(options: { coordinates: number[][] }, callback: (err: Error | null, result: any) => void): void;
  }
}

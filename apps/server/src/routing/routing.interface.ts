import { Coordinate } from '@equipnav/contracts';

export interface RouteOptions {
  coordinates: Coordinate[];
}

export interface RouteResult {
  distance_meters: number;
  duration_seconds: number;
  geometry_geojson: {
    type: 'LineString';
    coordinates: Coordinate[];
  };
}

export interface TripOptions {
  coordinates: Coordinate[];
  source?: 'first' | 'any';
  destination?: 'last' | 'any';
}

export interface TripResult {
  distance_meters: number;
  duration_seconds: number;
  waypoint_order: number[];
  geometry_geojson: {
    type: 'LineString';
    coordinates: Coordinate[];
  };
}

export interface IRoutingAdapter {
  isAvailable(): boolean;
  getEngineName(): string;
  calculateRoute(options: RouteOptions): Promise<RouteResult>;
  optimizeTrip(options: TripOptions): Promise<TripResult>;
}

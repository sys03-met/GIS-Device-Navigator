import { z } from 'zod';

// Equipment Status
export const EquipmentStatusSchema = z.enum(['NORMAL', 'WARNING', 'ERROR', 'MAINTENANCE']);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

// Equipment Base Schema
export const EquipmentSchema = z.object({
  id: z.number().int().optional(),
  equipment_id: z.string().min(1, '설비 고유 ID는 필수입니다.'),
  name: z.string().min(1, '설비명은 필수입니다.'),
  address: z.string().default(''),
  latitude: z.number().min(-90).max(90, '유효한 위도 범위가 아닙니다.'),
  longitude: z.number().min(-180).max(180, '유효한 경도 범위가 아닙니다.'),
  equipment_type: z.string().default('GENERAL'),
  status: EquipmentStatusSchema.default('NORMAL'),
  description: z.string().default(''),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Equipment = z.infer<typeof EquipmentSchema>;

export const CreateEquipmentSchema = EquipmentSchema.omit({ id: true, created_at: true, updated_at: true });
export type CreateEquipmentInput = z.infer<typeof CreateEquipmentSchema>;

export const UpdateEquipmentSchema = CreateEquipmentSchema.partial();
export type UpdateEquipmentInput = z.infer<typeof UpdateEquipmentSchema>;

// Query Equipment Filter
export const EquipmentQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: EquipmentStatusSchema.optional(),
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
});
export type EquipmentQuery = z.infer<typeof EquipmentQuerySchema>;

// GeoJSON Types
export const CoordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90)
]);
export type Coordinate = z.infer<typeof CoordinateSchema>;

export const GeoJSONLineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(CoordinateSchema),
});
export type GeoJSONLineString = z.infer<typeof GeoJSONLineStringSchema>;

// Route Calculation Schemas
export const RouteCalculateRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  viaEquipmentIds: z.array(z.string()).optional().default([]),
});
export type RouteCalculateRequest = z.infer<typeof RouteCalculateRequestSchema>;

export const RouteCalculateResponseSchema = z.object({
  distance: z.number(), // meters
  duration: z.number(), // seconds
  geometry: GeoJSONLineStringSchema,
  waypoints: z.array(z.object({
    name: z.string().optional(),
    location: CoordinateSchema,
  })),
});
export type RouteCalculateResponse = z.infer<typeof RouteCalculateResponseSchema>;

// Nearby Equipment Query
export const NearbyEquipmentRequestSchema = z.object({
  routeGeometry: GeoJSONLineStringSchema,
  radiusMeters: z.number().positive().default(1000), // distance threshold in meters
});
export type NearbyEquipmentRequest = z.infer<typeof NearbyEquipmentRequestSchema>;

export interface NearbyEquipmentResult {
  equipment: Equipment;
  distanceFromRouteMeters: number;
}

// Route Optimize Query
export const RouteOptimizeRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  viaEquipmentIds: z.array(z.string()),
});
export type RouteOptimizeRequest = z.infer<typeof RouteOptimizeRequestSchema>;

export const RouteOptimizeResponseSchema = z.object({
  optimizedEquipmentIds: z.array(z.string()),
  distance: z.number(),
  duration: z.number(),
  geometry: GeoJSONLineStringSchema,
});
export type RouteOptimizeResponse = z.infer<typeof RouteOptimizeResponseSchema>;

// Route Plan Schemas
export const RoutePlanSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, '방문 계획명은 필수입니다.'),
  start_lng: z.number(),
  start_lat: z.number(),
  end_lng: z.number(),
  end_lat: z.number(),
  total_distance: z.number(),
  total_duration: z.number(),
  stops: z.array(z.object({
    equipment_id: z.string(),
    stop_order: z.number().int(),
    equipment: EquipmentSchema.optional(),
  })),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type RoutePlan = z.infer<typeof RoutePlanSchema>;

export const CreateRoutePlanSchema = RoutePlanSchema.omit({ id: true, created_at: true, updated_at: true });
export type CreateRoutePlanInput = z.infer<typeof CreateRoutePlanSchema>;

// App Config Schema
export const AppConfigSchema = z.object({
  mode: z.enum(['local', 'lan']).default('local'),
  port: z.number().int().default(8080),
  host: z.string().default('127.0.0.1'),
  dataDir: z.string().default('./data'),
  pmtilesPath: z.string().default('./data/korea.pmtiles'),
  osrmPath: z.string().default('./data/osrm/korea-car.osrm'),
  dbPath: z.string().default('./data/equipment.db'),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

// API Generic Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

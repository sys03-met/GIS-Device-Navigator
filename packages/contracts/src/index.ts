import { z } from 'zod';

// Equipment Status and Type Enums
export const EquipmentStatusSchema = z.enum(['NORMAL', 'INSPECTION', 'REPAIR', 'DISABLED']);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const EquipmentTypeSchema = z.enum(['TRANSMISSION', 'DISTRIBUTION', 'SUBSTATION', 'CONTROL_UNIT', 'OTHER']);
export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

// Base Equipment Schema
export const EquipmentSchema = z.object({
  id: z.number().int().optional(),
  equipment_id: z.string().min(1, '설비 ID는 필수입니다.'),
  name: z.string().min(1, '설비명은 필수입니다.'),
  address: z.string().default(''),
  latitude: z.number().min(-90).max(90, '유효하지 않은 위도입니다.'),
  longitude: z.number().min(-180).max(180, '유효하지 않은 경도입니다.'),
  equipment_type: EquipmentTypeSchema.default('OTHER'),
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

// Equipment Query Filter
export const EquipmentQueryFilterSchema = z.object({
  query: z.string().optional(),
  equipment_type: EquipmentTypeSchema.optional(),
  status: EquipmentStatusSchema.optional(),
  bbox: z.string().optional(), // "minLng,minLat,maxLng,maxLat"
});
export type EquipmentQueryFilter = z.infer<typeof EquipmentQueryFilterSchema>;

// Route / Point Schemas
export const CoordinateSchema = z.tuple([z.number(), z.number()]); // [longitude, latitude]
export type Coordinate = z.infer<typeof CoordinateSchema>;

export const RoutePointSchema = z.object({
  name: z.string().optional(),
  coordinate: CoordinateSchema,
  equipment_id: z.string().optional(),
});
export type RoutePoint = z.infer<typeof RoutePointSchema>;

export const CalculateRouteRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  waypoints: z.array(CoordinateSchema).optional(),
});
export type CalculateRouteRequest = z.infer<typeof CalculateRouteRequestSchema>;

export const RouteNearbyEquipmentRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  waypoints: z.array(CoordinateSchema).optional(),
  radius_meters: z.number().positive().default(1000),
});
export type RouteNearbyEquipmentRequest = z.infer<typeof RouteNearbyEquipmentRequestSchema>;

export const OptimizeTripRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  stops: z.array(z.object({
    id: z.string(),
    coordinate: CoordinateSchema,
    name: z.string().optional(),
  })),
  fix_origin: z.boolean().default(true),
  fix_destination: z.boolean().default(true),
});
export type OptimizeTripRequest = z.infer<typeof OptimizeTripRequestSchema>;

// Route Plan Schemas
export const RouteStopSchema = z.object({
  stop_order: z.number().int(),
  equipment_id: z.string().optional(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  stop_type: z.enum(['ORIGIN', 'WAYPOINT', 'DESTINATION']),
});
export type RouteStop = z.infer<typeof RouteStopSchema>;

export const SaveRoutePlanSchema = z.object({
  name: z.string().min(1, '방문 계획 이름은 필수입니다.'),
  description: z.string().optional().default(''),
  origin_name: z.string().default('출발지'),
  origin_coordinate: CoordinateSchema,
  destination_name: z.string().default('목적지'),
  destination_coordinate: CoordinateSchema,
  total_distance_meters: z.number().nonnegative(),
  total_duration_seconds: z.number().nonnegative(),
  stops: z.array(RouteStopSchema),
  geometry_geojson: z.string().optional(),
});
export type SaveRoutePlanInput = z.infer<typeof SaveRoutePlanSchema>;

export const RoutePlanSchema = SaveRoutePlanSchema.extend({
  id: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RoutePlan = z.infer<typeof RoutePlanSchema>;

// Standard API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutePlanSchema = exports.SaveRoutePlanSchema = exports.RouteStopSchema = exports.OptimizeTripRequestSchema = exports.RouteNearbyEquipmentRequestSchema = exports.CalculateRouteRequestSchema = exports.RoutePointSchema = exports.CoordinateSchema = exports.EquipmentQueryFilterSchema = exports.UpdateEquipmentSchema = exports.CreateEquipmentSchema = exports.EquipmentSchema = exports.EquipmentTypeSchema = exports.EquipmentStatusSchema = void 0;
const zod_1 = require("zod");
// Equipment Status and Type Enums
exports.EquipmentStatusSchema = zod_1.z.enum(['NORMAL', 'INSPECTION', 'REPAIR', 'DISABLED']);
exports.EquipmentTypeSchema = zod_1.z.enum(['TRANSMISSION', 'DISTRIBUTION', 'SUBSTATION', 'CONTROL_UNIT', 'OTHER']);
// Base Equipment Schema
exports.EquipmentSchema = zod_1.z.object({
    id: zod_1.z.number().int().optional(),
    equipment_id: zod_1.z.string().min(1, '설비 ID는 필수입니다.'),
    name: zod_1.z.string().min(1, '설비명은 필수입니다.'),
    address: zod_1.z.string().default(''),
    latitude: zod_1.z.number().min(-90).max(90, '유효하지 않은 위도입니다.'),
    longitude: zod_1.z.number().min(-180).max(180, '유효하지 않은 경도입니다.'),
    equipment_type: exports.EquipmentTypeSchema.default('OTHER'),
    status: exports.EquipmentStatusSchema.default('NORMAL'),
    description: zod_1.z.string().default(''),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
exports.CreateEquipmentSchema = exports.EquipmentSchema.omit({ id: true, created_at: true, updated_at: true });
exports.UpdateEquipmentSchema = exports.CreateEquipmentSchema.partial();
// Equipment Query Filter
exports.EquipmentQueryFilterSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    equipment_type: exports.EquipmentTypeSchema.optional(),
    status: exports.EquipmentStatusSchema.optional(),
    bbox: zod_1.z.string().optional(), // "minLng,minLat,maxLng,maxLat"
});
// Route / Point Schemas
exports.CoordinateSchema = zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]); // [longitude, latitude]
exports.RoutePointSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    coordinate: exports.CoordinateSchema,
    equipment_id: zod_1.z.string().optional(),
});
exports.CalculateRouteRequestSchema = zod_1.z.object({
    origin: exports.CoordinateSchema,
    destination: exports.CoordinateSchema,
    waypoints: zod_1.z.array(exports.CoordinateSchema).optional(),
});
exports.RouteNearbyEquipmentRequestSchema = zod_1.z.object({
    origin: exports.CoordinateSchema,
    destination: exports.CoordinateSchema,
    waypoints: zod_1.z.array(exports.CoordinateSchema).optional(),
    radius_meters: zod_1.z.number().positive().default(1000),
});
exports.OptimizeTripRequestSchema = zod_1.z.object({
    origin: exports.CoordinateSchema,
    destination: exports.CoordinateSchema,
    stops: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        coordinate: exports.CoordinateSchema,
        name: zod_1.z.string().optional(),
    })),
    fix_origin: zod_1.z.boolean().default(true),
    fix_destination: zod_1.z.boolean().default(true),
});
// Route Plan Schemas
exports.RouteStopSchema = zod_1.z.object({
    stop_order: zod_1.z.number().int(),
    equipment_id: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    stop_type: zod_1.z.enum(['ORIGIN', 'WAYPOINT', 'DESTINATION']),
});
exports.SaveRoutePlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '방문 계획 이름은 필수입니다.'),
    description: zod_1.z.string().optional().default(''),
    origin_name: zod_1.z.string().default('출발지'),
    origin_coordinate: exports.CoordinateSchema,
    destination_name: zod_1.z.string().default('목적지'),
    destination_coordinate: exports.CoordinateSchema,
    total_distance_meters: zod_1.z.number().nonnegative(),
    total_duration_seconds: zod_1.z.number().nonnegative(),
    stops: zod_1.z.array(exports.RouteStopSchema),
    geometry_geojson: zod_1.z.string().optional(),
});
exports.RoutePlanSchema = exports.SaveRoutePlanSchema.extend({
    id: zod_1.z.number().int(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
});

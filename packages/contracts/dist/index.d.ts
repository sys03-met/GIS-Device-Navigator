import { z } from 'zod';
export declare const EquipmentStatusSchema: z.ZodEnum<["NORMAL", "INSPECTION", "REPAIR", "DISABLED"]>;
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;
export declare const EquipmentTypeSchema: z.ZodEnum<["TRANSMISSION", "DISTRIBUTION", "SUBSTATION", "CONTROL_UNIT", "OTHER"]>;
export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;
export declare const EquipmentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    equipment_id: z.ZodString;
    name: z.ZodString;
    address: z.ZodDefault<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    equipment_type: z.ZodDefault<z.ZodEnum<["TRANSMISSION", "DISTRIBUTION", "SUBSTATION", "CONTROL_UNIT", "OTHER"]>>;
    status: z.ZodDefault<z.ZodEnum<["NORMAL", "INSPECTION", "REPAIR", "DISABLED"]>>;
    description: z.ZodDefault<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED";
    equipment_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    equipment_type: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER";
    description: string;
    id?: number | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    equipment_id: string;
    name: string;
    latitude: number;
    longitude: number;
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    id?: number | undefined;
    address?: string | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    description?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export declare const CreateEquipmentSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodNumber>;
    equipment_id: z.ZodString;
    name: z.ZodString;
    address: z.ZodDefault<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    equipment_type: z.ZodDefault<z.ZodEnum<["TRANSMISSION", "DISTRIBUTION", "SUBSTATION", "CONTROL_UNIT", "OTHER"]>>;
    status: z.ZodDefault<z.ZodEnum<["NORMAL", "INSPECTION", "REPAIR", "DISABLED"]>>;
    description: z.ZodDefault<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    status: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED";
    equipment_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    equipment_type: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER";
    description: string;
}, {
    equipment_id: string;
    name: string;
    latitude: number;
    longitude: number;
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    address?: string | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    description?: string | undefined;
}>;
export type CreateEquipmentInput = z.infer<typeof CreateEquipmentSchema>;
export declare const UpdateEquipmentSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["NORMAL", "INSPECTION", "REPAIR", "DISABLED"]>>>;
    equipment_id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    equipment_type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["TRANSMISSION", "DISTRIBUTION", "SUBSTATION", "CONTROL_UNIT", "OTHER"]>>>;
    description: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    equipment_id?: string | undefined;
    name?: string | undefined;
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    description?: string | undefined;
}, {
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    equipment_id?: string | undefined;
    name?: string | undefined;
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    description?: string | undefined;
}>;
export type UpdateEquipmentInput = z.infer<typeof UpdateEquipmentSchema>;
export declare const EquipmentQueryFilterSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    equipment_type: z.ZodOptional<z.ZodEnum<["TRANSMISSION", "DISTRIBUTION", "SUBSTATION", "CONTROL_UNIT", "OTHER"]>>;
    status: z.ZodOptional<z.ZodEnum<["NORMAL", "INSPECTION", "REPAIR", "DISABLED"]>>;
    bbox: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    query?: string | undefined;
    bbox?: string | undefined;
}, {
    status?: "NORMAL" | "INSPECTION" | "REPAIR" | "DISABLED" | undefined;
    equipment_type?: "TRANSMISSION" | "DISTRIBUTION" | "SUBSTATION" | "CONTROL_UNIT" | "OTHER" | undefined;
    query?: string | undefined;
    bbox?: string | undefined;
}>;
export type EquipmentQueryFilter = z.infer<typeof EquipmentQueryFilterSchema>;
export declare const CoordinateSchema: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
export type Coordinate = z.infer<typeof CoordinateSchema>;
export declare const RoutePointSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    equipment_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    coordinate: [number, number];
    equipment_id?: string | undefined;
    name?: string | undefined;
}, {
    coordinate: [number, number];
    equipment_id?: string | undefined;
    name?: string | undefined;
}>;
export type RoutePoint = z.infer<typeof RoutePointSchema>;
export declare const CalculateRouteRequestSchema: z.ZodObject<{
    origin: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    destination: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    waypoints: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
}, "strip", z.ZodTypeAny, {
    origin: [number, number];
    destination: [number, number];
    waypoints?: [number, number][] | undefined;
}, {
    origin: [number, number];
    destination: [number, number];
    waypoints?: [number, number][] | undefined;
}>;
export type CalculateRouteRequest = z.infer<typeof CalculateRouteRequestSchema>;
export declare const RouteNearbyEquipmentRequestSchema: z.ZodObject<{
    origin: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    destination: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    waypoints: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
    radius_meters: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    origin: [number, number];
    destination: [number, number];
    radius_meters: number;
    waypoints?: [number, number][] | undefined;
}, {
    origin: [number, number];
    destination: [number, number];
    waypoints?: [number, number][] | undefined;
    radius_meters?: number | undefined;
}>;
export type RouteNearbyEquipmentRequest = z.infer<typeof RouteNearbyEquipmentRequestSchema>;
export declare const OptimizeTripRequestSchema: z.ZodObject<{
    origin: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    destination: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    stops: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        coordinate: [number, number];
        name?: string | undefined;
    }, {
        id: string;
        coordinate: [number, number];
        name?: string | undefined;
    }>, "many">;
    fix_origin: z.ZodDefault<z.ZodBoolean>;
    fix_destination: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    origin: [number, number];
    destination: [number, number];
    stops: {
        id: string;
        coordinate: [number, number];
        name?: string | undefined;
    }[];
    fix_origin: boolean;
    fix_destination: boolean;
}, {
    origin: [number, number];
    destination: [number, number];
    stops: {
        id: string;
        coordinate: [number, number];
        name?: string | undefined;
    }[];
    fix_origin?: boolean | undefined;
    fix_destination?: boolean | undefined;
}>;
export type OptimizeTripRequest = z.infer<typeof OptimizeTripRequestSchema>;
export declare const RouteStopSchema: z.ZodObject<{
    stop_order: z.ZodNumber;
    equipment_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    stop_type: z.ZodEnum<["ORIGIN", "WAYPOINT", "DESTINATION"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    latitude: number;
    longitude: number;
    stop_order: number;
    stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
    equipment_id?: string | undefined;
}, {
    name: string;
    latitude: number;
    longitude: number;
    stop_order: number;
    stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
    equipment_id?: string | undefined;
}>;
export type RouteStop = z.infer<typeof RouteStopSchema>;
export declare const SaveRoutePlanSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    origin_name: z.ZodDefault<z.ZodString>;
    origin_coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    destination_name: z.ZodDefault<z.ZodString>;
    destination_coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    total_distance_meters: z.ZodNumber;
    total_duration_seconds: z.ZodNumber;
    stops: z.ZodArray<z.ZodObject<{
        stop_order: z.ZodNumber;
        equipment_id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        stop_type: z.ZodEnum<["ORIGIN", "WAYPOINT", "DESTINATION"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }, {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }>, "many">;
    geometry_geojson: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    stops: {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }[];
    origin_name: string;
    origin_coordinate: [number, number];
    destination_name: string;
    destination_coordinate: [number, number];
    total_distance_meters: number;
    total_duration_seconds: number;
    geometry_geojson?: string | undefined;
}, {
    name: string;
    stops: {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }[];
    origin_coordinate: [number, number];
    destination_coordinate: [number, number];
    total_distance_meters: number;
    total_duration_seconds: number;
    description?: string | undefined;
    origin_name?: string | undefined;
    destination_name?: string | undefined;
    geometry_geojson?: string | undefined;
}>;
export type SaveRoutePlanInput = z.infer<typeof SaveRoutePlanSchema>;
export declare const RoutePlanSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    origin_name: z.ZodDefault<z.ZodString>;
    origin_coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    destination_name: z.ZodDefault<z.ZodString>;
    destination_coordinate: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    total_distance_meters: z.ZodNumber;
    total_duration_seconds: z.ZodNumber;
    stops: z.ZodArray<z.ZodObject<{
        stop_order: z.ZodNumber;
        equipment_id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        stop_type: z.ZodEnum<["ORIGIN", "WAYPOINT", "DESTINATION"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }, {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }>, "many">;
    geometry_geojson: z.ZodOptional<z.ZodString>;
} & {
    id: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    stops: {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }[];
    origin_name: string;
    origin_coordinate: [number, number];
    destination_name: string;
    destination_coordinate: [number, number];
    total_distance_meters: number;
    total_duration_seconds: number;
    geometry_geojson?: string | undefined;
}, {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    stops: {
        name: string;
        latitude: number;
        longitude: number;
        stop_order: number;
        stop_type: "ORIGIN" | "WAYPOINT" | "DESTINATION";
        equipment_id?: string | undefined;
    }[];
    origin_coordinate: [number, number];
    destination_coordinate: [number, number];
    total_distance_meters: number;
    total_duration_seconds: number;
    description?: string | undefined;
    origin_name?: string | undefined;
    destination_name?: string | undefined;
    geometry_geojson?: string | undefined;
}>;
export type RoutePlan = z.infer<typeof RoutePlanSchema>;
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

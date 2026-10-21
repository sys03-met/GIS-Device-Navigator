import Database from 'better-sqlite3';
import { RoutePlan, SaveRoutePlanInput, RouteStop } from '@equipnav/contracts';

export class RoutePlanRepository {
  constructor(private db: Database.Database) {}

  public findAll(): RoutePlan[] {
    const plans = this.db.prepare('SELECT * FROM route_plans ORDER BY id DESC').all() as any[];
    return plans.map(p => this.attachStops(p));
  }

  public findById(id: number): RoutePlan | undefined {
    const plan = this.db.prepare('SELECT * FROM route_plans WHERE id = ?').get(id) as any;
    if (!plan) return undefined;
    return this.attachStops(plan);
  }

  public create(data: SaveRoutePlanInput): RoutePlan {
    const insertPlan = this.db.prepare(`
      INSERT INTO route_plans (
        name, description, origin_name, origin_lng, origin_lat,
        destination_name, destination_lng, destination_lat,
        total_distance_meters, total_duration_seconds, geometry_geojson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStop = this.db.prepare(`
      INSERT INTO route_stops (plan_id, stop_order, equipment_id, name, longitude, latitude, stop_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let newId = 0;
    const transaction = this.db.transaction(() => {
      const res = insertPlan.run(
        data.name,
        data.description || '',
        data.origin_name || '출발지',
        data.origin_coordinate[0],
        data.origin_coordinate[1],
        data.destination_name || '목적지',
        data.destination_coordinate[0],
        data.destination_coordinate[1],
        data.total_distance_meters,
        data.total_duration_seconds,
        data.geometry_geojson || ''
      );
      newId = Number(res.lastInsertRowid);

      data.stops.forEach((stop, idx) => {
        insertStop.run(
          newId,
          stop.stop_order ?? idx,
          stop.equipment_id || null,
          stop.name,
          stop.longitude,
          stop.latitude,
          stop.stop_type
        );
      });
    });

    transaction();
    return this.findById(newId)!;
  }

  public delete(id: number): boolean {
    const res = this.db.prepare('DELETE FROM route_plans WHERE id = ?').run(id);
    return res.changes > 0;
  }

  private attachStops(plan: any): RoutePlan {
    const stops = this.db.prepare(
      'SELECT stop_order, equipment_id, name, longitude, latitude, stop_type FROM route_stops WHERE plan_id = ? ORDER BY stop_order ASC'
    ).all(plan.id) as RouteStop[];

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      origin_name: plan.origin_name,
      origin_coordinate: [plan.origin_lng, plan.origin_lat],
      destination_name: plan.destination_name,
      destination_coordinate: [plan.destination_lng, plan.destination_lat],
      total_distance_meters: plan.total_distance_meters,
      total_duration_seconds: plan.total_duration_seconds,
      geometry_geojson: plan.geometry_geojson,
      stops,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    };
  }
}

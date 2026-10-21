import Database from 'better-sqlite3';
import { RoutePlan, CreateRoutePlanInput, Equipment } from '@equip-nav/contracts';

export class RoutePlanRepository {
  constructor(private db: Database.Database) {}

  public findAll(): RoutePlan[] {
    const stmt = this.db.prepare('SELECT * FROM route_plans ORDER BY id DESC');
    const plans = stmt.all() as RoutePlan[];

    for (const plan of plans) {
      plan.stops = this.findStopsForPlan(plan.id!);
    }

    return plans;
  }

  public findById(id: number): RoutePlan | null {
    const stmt = this.db.prepare('SELECT * FROM route_plans WHERE id = ?');
    const plan = stmt.get(id) as RoutePlan | undefined;
    if (!plan) return null;

    plan.stops = this.findStopsForPlan(id);
    return plan;
  }

  private findStopsForPlan(planId: number): Array<{ equipment_id: string; stop_order: number; equipment?: Equipment }> {
    const stmt = this.db.prepare(`
      SELECT rs.equipment_id, rs.stop_order, e.id as eq_id, e.equipment_id, e.name, e.address, e.latitude, e.longitude, e.equipment_type, e.status, e.description
      FROM route_stops rs
      LEFT JOIN equipment e ON rs.equipment_id = e.equipment_id
      WHERE rs.plan_id = ?
      ORDER BY rs.stop_order ASC
    `);

    const rows = stmt.all(planId) as any[];
    return rows.map((r) => ({
      equipment_id: r.equipment_id,
      stop_order: r.stop_order,
      equipment: r.eq_id
        ? {
            id: r.eq_id,
            equipment_id: r.equipment_id,
            name: r.name,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            equipment_type: r.equipment_type,
            status: r.status,
            description: r.description,
          }
        : undefined,
    }));
  }

  public create(data: CreateRoutePlanInput): RoutePlan {
    const insertPlanStmt = this.db.prepare(`
      INSERT INTO route_plans (name, start_lng, start_lat, end_lng, end_lat, total_distance, total_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStopStmt = this.db.prepare(`
      INSERT INTO route_stops (plan_id, equipment_id, stop_order)
      VALUES (?, ?, ?)
    `);

    let planId = 0;

    const transaction = this.db.transaction(() => {
      const result = insertPlanStmt.run(
        data.name,
        data.start_lng,
        data.start_lat,
        data.end_lng,
        data.end_lat,
        data.total_distance,
        data.total_duration
      );
      planId = result.lastInsertRowid as number;

      for (const stop of data.stops) {
        insertStopStmt.run(planId, stop.equipment_id, stop.stop_order);
      }
    });

    transaction();

    return this.findById(planId)!;
  }

  public delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM route_plans WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const finalPath = dbPath || process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'equipment.db');
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(finalPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  public getDb(): Database.Database {
    return this.db;
  }

  private initSchema(): void {
    // 1. equipment table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        equipment_type TEXT NOT NULL DEFAULT 'OTHER',
        status TEXT NOT NULL DEFAULT 'NORMAL',
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);
      CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
      CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(latitude, longitude);
    `);

    // 2. route_plans table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS route_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        origin_name TEXT DEFAULT '출발지',
        origin_lng REAL NOT NULL,
        origin_lat REAL NOT NULL,
        destination_name TEXT DEFAULT '목적지',
        destination_lng REAL NOT NULL,
        destination_lat REAL NOT NULL,
        total_distance_meters REAL NOT NULL DEFAULT 0,
        total_duration_seconds REAL NOT NULL DEFAULT 0,
        geometry_geojson TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. route_stops table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS route_stops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        stop_order INTEGER NOT NULL,
        equipment_id TEXT,
        name TEXT NOT NULL,
        longitude REAL NOT NULL,
        latitude REAL NOT NULL,
        stop_type TEXT NOT NULL, -- ORIGIN, WAYPOINT, DESTINATION
        FOREIGN KEY (plan_id) REFERENCES route_plans(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_route_stops_plan ON route_stops(plan_id, stop_order);
    `);

    // 4. app_settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public close(): void {
    this.db.close();
  }
}

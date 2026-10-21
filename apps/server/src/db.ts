import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function initDatabase(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      equipment_type TEXT NOT NULL DEFAULT 'GENERAL',
      status TEXT NOT NULL DEFAULT 'NORMAL',
      description TEXT NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_equipment_coords ON equipment(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_equipment_type_status ON equipment(equipment_type, status);

    CREATE TABLE IF NOT EXISTS route_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_lng REAL NOT NULL,
      start_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      end_lat REAL NOT NULL,
      total_distance REAL NOT NULL,
      total_duration REAL NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      equipment_id TEXT NOT NULL,
      stop_order INTEGER NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES route_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_route_stops_plan ON route_stops(plan_id, stop_order);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

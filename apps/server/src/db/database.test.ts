import assert from 'node:assert';
import test from 'node:test';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from './database.service';

test('DatabaseService Schema Initialization Test', () => {
  const testDbPath = path.join(process.cwd(), 'temp_test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const dbService = new DatabaseService(testDbPath);
  const db = dbService.getDb();

  // Verify equipment table columns
  const equipmentCols = db.prepare("PRAGMA table_info('equipment')").all() as any[];
  const colNames = equipmentCols.map(c => c.name);
  assert.ok(colNames.includes('equipment_id'));
  assert.ok(colNames.includes('latitude'));
  assert.ok(colNames.includes('longitude'));

  // Verify route_plans table
  const routePlanCols = db.prepare("PRAGMA table_info('route_plans')").all() as any[];
  assert.ok(routePlanCols.some(c => c.name === 'total_distance_meters'));

  dbService.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

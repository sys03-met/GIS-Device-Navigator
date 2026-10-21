import Database from 'better-sqlite3';
import { Equipment, CreateEquipmentInput, UpdateEquipmentInput, EquipmentQueryFilter } from '@equipnav/contracts';

export class EquipmentRepository {
  constructor(private db: Database.Database) {}

  public findAll(filter?: EquipmentQueryFilter): Equipment[] {
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params: any[] = [];

    if (filter?.query) {
      sql += ' AND (equipment_id LIKE ? OR name LIKE ? OR address LIKE ?)';
      const q = `%${filter.query}%`;
      params.push(q, q, q);
    }

    if (filter?.equipment_type) {
      sql += ' AND equipment_type = ?';
      params.push(filter.equipment_type);
    }

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.bbox) {
      const [minLng, minLat, maxLng, maxLat] = filter.bbox.split(',').map(Number);
      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        sql += ' AND longitude >= ? AND longitude <= ? AND latitude >= ? AND latitude <= ?';
        params.push(minLng, maxLng, minLat, maxLat);
      }
    }

    sql += ' ORDER BY id DESC';
    return this.db.prepare(sql).all(...params) as Equipment[];
  }

  public findById(id: number): Equipment | undefined {
    return this.db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as Equipment | undefined;
  }

  public findByEquipmentId(equipmentId: string): Equipment | undefined {
    return this.db.prepare('SELECT * FROM equipment WHERE equipment_id = ?').get(equipmentId) as Equipment | undefined;
  }

  public create(data: CreateEquipmentInput): Equipment {
    const stmt = this.db.prepare(`
      INSERT INTO equipment (equipment_id, name, address, latitude, longitude, equipment_type, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.equipment_id,
      data.name,
      data.address || '',
      data.latitude,
      data.longitude,
      data.equipment_type || 'OTHER',
      data.status || 'NORMAL',
      data.description || ''
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  public update(id: number, data: UpdateEquipmentInput): Equipment | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: any[] = [];

    if (data.equipment_id !== undefined) {
      fields.push('equipment_id = ?');
      params.push(data.equipment_id);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      params.push(data.address);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      params.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      params.push(data.longitude);
    }
    if (data.equipment_type !== undefined) {
      fields.push('equipment_type = ?');
      params.push(data.equipment_type);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const sql = `UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...params);

    return this.findById(id);
  }

  public delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public bulkCreate(items: CreateEquipmentInput[]): { created: number; errors: string[] } {
    const errors: string[] = [];
    let created = 0;

    const insertStmt = this.db.prepare(`
      INSERT INTO equipment (equipment_id, name, address, latitude, longitude, equipment_type, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((records: CreateEquipmentInput[]) => {
      for (const item of records) {
        try {
          insertStmt.run(
            item.equipment_id,
            item.name,
            item.address || '',
            item.latitude,
            item.longitude,
            item.equipment_type || 'OTHER',
            item.status || 'NORMAL',
            item.description || ''
          );
          created++;
        } catch (err: any) {
          errors.push(`[${item.equipment_id}] ${err.message}`);
        }
      }
    });

    transaction(items);
    return { created, errors };
  }
}

import Database from 'better-sqlite3';
import { Equipment, CreateEquipmentInput, UpdateEquipmentInput, EquipmentQuery } from '@equip-nav/contracts';

export class EquipmentRepository {
  constructor(private db: Database.Database) {}

  public findAll(query?: EquipmentQuery): Equipment[] {
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params: unknown[] = [];

    if (query?.search) {
      sql += ' AND (equipment_id LIKE ? OR name LIKE ? OR address LIKE ?)';
      const term = `%${query.search}%`;
      params.push(term, term, term);
    }

    if (query?.type) {
      sql += ' AND equipment_type = ?';
      params.push(query.type);
    }

    if (query?.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }

    if (query?.minLat !== undefined && query?.maxLat !== undefined) {
      sql += ' AND latitude BETWEEN ? AND ?';
      params.push(query.minLat, query.maxLat);
    }

    if (query?.minLng !== undefined && query?.maxLng !== undefined) {
      sql += ' AND longitude BETWEEN ? AND ?';
      params.push(query.minLng, query.maxLng);
    }

    sql += ' ORDER BY id DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Equipment[];
  }

  public findById(id: number): Equipment | null {
    const stmt = this.db.prepare('SELECT * FROM equipment WHERE id = ?');
    const result = stmt.get(id);
    return (result as Equipment) || null;
  }

  public findByEquipmentId(equipmentId: string): Equipment | null {
    const stmt = this.db.prepare('SELECT * FROM equipment WHERE equipment_id = ?');
    const result = stmt.get(equipmentId);
    return (result as Equipment) || null;
  }

  public create(data: CreateEquipmentInput): Equipment {
    const stmt = this.db.prepare(`
      INSERT INTO equipment (equipment_id, name, address, latitude, longitude, equipment_type, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.equipment_id,
      data.name,
      data.address ?? '',
      data.latitude,
      data.longitude,
      data.equipment_type ?? 'GENERAL',
      data.status ?? 'NORMAL',
      data.description ?? ''
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  public update(id: number, data: UpdateEquipmentInput): Equipment | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];

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
    const stmt = this.db.prepare('DELETE FROM equipment WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public bulkUpsert(items: CreateEquipmentInput[]): { inserted: number; updated: number; errors: string[] } {
    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;

    const insertStmt = this.db.prepare(`
      INSERT INTO equipment (equipment_id, name, address, latitude, longitude, equipment_type, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStmt = this.db.prepare(`
      UPDATE equipment
      SET name = ?, address = ?, latitude = ?, longitude = ?, equipment_type = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE equipment_id = ?
    `);

    const transaction = this.db.transaction((records: CreateEquipmentInput[]) => {
      for (const item of records) {
        if (!item.equipment_id || !item.name) {
          errors.push(`필수값 누락 (설비 ID: ${item.equipment_id}, 설비명: ${item.name})`);
          continue;
        }

        const existing = this.findByEquipmentId(item.equipment_id);
        if (existing) {
          updateStmt.run(
            item.name,
            item.address ?? existing.address,
            item.latitude ?? existing.latitude,
            item.longitude ?? existing.longitude,
            item.equipment_type ?? existing.equipment_type,
            item.status ?? existing.status,
            item.description ?? existing.description,
            item.equipment_id
          );
          updated++;
        } else {
          insertStmt.run(
            item.equipment_id,
            item.name,
            item.address ?? '',
            item.latitude,
            item.longitude,
            item.equipment_type ?? 'GENERAL',
            item.status ?? 'NORMAL',
            item.description ?? ''
          );
          inserted++;
        }
      }
    });

    transaction(items);

    return { inserted, updated, errors };
  }
}

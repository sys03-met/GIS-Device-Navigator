import { EquipmentRepository } from '../repositories/equipment.repository';
import { CreateEquipmentSchema, UpdateEquipmentSchema, EquipmentQueryFilter, CreateEquipmentInput } from '@equipnav/contracts';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export class EquipmentService {
  constructor(private equipmentRepo: EquipmentRepository) {}

  public getEquipments(filter?: EquipmentQueryFilter) {
    return this.equipmentRepo.findAll(filter);
  }

  public getEquipmentById(id: number) {
    const equip = this.equipmentRepo.findById(id);
    if (!equip) {
      throw new Error(`ID가 ${id}인 설비를 찾을 수 없습니다.`);
    }
    return equip;
  }

  public createEquipment(input: unknown) {
    const validated = CreateEquipmentSchema.parse(input);
    const existing = this.equipmentRepo.findByEquipmentId(validated.equipment_id);
    if (existing) {
      throw new Error(`이미 존재하는 설비 ID입니다: ${validated.equipment_id}`);
    }
    return this.equipmentRepo.create(validated);
  }

  public updateEquipment(id: number, input: unknown) {
    const validated = UpdateEquipmentSchema.parse(input);
    if (validated.equipment_id) {
      const existing = this.equipmentRepo.findByEquipmentId(validated.equipment_id);
      if (existing && existing.id !== id) {
        throw new Error(`이미 존재하는 설비 ID입니다: ${validated.equipment_id}`);
      }
    }
    const updated = this.equipmentRepo.update(id, validated);
    if (!updated) {
      throw new Error(`ID가 ${id}인 설비를 찾을 수 없습니다.`);
    }
    return updated;
  }

  public deleteEquipment(id: number) {
    const success = this.equipmentRepo.delete(id);
    if (!success) {
      throw new Error(`ID가 ${id}인 설비를 삭제할 수 없거나 존재하지 않습니다.`);
    }
    return true;
  }

  public importFromCsv(csvContent: string) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const parsedItems: CreateEquipmentInput[] = [];
    const parseErrors: string[] = [];

    records.forEach((row: any, idx: number) => {
      try {
        const item = CreateEquipmentSchema.parse({
          equipment_id: row.equipment_id || row.설비ID || row.설비_ID,
          name: row.name || row.설비명,
          address: row.address || row.주소 || row.도로명주소 || '',
          latitude: parseFloat(row.latitude || row.위도),
          longitude: parseFloat(row.longitude || row.경도),
          equipment_type: row.equipment_type || row.설비유형 || row.유형 || 'OTHER',
          status: row.status || row.상태 || 'NORMAL',
          description: row.description || row.비고 || '',
        });
        parsedItems.push(item);
      } catch (err: any) {
        parseErrors.push(`행 ${idx + 2}: ${err.message}`);
      }
    });

    const result = this.equipmentRepo.bulkCreate(parsedItems);
    return {
      imported_count: result.created,
      errors: [...parseErrors, ...result.errors],
    };
  }

  public exportToCsv(): string {
    const items = this.equipmentRepo.findAll();
    const csvRecords = items.map(item => ({
      equipment_id: item.equipment_id,
      name: item.name,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      equipment_type: item.equipment_type,
      status: item.status,
      description: item.description,
    }));

    return stringify(csvRecords, { header: true });
  }
}

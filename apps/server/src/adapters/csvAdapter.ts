import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { CreateEquipmentInput, Equipment } from '@equip-nav/contracts';

export class CsvAdapter {
  public static parseCsv(csvString: string): CreateEquipmentInput[] {
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((r: any) => ({
      equipment_id: r.equipment_id || r.ID || r['설비ID'] || r['설비 고유 ID'] || '',
      name: r.name || r['설비명'] || '',
      address: r.address || r['주소'] || r['도로명주소'] || '',
      latitude: parseFloat(r.latitude || r['위도'] || '0'),
      longitude: parseFloat(r.longitude || r['경도'] || '0'),
      equipment_type: r.equipment_type || r['설비유형'] || 'GENERAL',
      status: r.status || r['상태'] || 'NORMAL',
      description: r.description || r['비고'] || '',
    }));
  }

  public static exportCsv(equipments: Equipment[]): string {
    const data = equipments.map((e) => ({
      equipment_id: e.equipment_id,
      name: e.name,
      address: e.address,
      latitude: e.latitude,
      longitude: e.longitude,
      equipment_type: e.equipment_type,
      status: e.status,
      description: e.description,
    }));

    return stringify(data, { header: true });
  }
}

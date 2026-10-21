import assert from 'node:assert';
import test, { describe } from 'node:test';
import { initDatabase } from './db.js';
import { EquipmentRepository } from './repositories/equipmentRepository.js';
import { RoutePlanRepository } from './repositories/routePlanRepository.js';
import { CsvAdapter } from './adapters/csvAdapter.js';

describe('SQLite Database & Repository Test Suite', () => {
  const db = initDatabase(':memory:');
  const equipmentRepo = new EquipmentRepository(db);
  const routePlanRepo = new RoutePlanRepository(db);

  test('Should create and retrieve an equipment record', () => {
    const created = equipmentRepo.create({
      equipment_id: 'EQ-001',
      name: '변압기 A',
      address: '서울특별시 강남구 테헤란로 123',
      latitude: 37.501,
      longitude: 127.039,
      equipment_type: 'TRANSFORMER',
      status: 'NORMAL',
      description: '정상 작동 중',
    });

    assert.strictEqual(created.equipment_id, 'EQ-001');
    assert.strictEqual(created.name, '변압기 A');

    const fetched = equipmentRepo.findByEquipmentId('EQ-001');
    assert.ok(fetched);
    assert.strictEqual(fetched?.name, '변압기 A');
  });

  test('Should enforce UNIQUE constraint on equipment_id in bulkUpsert', () => {
    const res = equipmentRepo.bulkUpsert([
      {
        equipment_id: 'EQ-001',
        name: '변압기 A-업데이트',
        address: '서울특별시 강남구 테헤란로 123',
        latitude: 37.501,
        longitude: 127.039,
        equipment_type: 'TRANSFORMER',
        status: 'NORMAL',
        description: '업데이트됨',
      },
      {
        equipment_id: 'EQ-002',
        name: '개폐기 B',
        address: '서울특별시 강남구 역삼로 456',
        latitude: 37.505,
        longitude: 127.042,
        equipment_type: 'SWITCH',
        status: 'WARNING',
        description: '주의',
      },
    ]);

    assert.strictEqual(res.inserted, 1);
    assert.strictEqual(res.updated, 1);

    const updated = equipmentRepo.findByEquipmentId('EQ-001');
    assert.strictEqual(updated?.name, '변압기 A-업데이트');
  });

  test('Should parse and export CSV correctly', () => {
    const csvContent = `equipment_id,name,address,latitude,longitude,equipment_type,status,description
EQ-003,차단기 C,부산광역시 해운대구,35.158,129.16,BREAKER,WARNING,점검 필요`;

    const parsed = CsvAdapter.parseCsv(csvContent);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].equipment_id, 'EQ-003');

    equipmentRepo.bulkUpsert(parsed);
    const all = equipmentRepo.findAll();
    assert.strictEqual(all.length, 3);

    const exportedCsv = CsvAdapter.exportCsv(all);
    assert.ok(exportedCsv.includes('EQ-003'));
  });

  test('Should create and retrieve route plans with stops', () => {
    const plan = routePlanRepo.create({
      name: '강남구 설비 순회 점검',
      start_lng: 127.03,
      start_lat: 37.50,
      end_lng: 127.05,
      end_lat: 37.52,
      total_distance: 5200,
      total_duration: 650,
      stops: [
        { equipment_id: 'EQ-001', stop_order: 1 },
        { equipment_id: 'EQ-002', stop_order: 2 },
      ],
    });

    assert.ok(plan.id);
    assert.strictEqual(plan.stops.length, 2);
    assert.strictEqual(plan.stops[0].equipment_id, 'EQ-001');
    assert.strictEqual(plan.stops[0].equipment?.name, '변압기 A-업데이트');
  });
});

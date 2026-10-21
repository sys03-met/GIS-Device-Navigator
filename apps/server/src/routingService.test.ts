import assert from 'node:assert';
import test, { describe, before } from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { OsrmRoutingAdapter } from './adapters/osrmRoutingAdapter.js';
import { RoutingService } from './services/routingService.js';
import { EquipmentRepository } from './repositories/equipmentRepository.js';
import { initDatabase } from './db.js';

describe('OSRM Routing Adapter & Service Test Suite', () => {
  const monacoOsrmPath = path.resolve('/tmp/osrm-test-18/sample_data/monaco.osrm');
  let osrmAdapter: OsrmRoutingAdapter;
  let routingService: RoutingService;
  let equipmentRepo: EquipmentRepository;

  before(() => {
    const db = initDatabase(':memory:');
    equipmentRepo = new EquipmentRepository(db);

    // Seed equipment around Monaco route
    equipmentRepo.create({
      equipment_id: 'MON-01',
      name: 'Monaco Harbor Transformer',
      address: 'Monaco Harbor',
      latitude: 43.733,
      longitude: 7.422,
      equipment_type: 'TRANSFORMER',
      status: 'NORMAL',
      description: 'Harbor unit',
    });

    equipmentRepo.create({
      equipment_id: 'MON-02',
      name: 'Monaco Far Station',
      address: 'Far Hills',
      latitude: 43.750,
      longitude: 7.435,
      equipment_type: 'SWITCH',
      status: 'NORMAL',
      description: 'Distant unit',
    });

    osrmAdapter = new OsrmRoutingAdapter(monacoOsrmPath);
    routingService = new RoutingService(osrmAdapter, equipmentRepo);
  });

  test('Should check OSRM Adapter initialization', () => {
    assert.strictEqual(osrmAdapter.isReady(), true);
  });

  test('Should calculate route between Monaco points', async () => {
    const start: [number, number] = [7.419, 43.731];
    const end: [number, number] = [7.425, 43.737];

    const result = await routingService.calculateRoute(start, end, ['MON-01']);
    assert.ok(result.distance > 0);
    assert.ok(result.duration > 0);
    assert.strictEqual(result.geometry.type, 'LineString');
    assert.ok(result.geometry.coordinates.length > 5);
  });

  test('Should find nearby equipment along Monaco route', async () => {
    const start: [number, number] = [7.419, 43.731];
    const end: [number, number] = [7.425, 43.737];

    const routeRes = await osrmAdapter.calculateRoute([start, end]);
    const nearby = routingService.findNearbyEquipmentOnRoute(routeRes.geometry, 500);

    assert.strictEqual(nearby.length, 1);
    assert.strictEqual(nearby[0].equipment.equipment_id, 'MON-01');
    assert.ok(nearby[0].distanceFromRouteMeters <= 500);
  });
});

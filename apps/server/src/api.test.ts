import assert from 'node:assert';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase } from './db.js';
import { EquipmentRepository } from './repositories/equipmentRepository.js';
import { RoutePlanRepository } from './repositories/routePlanRepository.js';
import { OsrmRoutingAdapter } from './adapters/osrmRoutingAdapter.js';
import { RoutingService } from './services/routingService.js';
import { createApiRouter } from './routes/api.js';

async function runTests() {
  console.log('Starting API Test Suite...');
  const testDataDir = '/tmp/equipnav-test-data';
  const dummyTilePath = path.join(testDataDir, 'dummy.pmtiles');

  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  fs.writeFileSync(dummyTilePath, Buffer.alloc(1024, 0x01));

  const db = initDatabase(':memory:');
  const equipmentRepo = new EquipmentRepository(db);
  const routePlanRepo = new RoutePlanRepository(db);
  const osrmAdapter = new OsrmRoutingAdapter();
  const routingService = new RoutingService(osrmAdapter, equipmentRepo);

  const app = express();
  app.use(express.json());
  app.use('/api/v1', createApiRouter(equipmentRepo, routePlanRepo, routingService, osrmAdapter, testDataDir));

  const server = app.listen(0, '127.0.0.1', async () => {
    const address = server.address() as any;
    const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

    try {
      // Test 1: GET /health
      const healthRes = await httpGet(`${baseUrl}/health`);
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthRes.body.data.status, 'UP');
      console.log('✓ Test 1 Passed: GET /health');

      // Test 2: POST /equipment & GET /equipment
      const postRes = await httpPost(`${baseUrl}/equipment`, {
        equipment_id: 'API-EQ-01',
        name: 'API Test Equipment',
        address: 'Seoul',
        latitude: 37.5,
        longitude: 127.0,
      });
      assert.strictEqual(postRes.status, 201);
      assert.strictEqual(postRes.body.data.equipment_id, 'API-EQ-01');

      const getRes = await httpGet(`${baseUrl}/equipment`);
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.body.data.length, 1);
      console.log('✓ Test 2 Passed: Equipment CRUD');

      // Test 3: HTTP Range PMTiles
      const rangeRes = await httpGetRange(`${baseUrl}/map/tiles/dummy.pmtiles`, 'bytes=0-99');
      assert.strictEqual(rangeRes.status, 206);
      assert.strictEqual(rangeRes.headers['content-range'], 'bytes 0-99/1024');
      assert.strictEqual(rangeRes.bodyLength, 100);
      console.log('✓ Test 3 Passed: PMTiles Range Request');

      console.log('All API Tests Passed Successfully!');
    } catch (err) {
      console.error('API Test Failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

function httpGet(urlStr: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
      });
      res.on('error', reject);
    });
  });
}

function httpPost(urlStr: string, bodyObj: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const postData = JSON.stringify(bodyObj);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpGetRange(urlStr: string, rangeHeader: string): Promise<{ status: number; headers: any; bodyLength: number }> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'GET',
        headers: {
          Range: rangeHeader,
        },
      },
      (res) => {
        let length = 0;
        res.on('data', (chunk) => (length += chunk.length));
        res.on('end', () => {
          resolve({ status: res.statusCode || 500, headers: res.headers, bodyLength: length });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

runTests();

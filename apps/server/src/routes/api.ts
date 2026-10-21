import express, { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import {
  CreateEquipmentSchema,
  UpdateEquipmentSchema,
  EquipmentQuerySchema,
  RouteCalculateRequestSchema,
  NearbyEquipmentRequestSchema,
  RouteOptimizeRequestSchema,
  CreateRoutePlanSchema,
} from '@equip-nav/contracts';
import { EquipmentRepository } from '../repositories/equipmentRepository.js';
import { RoutePlanRepository } from '../repositories/routePlanRepository.js';
import { RoutingService } from '../services/routingService.js';
import { OsrmRoutingAdapter } from '../adapters/osrmRoutingAdapter.js';
import { CsvAdapter } from '../adapters/csvAdapter.js';

export function createApiRouter(
  equipmentRepo: EquipmentRepository,
  routePlanRepo: RoutePlanRepository,
  routingService: RoutingService,
  osrmAdapter: OsrmRoutingAdapter,
  dataDir: string
): Router {
  const router = Router();

  // 1. Health & Status
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        osrmReady: osrmAdapter.isReady(),
      },
    });
  });

  router.get('/system/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        osrmReady: osrmAdapter.isReady(),
        dataDirExists: fs.existsSync(dataDir),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  });

  // 2. Equipment CRUD & Filter
  router.get('/equipment', (req: Request, res: Response) => {
    try {
      const query = EquipmentQuerySchema.parse(req.query);
      const equipments = equipmentRepo.findAll(query);
      res.json({ success: true, data: equipments });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: err.message } });
    }
  });

  router.get('/equipment/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const item = equipmentRepo.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '설비를 찾을 수 없습니다.' } });
    }
    res.json({ success: true, data: item });
  });

  router.post('/equipment', (req: Request, res: Response) => {
    try {
      const input = CreateEquipmentSchema.parse(req.body);
      const existing = equipmentRepo.findByEquipmentId(input.equipment_id);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_ID', message: `이미 존재하는 설비 ID입니다: ${input.equipment_id}` },
        });
      }
      const created = equipmentRepo.create(input);
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
  });

  router.patch('/equipment/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const input = UpdateEquipmentSchema.parse(req.body);
      const updated = equipmentRepo.update(id, input);
      if (!updated) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '수정할 설비를 찾을 수 없습니다.' } });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
  });

  router.delete('/equipment/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const deleted = equipmentRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '삭제할 설비를 찾을 수 없습니다.' } });
    }
    res.json({ success: true, data: { deleted: true } });
  });

  // CSV Import / Export
  router.post('/equipment/import-csv', express.text({ type: ['text/csv', 'application/csv', 'text/plain'] }), (req: Request, res: Response) => {
    try {
      const csvData = typeof req.body === 'string' ? req.body : req.body.csv;
      if (!csvData) {
        return res.status(400).json({ success: false, error: { code: 'EMPTY_CSV', message: 'CSV 본문 데이터가 없습니다.' } });
      }
      const parsed = CsvAdapter.parseCsv(csvData);
      const result = equipmentRepo.bulkUpsert(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'CSV_PARSE_ERROR', message: err.message } });
    }
  });

  router.get('/equipment/export-csv', (req: Request, res: Response) => {
    const all = equipmentRepo.findAll();
    const csv = CsvAdapter.exportCsv(all);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="equipment_export.csv"');
    res.send(csv);
  });

  // 3. Routing APIs
  router.post('/routes/calculate', async (req: Request, res: Response) => {
    try {
      const body = RouteCalculateRequestSchema.parse(req.body);
      const result = await routingService.calculateRoute(body.origin, body.destination, body.viaEquipmentIds);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'ROUTE_FAILED', message: err.message } });
    }
  });

  router.post('/routes/nearby-equipment', (req: Request, res: Response) => {
    try {
      const body = NearbyEquipmentRequestSchema.parse(req.body);
      const results = routingService.findNearbyEquipmentOnRoute(body.routeGeometry, body.radiusMeters);
      res.json({ success: true, data: results });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'NEARBY_SEARCH_FAILED', message: err.message } });
    }
  });

  router.post('/routes/optimize', async (req: Request, res: Response) => {
    try {
      const body = RouteOptimizeRequestSchema.parse(req.body);
      const result = await routingService.optimizeRouteVisits(body.origin, body.destination, body.viaEquipmentIds);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'OPTIMIZE_FAILED', message: err.message } });
    }
  });

  // 4. Route Plans API
  router.get('/route-plans', (req: Request, res: Response) => {
    const plans = routePlanRepo.findAll();
    res.json({ success: true, data: plans });
  });

  router.get('/route-plans/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const plan = routePlanRepo.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '방문 계획을 찾을 수 없습니다.' } });
    }
    res.json({ success: true, data: plan });
  });

  router.post('/route-plans', (req: Request, res: Response) => {
    try {
      const input = CreateRoutePlanSchema.parse(req.body);
      const created = routePlanRepo.create(input);
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
  });

  router.delete('/route-plans/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const deleted = routePlanRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '삭제할 방문 계획을 찾을 수 없습니다.' } });
    }
    res.json({ success: true, data: { deleted: true } });
  });

  // 5. Offline Tile Streaming with HTTP Range Support
  router.get('/map/tiles/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const tilePath = path.join(dataDir, filename);

    if (!fs.existsSync(tilePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'MAP_NOT_FOUND', message: `오프라인 지도 파일이 존재하지 않습니다: ${filename}` },
      });
    }

    const stat = fs.statSync(tilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(tilePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/x-protobuf',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'application/x-protobuf',
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(tilePath).pipe(res);
    }
  });

  return router;
}

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from './db/database.service';
import { EquipmentRepository } from './repositories/equipment.repository';
import { RoutePlanRepository } from './repositories/route-plan.repository';
import { EquipmentService } from './services/equipment.service';
import { RouteService } from './services/route.service';
import { SpatialService } from './services/spatial.service';
import { OsrmRoutingAdapter } from './routing/osrm.adapter';
import { createEquipmentRouter } from './controllers/equipment.controller';
import { createRangeStreamHandler } from './middlewares/pmtiles-range.middleware';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize DB & Services
  const dbService = new DatabaseService();
  const equipmentRepo = new EquipmentRepository(dbService.getDb());
  const routePlanRepo = new RoutePlanRepository(dbService.getDb());

  const routingAdapter = new OsrmRoutingAdapter();
  const equipmentService = new EquipmentService(equipmentRepo);
  const routeService = new RouteService(routingAdapter, routePlanRepo);
  const spatialService = new SpatialService(equipmentRepo);

  // Health check
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      routing_engine: routeService.getEngineInfo(),
    });
  });

  // System status
  app.get('/api/v1/system/status', (req: Request, res: Response) => {
    const configPath = path.join(process.cwd(), 'config.json');
    let config = { mode: 'local' };
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        mode: config.mode,
        routing: routeService.getEngineInfo(),
        db_path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'equipment.db'),
      }
    });
  });

  // Equipment Routes
  app.use('/api/v1/equipment', createEquipmentRouter(equipmentService));

  // Route calculation & planning API
  app.post('/api/v1/routes/calculate', async (req: Request, res: Response, next) => {
    try {
      const result = await routeService.calculateRoute(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/v1/routes/nearby-equipment', (req: Request, res: Response, next) => {
    try {
      const { line_coordinates, radius_meters = 1000 } = req.body;
      if (!line_coordinates || !Array.isArray(line_coordinates)) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'line_coordinates 배열이 필요합니다.' }
        });
      }
      const nearby = spatialService.findEquipmentNearbyRoute(line_coordinates, Number(radius_meters));
      res.json({ success: true, data: nearby });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/v1/routes/optimize', async (req: Request, res: Response, next) => {
    try {
      const result = await routeService.optimizeTrip(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // Route Plans API
  app.get('/api/v1/route-plans', (req: Request, res: Response, next) => {
    try {
      const plans = routeService.getAllRoutePlans();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/v1/route-plans', (req: Request, res: Response, next) => {
    try {
      const plan = routeService.saveRoutePlan(req.body);
      res.status(201).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/route-plans/:id', (req: Request, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = routeService.getRoutePlanById(id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/v1/route-plans/:id', (req: Request, res: Response, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      routeService.deleteRoutePlan(id);
      res.json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // Offline Maps PMTiles Range Streaming Endpoint
  const pmtilesPath = path.join(process.cwd(), 'data', 'korea.pmtiles');
  app.get('/tiles/korea.pmtiles', createRangeStreamHandler(pmtilesPath));

  // Static assets serving (fonts, map sprites)
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  // Web SPA static files
  const webDistPath = path.join(process.cwd(), 'apps', 'web', 'dist');
  if (fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/tiles/')) {
        return next();
      }
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    const statusCode = err.status || 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message || '요청 처리 중 오류가 발생했습니다.',
        details: err.details || err.issues || undefined,
      }
    });
  });

  return app;
}

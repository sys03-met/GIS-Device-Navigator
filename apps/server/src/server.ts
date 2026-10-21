import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db.js';
import { EquipmentRepository } from './repositories/equipmentRepository.js';
import { RoutePlanRepository } from './repositories/routePlanRepository.js';
import { OsrmRoutingAdapter } from './adapters/osrmRoutingAdapter.js';
import { RoutingService } from './services/routingService.js';
import { createApiRouter } from './routes/api.js';

const app = express();

// Load Config
const configPath = path.resolve(process.env.CONFIG_PATH || './config.json');
let config = {
  mode: 'local',
  port: 8080,
  host: '127.0.0.1',
  dataDir: './data',
  dbPath: './data/equipment.db',
  osrmPath: './data/osrm/korea-car.osrm',
};

if (fs.existsSync(configPath)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config = { ...config, ...loaded };
  } catch (err) {
    console.warn('Failed to parse config.json, using defaults.');
  }
}

const host = config.mode === 'lan' ? '0.0.0.0' : '127.0.0.1';
const port = config.port || 8080;
const dataDir = path.resolve(config.dataDir);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Init Services & Repositories
const db = initDatabase(config.dbPath);
const equipmentRepo = new EquipmentRepository(db);
const routePlanRepo = new RoutePlanRepository(db);
const osrmAdapter = new OsrmRoutingAdapter(config.osrmPath);
const routingService = new RoutingService(osrmAdapter, equipmentRepo);

// API Routes
app.use('/api/v1', createApiRouter(equipmentRepo, routePlanRepo, routingService, osrmAdapter, dataDir));

// Serve Web Assets
const webDistPath = path.resolve(process.cwd(), 'apps/web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  console.warn(`Web dist path not found at: ${webDistPath}`);
}

const server = app.listen(port, host, () => {
  console.log(`EquipNav Server running in ${config.mode} mode at http://${host}:${port}`);
});

export { app, server };

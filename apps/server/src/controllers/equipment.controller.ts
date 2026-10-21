import { Router, Request, Response, NextFunction } from 'express';
import { EquipmentService } from '../services/equipment.service';

export function createEquipmentRouter(equipmentService: EquipmentService): Router {
  const router = Router();

  // GET /api/v1/equipment
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = {
        query: req.query.query as string,
        equipment_type: req.query.equipment_type as any,
        status: req.query.status as any,
        bbox: req.query.bbox as string,
      };
      const items = equipmentService.getEquipments(filter);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/equipment/export/csv
  router.get('/export/csv', (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = equipmentService.exportToCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="equipment.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/equipment/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const item = equipmentService.getEquipmentById(id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/equipment
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = equipmentService.createEquipment(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/equipment/:id
  router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const item = equipmentService.updateEquipment(id, req.body);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/v1/equipment/:id
  router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      equipmentService.deleteEquipment(id);
      res.json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/equipment/import/csv
  router.post('/import/csv', (req: Request, res: Response, next: NextFunction) => {
    try {
      const csvContent = typeof req.body === 'string' ? req.body : req.body.csv;
      if (!csvContent) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'CSV 내용이 비어있거나 올바르지 않습니다.' }
        });
      }
      const result = equipmentService.importFromCsv(csvContent);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

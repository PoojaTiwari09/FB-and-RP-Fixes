// src/modules/export/export.service.ts
// GAP-1: Matrix CSV export is implemented directly in deal-drivers.controller.ts
// at GET /deal-drivers/matrix/export — it calls DealDriversService.getMatrix() and
// streams the CSV response. This ExportService is available for future bulk-export
// features (e.g. scheduled exports, multi-board exports, coaching summary exports).
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ExportService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Placeholder for future bulk/scheduled export features.
   * Current matrix CSV export: GET /deal-drivers/matrix/export (in deal-drivers.controller.ts)
   */
}

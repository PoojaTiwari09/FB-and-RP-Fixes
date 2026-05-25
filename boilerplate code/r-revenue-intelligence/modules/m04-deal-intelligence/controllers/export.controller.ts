import { Controller } from '@nestjs/common';
import { ExportService } from '../services/export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly service: ExportService) {}
}

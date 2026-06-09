import { Controller } from '@nestjs/common';
import { EscalationsService } from '../services/escalations.service';

@Controller('escalations')
export class EscalationsController {
  constructor(private readonly service: EscalationsService) {}
}

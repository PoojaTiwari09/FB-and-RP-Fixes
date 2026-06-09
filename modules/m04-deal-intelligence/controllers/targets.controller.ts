import { Controller } from '@nestjs/common';
import { TargetsService } from '../services/targets.service';

@Controller('targets')
export class TargetsController {
  constructor(private readonly service: TargetsService) {}
}

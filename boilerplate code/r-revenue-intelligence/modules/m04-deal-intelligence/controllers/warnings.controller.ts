import { Controller } from '@nestjs/common';
import { WarningsService } from '../services/warnings.service';

@Controller('warnings')
export class WarningsController {
  constructor(private readonly service: WarningsService) {}
}

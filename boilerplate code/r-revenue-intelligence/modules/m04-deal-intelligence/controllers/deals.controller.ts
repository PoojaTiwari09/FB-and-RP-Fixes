import { Controller } from '@nestjs/common';
import { DealsService } from '../services/deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly service: DealsService) {}
}

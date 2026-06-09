import { Controller } from '@nestjs/common';
import { NextStepsService } from '../services/next-steps.service';

@Controller('next-steps')
export class NextStepsController {
  constructor(private readonly service: NextStepsService) {}
}

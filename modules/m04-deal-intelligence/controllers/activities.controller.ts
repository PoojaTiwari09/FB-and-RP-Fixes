import { Controller } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}
}

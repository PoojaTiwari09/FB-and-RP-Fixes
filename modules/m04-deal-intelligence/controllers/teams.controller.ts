import { Controller } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}
}

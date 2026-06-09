import { Controller } from '@nestjs/common';
import { PlaybookService } from '../services/playbook.service';

@Controller('playbook')
export class PlaybookController {
  constructor(private readonly service: PlaybookService) {}
}

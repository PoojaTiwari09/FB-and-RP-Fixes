import { Controller } from '@nestjs/common';
import { CommentsService } from '../services/comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}
}

/**
 * Query Controller — Ask Anything
 * Proxies queries to FastAPI service.
 */
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { QueryService } from '../services/query.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/v1/ai-summaries-genai/query')
@UseGuards(AuthGuard)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  async askAnything(
    @Body() body: { query: string; contextType?: string; contextId?: string; sessionId?: string },
    @Req() req,
  ) {
    return this.queryService.processQuery({
      query: body.query,
      contextType: body.contextType || 'ACCOUNT',
      contextId: body.contextId,
      sessionId: body.sessionId,
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
  }
}

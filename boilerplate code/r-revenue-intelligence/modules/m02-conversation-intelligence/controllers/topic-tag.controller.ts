import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { TopicTagService } from '../services/topic-tag.service';
import { TopicTaggingService } from '../services/topic-tagging.service';

/**
 * Per-conversation topic tag CRUD + batch AI tagging trigger.
 *
 * `TopicTagService`   = CRUD over `topic_tags` (manual add/delete/list)
 * `TopicTaggingService` = orchestrates the AI pipeline (taxonomy → AI provider → persist)
 */
@Controller('api/v1/m02-conversation-intelligence')
@UseGuards(TenantGuard)
export class TopicTagController {
  constructor(
    private readonly topicTagService: TopicTagService,
    private readonly topicTaggingService: TopicTaggingService,
  ) {}

  @Get('conversations/:id/topics')
  async getTagsForConversation(@Param('id') id: string) {
    return this.topicTagService.getTagsForConversation(id);
  }

  @Post('conversations/:id/topics')
  async addManualTag(
    @Req() req: Record<string, any>,
    @Param('id') conversationId: string,
    @Body('topicName') topicName: string,
    @Body('explanation') explanation?: string,
  ) {
    return this.topicTagService.addManualTag(req.tenantId, conversationId, topicName, explanation);
  }

  @Delete('topics/tags/:tagId')
  async deleteTag(@Param('tagId') tagId: string) {
    return this.topicTagService.deleteTag(tagId);
  }

  @Post('conversations/batch-tag')
  async batchTagTranscripts(
    @Req() req: Record<string, any>,
    @Body('limit') limit?: number,
  ) {
    return this.topicTaggingService.batchProcessTranscripts(req.tenantId, limit || 50);
  }
}

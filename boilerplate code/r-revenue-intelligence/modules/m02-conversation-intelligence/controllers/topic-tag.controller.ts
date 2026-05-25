import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { TopicTagService } from '../services/topic-tag.service';
import { TopicTaggingService } from '../services/topic-tagging.service';

@Controller('api/v1/m02-conversation-intelligence')
export class TopicTagController {
  constructor(
    private readonly topicTagService: TopicTagService,
    private readonly topicTaggingService: TopicTaggingService
  ) {}

  @Get('conversations/:id/topics')
  async getTagsForConversation(@Param('id') id: string) {
    return this.topicTagService.getTagsForConversation(id);
  }

  @Post('conversations/:id/topics')
  async addManualTag(
    @Param('id') conversationId: string,
    @Body('tenantId') tenantId: string,
    @Body('topicName') topicName: string,
    @Body('explanation') explanation?: string,
  ) {
    return this.topicTagService.addManualTag(tenantId, conversationId, topicName, explanation);
  }

  @Delete('topics/tags/:tagId')
  async deleteTag(@Param('tagId') tagId: string) {
    return this.topicTagService.deleteTag(tagId);
  }

  @Post('conversations/batch-tag')
  async batchTagTranscripts(
    @Body('tenantId') tenantId: string,
    @Body('limit') limit?: number,
  ) {
    return this.topicTaggingService.batchProcessTranscripts(tenantId, limit || 50);
  }
}

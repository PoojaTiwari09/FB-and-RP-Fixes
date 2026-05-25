import { Injectable } from '@nestjs/common';
import { TopicRepository, TopicTag } from '../repositories/topic.repository';

@Injectable()
export class TopicTagService {
  constructor(private readonly topicRepository: TopicRepository) {}

  async getTagsForConversation(conversationId: string): Promise<TopicTag[]> {
    return this.topicRepository.getTagsForConversation(conversationId);
  }

  async addManualTag(
    tenantId: string,
    conversationId: string,
    topicName: string,
    explanation: string = 'Manually added by user'
  ): Promise<TopicTag> {
    return this.topicRepository.createTopicTag({
      callId: conversationId,
      tenantId,
      topicName,
      source: 'manual',
      confidenceScore: 1.0,
      explanation
    });
  }

  async deleteTag(tagId: string): Promise<void> {
    return this.topicRepository.deleteTag(tagId);
  }

  async deleteTagsForConversation(conversationId: string): Promise<void> {
    return this.topicRepository.deleteTagsForConversation(conversationId);
  }
}

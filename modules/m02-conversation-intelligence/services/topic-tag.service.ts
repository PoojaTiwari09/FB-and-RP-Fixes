import { Injectable } from '@nestjs/common';
import { TopicRepository, TopicTag } from '../repositories/topic.repository';

/**
 * Topic tag CRUD — the single entry-point HTTP handlers use to read / create /
 * delete topic tags on a single conversation. AI-driven bulk tagging is
 * deliberately NOT in here — that lives in {@link TopicTaggingService} so the
 * provider/normalisation logic stays isolated.
 *
 * Service responsibility map for M02 topic tagging:
 *   • TopicTagService        → CRUD (this file)
 *   • TopicTaggingService    → orchestrator (taxonomy → AI → persist)
 *   • AiTopicTaggerService   → AI provider client (Groq / Gemini / keyword fallback)
 */
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
    explanation: string = 'Manually added by user',
  ): Promise<TopicTag> {
    return this.topicRepository.createTopicTag({
      callId: conversationId,
      tenantId,
      topicName,
      source: 'manual',
      confidenceScore: 1.0,
      explanation,
    });
  }

  async deleteTag(tagId: string): Promise<void> {
    return this.topicRepository.deleteTag(tagId);
  }

  async deleteTagsForConversation(conversationId: string): Promise<void> {
    return this.topicRepository.deleteTagsForConversation(conversationId);
  }
}

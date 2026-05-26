import { Injectable, Logger } from '@nestjs/common';
import { TopicRepository, TopicDefinition } from '../repositories/topic.repository';
import { AiTopicTaggerService } from './ai-topic-tagger.service';

@Injectable()
export class TopicTaggingService {
  private readonly logger = new Logger(TopicTaggingService.name);

  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly aiTagger: AiTopicTaggerService
  ) {}

  /**
   * Process a transcript and generate AI topic tags
   */
  async processTranscript(tenantId: string, transcriptText: string, callId: string) {
    try {
      // 1. Fetch tenant-specific topic taxonomy
      const topicModels = await this.topicRepository.getTopicModels(tenantId);

      let topicDefinitions: TopicDefinition[] = [];
      if (topicModels.length > 0) {
        // Flatten topics from all models for this tenant
        topicDefinitions = topicModels.flatMap(m => {
          if (Array.isArray(m.topics)) {
            return m.topics as TopicDefinition[];
          }
          return [];
        });
      }

      if (topicDefinitions.length === 0) {
        this.logger.warn(`No topic taxonomy found for tenant ${tenantId}. Using default topics.`);
        topicDefinitions = this.getDefaultTopics();
      }

      // 2. Call AI Service (Groq with Gemini Fallback)
      const candidates = await this.aiTagger.tagTranscript(transcriptText, topicDefinitions);

      // 3. Deduplicate and filter by confidence
      const filteredTopics = this.aiTagger.deduplicateAndFilterTopics(candidates, 0.70);

      if (filteredTopics.length === 0) {
        this.logger.log(`No topics passed the confidence threshold for tenant ${tenantId}.`);
        return;
      }

      // 4. Persist in topic_tags
      for (const tag of filteredTopics) {
        await this.topicRepository.createTopicTag({
          callId,
          tenantId,
          topicName: tag.topicName,
          source: tag.source,
          confidenceScore: tag.confidenceScore,
          explanation: tag.explanation,
          evidenceSnippet: tag.evidenceSnippet
        });
      }

      this.logger.log(`Successfully tagged ${filteredTopics.length} topics for call ${callId}, tenant ${tenantId}.`);
    } catch (error) {
      this.logger.error(`Error processing transcript for tenant ${tenantId}`, error);
    }
  }

  /**
   * Batch process multiple transcripts for topic tagging
   */
  async batchProcessTranscripts(tenantId: string, limit: number = 50) {
    try {
      // Get untagged conversations
      const untaggedConversations = await this.topicRepository.getUntaggedConversations(tenantId, limit);

      this.logger.log(`Found ${untaggedConversations.length} untagged conversations to process.`);

      for (const conversation of untaggedConversations) {
        await this.processTranscript(tenantId, conversation.transcript, conversation.id);
      }

      this.logger.log(`Batch processing completed for ${untaggedConversations.length} conversations.`);
    } catch (error) {
      this.logger.error(`Error in batch processing for tenant ${tenantId}`, error);
    }
  }

  /**
   * Default sales-related topics
   */
  private getDefaultTopics(): TopicDefinition[] {
    return [
      { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
      { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
      { name: 'promotions and discounts', description: 'Special offers, promotions, or discount discussions' },
      { name: 'CRM solutions', description: 'CRM software, tools, or integration discussions' },
      { name: 'ROI', description: 'Return on investment calculations or value discussions' },
      { name: 'Salesforce solutions', description: 'Salesforce-specific features, integrations, or comparisons' },
      { name: 'Data security', description: 'Security, compliance, GDPR, or data protection discussions' },
      { name: 'customer complaint', description: 'Customer complaints, issues, or negative feedback' }
    ];
  }
}

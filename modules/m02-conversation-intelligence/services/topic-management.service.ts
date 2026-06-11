import { Injectable, Logger } from '@nestjs/common';
import { TopicRepository, TopicDefinition, TopicModel } from '../repositories/topic.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TopicManagementService {
  private readonly logger = new Logger(TopicManagementService.name);

  constructor(private readonly topicRepository: TopicRepository, private readonly prisma: PrismaService) {}

  async createTopicModel(tenantId: string, topics: TopicDefinition[], type: string = 'tenantcustom'): Promise<TopicModel> {
    return this.topicRepository.createTopicModel({
      tenantId,
      topics,
      type
    });
  }

  async getTopicModels(tenantId: string): Promise<TopicModel[]> {
    return this.topicRepository.getTopicModels(tenantId);
  }

  async deleteTopicModel(id: string): Promise<void> {
    return this.topicRepository.deleteTopicModel(id);
  }

  async updateTopicModel(id: string, topics: TopicDefinition[]): Promise<TopicModel> {
    return this.topicRepository.updateTopicModel(id, topics);
  }

  async addTopicToModel(tenantId: string, topicPayload: TopicDefinition): Promise<TopicModel> {
    const models = await this.topicRepository.getTopicModels(tenantId);
    
    // Cross-Surface Sync Logic: If a linkedTrackerId is provided and we have keywords, sync them.
    if (topicPayload.linkedTrackerId && topicPayload.keywords && topicPayload.keywords.length > 0) {
      try {
        const tracker = await this.prisma.m02Tracker.findUnique({
          where: { id: topicPayload.linkedTrackerId, tenantid: tenantId },
        });

        if (tracker) {
          const newKeywords = Array.from(new Set([...tracker.keywords, ...topicPayload.keywords]));
          await this.prisma.m02Tracker.update({
            where: { id: topicPayload.linkedTrackerId },
            data: { keywords: newKeywords },
          });
          this.logger.log(`Synced ${topicPayload.keywords.length} keywords to Tracker ${topicPayload.linkedTrackerId}`);
        }
      } catch (err) {
        this.logger.error(`Failed to sync keywords to tracker: ${err}`);
      }
    }

    if (models.length === 0) {
      // Create a new model if none exists
      return this.createTopicModel(tenantId, [topicPayload], 'tenantcustom');
    }

    // Update the first model (or the most recent one)
    const latestModel = models[0];
    const updatedTopics = [...latestModel.topics.filter(t => t.name !== topicPayload.name), topicPayload];
    
    return this.topicRepository.updateTopicModel(latestModel.id, updatedTopics);
  }

  async removeTopicFromModel(tenantId: string, topicName: string): Promise<TopicModel | null> {
    const models = await this.topicRepository.getTopicModels(tenantId);
    
    if (models.length === 0) return null;

    const latestModel = models[0];
    const updatedTopics = latestModel.topics.filter((t: TopicDefinition) => t.name !== topicName);
    
    return this.topicRepository.updateTopicModel(latestModel.id, updatedTopics);
  }
}

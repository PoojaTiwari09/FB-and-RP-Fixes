import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TopicDefinition {
  name: string;
  description?: string;
  color?: string;
  speakerScope?: string;
  callTypes?: string[];
  keywords?: string[];
  linkedTrackerId?: string;
  isActive?: boolean;
}

export interface TopicModel {
  id: string;
  tenantId: string;
  topics: any[];
  type: string;
  lastTrainedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicTag {
  id: string;
  callId?: string;
  emailId?: string;
  tenantId: string;
  topicName: string;
  source: string;
  confidenceScore: number;
  explanation?: string;
  evidenceSnippet?: string;
  createdAt: Date;
}

export interface CreateTopicModelDto {
  tenantId: string;
  topics: any[];
  type?: string;
}

export interface CreateTopicTagDto {
  callId?: string;
  emailId?: string;
  tenantId: string;
  topicName: string;
  source: string;
  confidenceScore: number;
  explanation?: string;
  evidenceSnippet?: string;
}

@Injectable()
export class TopicRepository {
  private static topicModels: TopicModel[] = [];
  private static topicTags: TopicTag[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private isDbAvailable(): boolean {
    try {
      return !!this.prisma && this.prisma['m01Call'];
    } catch {
      return false;
    }
  }

  // Topic Model Operations
  async createTopicModel(dto: CreateTopicModelDto): Promise<TopicModel> {
    try {
      const result = await this.prisma.$queryRaw<TopicModel[]>`
        INSERT INTO m02_topic_models (id, tenant_id, topics, type, created_at, updated_at)
        VALUES (uuid_generate_v4(), ${dto.tenantId}::uuid, ${JSON.stringify(dto.topics)}::jsonb, ${dto.type || 'global'}, NOW(), NOW())
        RETURNING id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      return result[0];
    } catch (error) {
      // In-memory fallback
      console.log('[TopicRepository] Database insert failed, using in-memory fallback');
      const newModel: TopicModel = {
        id: `topic-model-${Date.now()}`,
        tenantId: dto.tenantId,
        topics: dto.topics,
        type: dto.type || 'global',
        lastTrainedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      TopicRepository.topicModels.push(newModel);
      return newModel;
    }
  }

  async getTopicModels(tenantId: string): Promise<TopicModel[]> {
    try {
      const results = await this.prisma.$queryRaw<TopicModel[]>`
        SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM m02_topic_models
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY created_at DESC
      `;
      return results.map((r: TopicModel) => ({
        ...r,
        topics: typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics
      }));
    } catch (error: any) {
      // In-memory fallback
      console.log(`[TopicRepository] Database query failed, using in-memory fallback: ${error.message}`);
      return TopicRepository.topicModels.filter(m => m.tenantId === tenantId);
    }
  }

  async getTopicModelById(id: string): Promise<TopicModel | null> {
    try {
      const results = await this.prisma.$queryRaw<TopicModel[]>`
        SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM m02_topic_models
        WHERE id = ${id}::uuid
      `;
      if (results.length === 0) return null;
      
      const result = results[0];
      return {
        ...result,
        topics: typeof result.topics === 'string' ? JSON.parse(result.topics) : result.topics
      };
    } catch (error: any) {
      console.log(`[TopicRepository] getTopicModelById failed, using in-memory: ${error.message}`);
      const model = TopicRepository.topicModels.find(m => m.id === id);
      return model ?? null;
    }
  }

  async deleteTopicModel(id: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM m02_topic_models WHERE id = ${id}::uuid`;
    } catch (error: any) {
      console.log(`[TopicRepository] deleteTopicModel failed, using in-memory: ${error.message}`);
      const index = TopicRepository.topicModels.findIndex(m => m.id === id);
      if (index !== -1) {
        TopicRepository.topicModels.splice(index, 1);
      }
    }
  }

  async updateTopicModel(id: string, topics: any[]): Promise<TopicModel> {
    try {
      const result = await this.prisma.$queryRaw<TopicModel[]>`
        UPDATE m02_topic_models
        SET topics = ${JSON.stringify(topics)}::jsonb, updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      const updated = result[0];
      return {
        ...updated,
        topics: typeof updated.topics === 'string' ? JSON.parse(updated.topics) : updated.topics
      };
    } catch (error: any) {
      console.log(`[TopicRepository] updateTopicModel failed, using in-memory: ${error.message}`);
      const index = TopicRepository.topicModels.findIndex(m => m.id === id);
      if (index !== -1) {
        TopicRepository.topicModels[index].topics = topics;
        TopicRepository.topicModels[index].updatedAt = new Date();
        return TopicRepository.topicModels[index];
      }
      throw new Error(`Topic model not found: ${id}`);
    }
  }

  // Topic Tag Operations
  async createTopicTag(dto: CreateTopicTagDto): Promise<TopicTag> {
    try {
      const result = await this.prisma.$queryRaw<TopicTag[]>`
        INSERT INTO m02_topic_tags (id, call_id, email_id, tenant_id, topic_name, source, confidence_score, explanation, evidence_snippet, created_at)
        VALUES (uuid_generate_v4(), ${dto.callId || null}::uuid, ${dto.emailId || null}::uuid, ${dto.tenantId}::uuid, ${dto.topicName}, ${dto.source}, ${dto.confidenceScore}, ${dto.explanation || null}, ${dto.evidenceSnippet || null}, NOW())
        RETURNING id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
      `;
      
      return result[0];
    } catch (error) {
      // In-memory fallback
      console.log('[TopicRepository] Database insert failed, using in-memory fallback');
      const newTag: TopicTag = {
        id: `topic-tag-${Date.now()}`,
        callId: dto.callId,
        emailId: dto.emailId,
        tenantId: dto.tenantId,
        topicName: dto.topicName,
        source: dto.source,
        confidenceScore: dto.confidenceScore,
        explanation: dto.explanation,
        evidenceSnippet: dto.evidenceSnippet,
        createdAt: new Date(),
      };
      TopicRepository.topicTags.push(newTag);
      return newTag;
    }
  }

  async getTagsForConversation(conversationId: string): Promise<TopicTag[]> {
    try {
      return await this.prisma.$queryRaw<TopicTag[]>`
        SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
        FROM m02_topic_tags
        WHERE call_id = ${conversationId}::uuid OR email_id = ${conversationId}::uuid
        ORDER BY confidence_score DESC
      `;
    } catch (error: any) {
      // In-memory fallback
      console.log(`[TopicRepository] Database query failed, using in-memory fallback: ${error.message}`);
      return TopicRepository.topicTags.filter(t => t.callId === conversationId || t.emailId === conversationId);
    }
  }

  async getTagsForTenant(tenantId: string): Promise<TopicTag[]> {
    try {
      return await this.prisma.$queryRaw<TopicTag[]>`
        SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
        FROM m02_topic_tags
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY created_at DESC
      `;
    } catch (error: any) {
      console.log(`[TopicRepository] getTagsForTenant failed, using in-memory: ${error.message}`);
      return TopicRepository.topicTags.filter(t => t.tenantId === tenantId);
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM m02_topic_tags WHERE id = ${tagId}::uuid`;
    } catch (error: any) {
      console.log(`[TopicRepository] deleteTag failed, using in-memory: ${error.message}`);
      const index = TopicRepository.topicTags.findIndex(t => t.id === tagId);
      if (index !== -1) {
        TopicRepository.topicTags.splice(index, 1);
      }
    }
  }

  async deleteTagsForConversation(conversationId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM m02_topic_tags WHERE call_id = ${conversationId}::uuid OR email_id = ${conversationId}::uuid`;
    } catch (error: any) {
      console.log(`[TopicRepository] deleteTagsForConversation failed, using in-memory: ${error.message}`);
      TopicRepository.topicTags = TopicRepository.topicTags.filter(
        t => t.callId !== conversationId && t.emailId !== conversationId
      );
    }
  }

  async getUntaggedConversations(tenantId: string, limit: number = 50): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw<any[]>`
        SELECT c.id, c.title, t."fullText" as transcript
        FROM ingestion.call_records c
        JOIN ingestion.transcripts t ON t."callId" = c.id
        WHERE c.tenantid = ${tenantId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM m02_topic_tags tg WHERE tg.call_id = c.id
        )
        LIMIT ${limit}
      `;
    } catch (error: any) {
      console.log(`[TopicRepository] getUntaggedConversations failed, using in-memory: ${error.message}`);
      // Fallback: return empty array
      return [];
    }
  }

  async getConversationById(conversationId: string): Promise<any> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT c.id, c.title, t."fullText" as transcript
        FROM ingestion.call_records c
        JOIN ingestion.transcripts t ON t."callId" = c.id
        WHERE c.id = ${conversationId}::uuid
      `;
      if (results.length > 0) return results[0];
      return null;
    } catch (error: any) {
      console.log(`[TopicRepository] getConversationById failed, using in-memory fallback: ${error.message}`);
      return null;
    }
  }
}

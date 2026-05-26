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
      const query = `
        INSERT INTO m02_topic_models (id, tenant_id, topics, type, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1::uuid, $2::jsonb, $3, NOW(), NOW())
        RETURNING id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      const result = await this.prisma.$queryRawUnsafe(
        query,
        dto.tenantId,
        JSON.stringify(dto.topics),
        dto.type || 'global'
      ) as TopicModel[];
      
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
      const query = `
        SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM m02_topic_models
        WHERE tenant_id = $1::uuid
        ORDER BY created_at DESC
      `;
      
      const results = await this.prisma.$queryRawUnsafe(query, tenantId) as TopicModel[];
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
    const query = `
      SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM m02_topic_models
      WHERE id = $1::uuid
    `;
    
    const results = await this.prisma.$queryRawUnsafe(query, id) as TopicModel[];
    if (results.length === 0) return null;
    
    const result = results[0];
    return {
      ...result,
      topics: typeof result.topics === 'string' ? JSON.parse(result.topics) : result.topics
    };
  }

  async deleteTopicModel(id: string): Promise<void> {
    const query = `DELETE FROM m02_topic_models WHERE id = $1::uuid`;
    await this.prisma.$queryRawUnsafe(query, id);
  }

  async updateTopicModel(id: string, topics: any[]): Promise<TopicModel> {
    const query = `
      UPDATE m02_topic_models
      SET topics = $1::jsonb, updated_at = NOW()
      WHERE id = $2::uuid
      RETURNING id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await this.prisma.$queryRawUnsafe(
      query,
      JSON.stringify(topics),
      id
    ) as TopicModel[];
    
    const updated = result[0];
    return {
      ...updated,
      topics: typeof updated.topics === 'string' ? JSON.parse(updated.topics) : updated.topics
    };
  }

  // Topic Tag Operations
  async createTopicTag(dto: CreateTopicTagDto): Promise<TopicTag> {
    try {
      const query = `
        INSERT INTO m02_topic_tags (id, call_id, email_id, tenant_id, topic_name, source, confidence_score, explanation, evidence_snippet, created_at)
        VALUES (uuid_generate_v4(), $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, NOW())
        RETURNING id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
      `;
      
      const result = await this.prisma.$queryRawUnsafe(
        query,
        dto.callId || null,
        dto.emailId || null,
        dto.tenantId,
        dto.topicName,
        dto.source,
        dto.confidenceScore,
        dto.explanation || null,
        dto.evidenceSnippet || null
      ) as TopicTag[];
      
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
      const query = `
        SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
        FROM m02_topic_tags
        WHERE call_id = $1::uuid OR email_id = $1::uuid
        ORDER BY confidence_score DESC
      `;
      
      return await this.prisma.$queryRawUnsafe(query, conversationId) as TopicTag[];
    } catch (error: any) {
      // In-memory fallback
      console.log(`[TopicRepository] Database query failed, using in-memory fallback: ${error.message}`);
      return TopicRepository.topicTags.filter(t => t.callId === conversationId || t.emailId === conversationId);
    }
  }

  async getTagsForTenant(tenantId: string): Promise<TopicTag[]> {
    const query = `
      SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
      FROM m02_topic_tags
      WHERE tenant_id = $1::uuid
      ORDER BY created_at DESC
    `;
    
    return await this.prisma.$queryRawUnsafe(query, tenantId) as TopicTag[];
  }

  async deleteTag(tagId: string): Promise<void> {
    const query = `DELETE FROM m02_topic_tags WHERE id = $1::uuid`;
    await this.prisma.$queryRawUnsafe(query, tagId);
  }

  async deleteTagsForConversation(conversationId: string): Promise<void> {
    const query = `DELETE FROM m02_topic_tags WHERE call_id = $1::uuid OR email_id = $1::uuid`;
    await this.prisma.$queryRawUnsafe(query, conversationId);
  }

  async getUntaggedConversations(tenantId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT c.id, c.title, c.transcript
      FROM m01_calls c
      WHERE c.tenant_id = $1::uuid
      AND NOT EXISTS (
        SELECT 1 FROM m02_topic_tags t WHERE t.call_id = c.id
      )
      LIMIT $2
    `;
    
    return await this.prisma.$queryRawUnsafe(query, tenantId, limit);
  }

  async getConversationById(conversationId: string): Promise<any> {
    const query = `
      SELECT id, title, transcript
      FROM m01_calls
      WHERE id = $1::uuid
    `;
    
    const results = await this.prisma.$queryRawUnsafe(query, conversationId);
    return results.length > 0 ? results[0] : null;
  }
}

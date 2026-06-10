"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TopicRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let TopicRepository = class TopicRepository {
    static { TopicRepository_1 = this; }
    prisma;
    static topicModels = [];
    static topicTags = [];
    constructor(prisma) {
        this.prisma = prisma;
    }
    isDbAvailable() {
        try {
            return !!this.prisma && this.prisma['m01Call'];
        }
        catch {
            return false;
        }
    }
    async createTopicModel(dto) {
        try {
            const result = await this.prisma.$queryRaw `
        INSERT INTO m02_topic_models (id, tenant_id, topics, type, created_at, updated_at)
        VALUES (uuid_generate_v4(), ${dto.tenantId}::uuid, ${JSON.stringify(dto.topics)}::jsonb, ${dto.type || 'global'}, NOW(), NOW())
        RETURNING id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      `;
            return result[0];
        }
        catch (error) {
            console.log('[TopicRepository] Database insert failed, using in-memory fallback');
            const newModel = {
                id: `topic-model-${Date.now()}`,
                tenantId: dto.tenantId,
                topics: dto.topics,
                type: dto.type || 'global',
                lastTrainedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            TopicRepository_1.topicModels.push(newModel);
            return newModel;
        }
    }
    async getTopicModels(tenantId) {
        try {
            const results = await this.prisma.$queryRaw `
        SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM m02_topic_models
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY created_at DESC
      `;
            return results.map((r) => ({
                ...r,
                topics: typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics
            }));
        }
        catch (error) {
            console.log(`[TopicRepository] Database query failed, using in-memory fallback: ${error.message}`);
            return TopicRepository_1.topicModels.filter(m => m.tenantId === tenantId);
        }
    }
    async getTopicModelById(id) {
        const results = await this.prisma.$queryRaw `
      SELECT id, tenant_id as "tenantId", topics, type, last_trained_at as "lastTrainedAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM m02_topic_models
      WHERE id = ${id}::uuid
    `;
        if (results.length === 0)
            return null;
        const result = results[0];
        return {
            ...result,
            topics: typeof result.topics === 'string' ? JSON.parse(result.topics) : result.topics
        };
    }
    async deleteTopicModel(id) {
        await this.prisma.$queryRaw `DELETE FROM m02_topic_models WHERE id = ${id}::uuid`;
    }
    async updateTopicModel(id, topics) {
        const result = await this.prisma.$queryRaw `
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
    }
    async createTopicTag(dto) {
        try {
            const result = await this.prisma.$queryRaw `
        INSERT INTO m02_topic_tags (id, call_id, email_id, tenant_id, topic_name, source, confidence_score, explanation, evidence_snippet, created_at)
        VALUES (uuid_generate_v4(), ${dto.callId || null}::uuid, ${dto.emailId || null}::uuid, ${dto.tenantId}::uuid, ${dto.topicName}, ${dto.source}, ${dto.confidenceScore}, ${dto.explanation || null}, ${dto.evidenceSnippet || null}, NOW())
        RETURNING id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
      `;
            return result[0];
        }
        catch (error) {
            console.log('[TopicRepository] Database insert failed, using in-memory fallback');
            const newTag = {
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
            TopicRepository_1.topicTags.push(newTag);
            return newTag;
        }
    }
    async getTagsForConversation(conversationId) {
        try {
            return await this.prisma.$queryRaw `
        SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
        FROM m02_topic_tags
        WHERE call_id = ${conversationId}::uuid OR email_id = ${conversationId}::uuid
        ORDER BY confidence_score DESC
      `;
        }
        catch (error) {
            console.log(`[TopicRepository] Database query failed, using in-memory fallback: ${error.message}`);
            return TopicRepository_1.topicTags.filter(t => t.callId === conversationId || t.emailId === conversationId);
        }
    }
    async getTagsForTenant(tenantId) {
        return await this.prisma.$queryRaw `
      SELECT id, call_id as "callId", email_id as "emailId", tenant_id as "tenantId", topic_name as "topicName", source, confidence_score as "confidenceScore", explanation, evidence_snippet as "evidenceSnippet", created_at as "createdAt"
      FROM m02_topic_tags
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY created_at DESC
    `;
    }
    async deleteTag(tagId) {
        await this.prisma.$queryRaw `DELETE FROM m02_topic_tags WHERE id = ${tagId}::uuid`;
    }
    async deleteTagsForConversation(conversationId) {
        await this.prisma.$queryRaw `DELETE FROM m02_topic_tags WHERE call_id = ${conversationId}::uuid OR email_id = ${conversationId}::uuid`;
    }
    async getUntaggedConversations(tenantId, limit = 50) {
        return await this.prisma.$queryRaw `
      SELECT c.id, c.title, c.transcript
      FROM m01_calls c
      WHERE c.tenant_id = ${tenantId}::uuid
      AND NOT EXISTS (
        SELECT 1 FROM m02_topic_tags t WHERE t.call_id = c.id
      )
      LIMIT ${limit}
    `;
    }
    async getConversationById(conversationId) {
        const results = await this.prisma.$queryRaw `
      SELECT id, title, transcript
      FROM m01_calls
      WHERE id = ${conversationId}::uuid
    `;
        return results.length > 0 ? results[0] : null;
    }
};
exports.TopicRepository = TopicRepository;
exports.TopicRepository = TopicRepository = TopicRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopicRepository);
//# sourceMappingURL=topic.repository.js.map
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
var TopicTaggingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicTaggingService = void 0;
const common_1 = require("@nestjs/common");
const topic_repository_1 = require("../repositories/topic.repository");
const ai_topic_tagger_service_1 = require("./ai-topic-tagger.service");
let TopicTaggingService = TopicTaggingService_1 = class TopicTaggingService {
    topicRepository;
    aiTagger;
    logger = new common_1.Logger(TopicTaggingService_1.name);
    constructor(topicRepository, aiTagger) {
        this.topicRepository = topicRepository;
        this.aiTagger = aiTagger;
    }
    async processTranscript(tenantId, transcriptText, callId) {
        try {
            const topicModels = await this.topicRepository.getTopicModels(tenantId);
            let topicDefinitions = [];
            if (topicModels.length > 0) {
                topicDefinitions = topicModels.flatMap(m => {
                    if (Array.isArray(m.topics)) {
                        return m.topics;
                    }
                    return [];
                });
            }
            if (topicDefinitions.length === 0) {
                this.logger.warn(`No topic taxonomy found for tenant ${tenantId}. Using default topics.`);
                topicDefinitions = this.getDefaultTopics();
            }
            const candidates = await this.aiTagger.tagTranscript(transcriptText, topicDefinitions);
            const filteredTopics = this.aiTagger.deduplicateAndFilterTopics(candidates, 0.70);
            if (filteredTopics.length === 0) {
                this.logger.log(`No topics passed the confidence threshold for tenant ${tenantId}.`);
                return;
            }
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
        }
        catch (error) {
            this.logger.error(`Error processing transcript for tenant ${tenantId}`, error);
        }
    }
    async batchProcessTranscripts(tenantId, limit = 50) {
        try {
            const untaggedConversations = await this.topicRepository.getUntaggedConversations(tenantId, limit);
            this.logger.log(`Found ${untaggedConversations.length} untagged conversations to process.`);
            for (const conversation of untaggedConversations) {
                await this.processTranscript(tenantId, conversation.transcript, conversation.id);
            }
            this.logger.log(`Batch processing completed for ${untaggedConversations.length} conversations.`);
        }
        catch (error) {
            this.logger.error(`Error in batch processing for tenant ${tenantId}`, error);
        }
    }
    getDefaultTopics() {
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
};
exports.TopicTaggingService = TopicTaggingService;
exports.TopicTaggingService = TopicTaggingService = TopicTaggingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [topic_repository_1.TopicRepository,
        ai_topic_tagger_service_1.AiTopicTaggerService])
], TopicTaggingService);
//# sourceMappingURL=topic-tagging.service.js.map
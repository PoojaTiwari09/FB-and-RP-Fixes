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
var TopicManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicManagementService = void 0;
const common_1 = require("@nestjs/common");
const topic_repository_1 = require("../repositories/topic.repository");
const prisma_service_1 = require("../database/prisma.service");
let TopicManagementService = TopicManagementService_1 = class TopicManagementService {
    topicRepository;
    prisma;
    logger = new common_1.Logger(TopicManagementService_1.name);
    constructor(topicRepository, prisma) {
        this.topicRepository = topicRepository;
        this.prisma = prisma;
    }
    async createTopicModel(tenantId, topics, type = 'tenantcustom') {
        return this.topicRepository.createTopicModel({
            tenantId,
            topics,
            type
        });
    }
    async getTopicModels(tenantId) {
        return this.topicRepository.getTopicModels(tenantId);
    }
    async deleteTopicModel(id) {
        return this.topicRepository.deleteTopicModel(id);
    }
    async updateTopicModel(id, topics) {
        return this.topicRepository.updateTopicModel(id, topics);
    }
    async addTopicToModel(tenantId, topicPayload) {
        const models = await this.topicRepository.getTopicModels(tenantId);
        if (topicPayload.linkedTrackerId && topicPayload.keywords && topicPayload.keywords.length > 0) {
            try {
                const tracker = await this.prisma.m02Tracker.findUnique({
                    where: { id: topicPayload.linkedTrackerId, tenantId },
                });
                if (tracker) {
                    const newKeywords = Array.from(new Set([...tracker.keywords, ...topicPayload.keywords]));
                    await this.prisma.m02Tracker.update({
                        where: { id: topicPayload.linkedTrackerId },
                        data: { keywords: newKeywords },
                    });
                    this.logger.log(`Synced ${topicPayload.keywords.length} keywords to Tracker ${topicPayload.linkedTrackerId}`);
                }
            }
            catch (err) {
                this.logger.error(`Failed to sync keywords to tracker: ${err}`);
            }
        }
        if (models.length === 0) {
            return this.createTopicModel(tenantId, [topicPayload], 'tenantcustom');
        }
        const latestModel = models[0];
        const updatedTopics = [...latestModel.topics.filter(t => t.name !== topicPayload.name), topicPayload];
        return this.topicRepository.updateTopicModel(latestModel.id, updatedTopics);
    }
    async removeTopicFromModel(tenantId, topicName) {
        const models = await this.topicRepository.getTopicModels(tenantId);
        if (models.length === 0)
            return null;
        const latestModel = models[0];
        const updatedTopics = latestModel.topics.filter((t) => t.name !== topicName);
        return this.topicRepository.updateTopicModel(latestModel.id, updatedTopics);
    }
};
exports.TopicManagementService = TopicManagementService;
exports.TopicManagementService = TopicManagementService = TopicManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [topic_repository_1.TopicRepository, prisma_service_1.PrismaService])
], TopicManagementService);
//# sourceMappingURL=topic-management.service.js.map
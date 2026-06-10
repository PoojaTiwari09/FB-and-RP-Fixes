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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicTagController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const topic_tag_service_1 = require("../services/topic-tag.service");
const topic_tagging_service_1 = require("../services/topic-tagging.service");
let TopicTagController = class TopicTagController {
    topicTagService;
    topicTaggingService;
    constructor(topicTagService, topicTaggingService) {
        this.topicTagService = topicTagService;
        this.topicTaggingService = topicTaggingService;
    }
    async getTagsForConversation(id) {
        return this.topicTagService.getTagsForConversation(id);
    }
    async addManualTag(req, conversationId, topicName, explanation) {
        return this.topicTagService.addManualTag(req.tenantId, conversationId, topicName, explanation);
    }
    async deleteTag(tagId) {
        return this.topicTagService.deleteTag(tagId);
    }
    async batchTagTranscripts(req, limit) {
        return this.topicTaggingService.batchProcessTranscripts(req.tenantId, limit || 50);
    }
};
exports.TopicTagController = TopicTagController;
__decorate([
    (0, common_1.Get)('conversations/:id/topics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicTagController.prototype, "getTagsForConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:id/topics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('topicName')),
    __param(3, (0, common_1.Body)('explanation')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], TopicTagController.prototype, "addManualTag", null);
__decorate([
    (0, common_1.Delete)('topics/tags/:tagId'),
    __param(0, (0, common_1.Param)('tagId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicTagController.prototype, "deleteTag", null);
__decorate([
    (0, common_1.Post)('conversations/batch-tag'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], TopicTagController.prototype, "batchTagTranscripts", null);
exports.TopicTagController = TopicTagController = __decorate([
    (0, common_1.Controller)('api/v1/m02-conversation-intelligence'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [topic_tag_service_1.TopicTagService,
        topic_tagging_service_1.TopicTaggingService])
], TopicTagController);
//# sourceMappingURL=topic-tag.controller.js.map
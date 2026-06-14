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
exports.TopicManagementController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const topic_management_service_1 = require("../services/topic-management.service");
let TopicManagementController = class TopicManagementController {
    topicManagementService;
    constructor(topicManagementService) {
        this.topicManagementService = topicManagementService;
    }
    async createTopicModel(req, topics, type) {
        return { data: await this.topicManagementService.createTopicModel(req.tenantId, topics, type) };
    }
    async getTopicModels(req) {
        return { data: await this.topicManagementService.getTopicModels(req.tenantId) };
    }
    async deleteTopicModel(id) {
        return this.topicManagementService.deleteTopicModel(id);
    }
    async addTopicToModel(req, body) {
        return { data: await this.topicManagementService.addTopicToModel(req.tenantId, body) };
    }
    async removeTopic(req, topicName) {
        return { data: await this.topicManagementService.removeTopicFromModel(req.tenantId, topicName) };
    }
    async seedDefaultTopics(req) {
        const defaultTopics = [
            { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
            { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
            { name: 'promotions and discounts', description: 'Special offers, promotions, or discount discussions' },
            { name: 'CRM solutions', description: 'CRM software, tools, or integration discussions' },
            { name: 'ROI', description: 'Return on investment calculations or value discussions' },
            { name: 'Salesforce solutions', description: 'Salesforce-specific features, integrations, or comparisons' },
            { name: 'Data security', description: 'Security, compliance, GDPR, or data protection discussions' },
            { name: 'customer complaint', description: 'Customer complaints, issues, or negative feedback' },
        ];
        const existingModels = await this.topicManagementService.getTopicModels(req.tenantId);
        if (existingModels.length > 0) {
            return { data: { message: 'Topic model already exists for this tenant', models: existingModels } };
        }
        return { data: await this.topicManagementService.createTopicModel(req.tenantId, defaultTopics, 'global') };
    }
};
exports.TopicManagementController = TopicManagementController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('topics')),
    __param(2, (0, common_1.Body)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array, String]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "createTopicModel", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "getTopicModels", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "deleteTopicModel", null);
__decorate([
    (0, common_1.Post)('topics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "addTopicToModel", null);
__decorate([
    (0, common_1.Delete)('remove'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('topicName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "removeTopic", null);
__decorate([
    (0, common_1.Post)('seed'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopicManagementController.prototype, "seedDefaultTopics", null);
exports.TopicManagementController = TopicManagementController = __decorate([
    (0, common_1.Controller)('api/v1/m02-conversation-intelligence/topics'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [topic_management_service_1.TopicManagementService])
], TopicManagementController);
//# sourceMappingURL=topic-management.controller.js.map
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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealPlaybookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_playbook_service_1 = require("@m04/services/deal-playbook.service");
const playbook_dto_1 = require("@m04/schemas/playbook.dto");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
let DealPlaybookController = class DealPlaybookController {
    playbookService;
    constructor(playbookService) {
        this.playbookService = playbookService;
    }
    async getPlaybook(dealId, type) {
        return this.playbookService.getPlaybook(dealId, type);
    }
    async createPlaybookItem(dealId, dto) {
        return this.playbookService.createPlaybookItem(dealId, dto);
    }
    async updatePlaybookItem(dealId, itemId, dto, req) {
        return this.playbookService.updatePlaybookItem(dealId, itemId, dto, req.user?.id);
    }
    async deletePlaybookItem(dealId, itemId) {
        await this.playbookService.deletePlaybookItem(dealId, itemId);
        return { message: 'Playbook item deleted successfully' };
    }
    async initializeMEDDICC(dealId) {
        return this.playbookService.initializeMEDDICC(dealId);
    }
    async initializeBANT(dealId) {
        return this.playbookService.initializeBANT(dealId);
    }
    async generateAISuggestions(dealId, dto) {
        return this.playbookService.generateAISuggestions(dealId, dto.type);
    }
};
exports.DealPlaybookController = DealPlaybookController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get playbook for a deal',
        description: 'Retrieve playbook items (MEDDICC, BANT, or CUSTOM) for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        description: 'Playbook type filter',
        enum: playbook_dto_1.PlaybookType,
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Playbook retrieved successfully',
        type: [playbook_dto_1.PlaybookSummaryDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof playbook_dto_1.PlaybookType !== "undefined" && playbook_dto_1.PlaybookType) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "getPlaybook", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create playbook item',
        description: 'Add a new item to the deal playbook',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Playbook item created successfully',
        type: playbook_dto_1.PlaybookItemResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof playbook_dto_1.CreatePlaybookItemDto !== "undefined" && playbook_dto_1.CreatePlaybookItemDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "createPlaybookItem", null);
__decorate([
    (0, common_1.Patch)('items/:itemId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update playbook item',
        description: 'Update status, notes, or AI suggestions for a playbook item',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'itemId',
        description: 'Playbook item ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Playbook item updated successfully',
        type: playbook_dto_1.PlaybookItemResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Playbook item not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_d = typeof playbook_dto_1.UpdatePlaybookItemDto !== "undefined" && playbook_dto_1.UpdatePlaybookItemDto) === "function" ? _d : Object, typeof (_e = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "updatePlaybookItem", null);
__decorate([
    (0, common_1.Delete)('items/:itemId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete playbook item',
        description: 'Remove a playbook item from the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'itemId',
        description: 'Playbook item ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Playbook item deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Playbook item not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "deletePlaybookItem", null);
__decorate([
    (0, common_1.Post)('initialize/meddicc'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initialize MEDDICC playbook',
        description: 'Create a MEDDICC playbook with all 7 criteria for the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'MEDDICC playbook initialized successfully',
        type: playbook_dto_1.PlaybookSummaryDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'MEDDICC playbook already exists',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "initializeMEDDICC", null);
__decorate([
    (0, common_1.Post)('initialize/bant'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initialize BANT playbook',
        description: 'Create a BANT playbook with all 4 criteria for the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'BANT playbook initialized successfully',
        type: playbook_dto_1.PlaybookSummaryDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'BANT playbook already exists',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "initializeBANT", null);
__decorate([
    (0, common_1.Post)('suggestions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate AI suggestions',
        description: 'Generate AI-powered suggestions for playbook items',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'AI suggestions generated successfully',
        type: playbook_dto_1.PlaybookSummaryDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal or playbook not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof playbook_dto_1.GeneratePlaybookSuggestionsDto !== "undefined" && playbook_dto_1.GeneratePlaybookSuggestionsDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], DealPlaybookController.prototype, "generateAISuggestions", null);
exports.DealPlaybookController = DealPlaybookController = __decorate([
    (0, swagger_1.ApiTags)('Deal Playbooks'),
    (0, common_1.Controller)('deals/:dealId/playbook'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof deal_playbook_service_1.DealPlaybookService !== "undefined" && deal_playbook_service_1.DealPlaybookService) === "function" ? _a : Object])
], DealPlaybookController);
//# sourceMappingURL=deal-playbook.controller.js.map
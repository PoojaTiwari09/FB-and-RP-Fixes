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
exports.DealActivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_activity_service_1 = require("@/services/deal-activity.service");
const activity_dto_1 = require("@/schemas/activity.dto");
const auth_guard_1 = require("@/guards/auth.guard");
let DealActivityController = class DealActivityController {
    activityService;
    constructor(activityService) {
        this.activityService = activityService;
    }
    async getTimeline(dealId, query) {
        return this.activityService.getTimeline(dealId, query);
    }
    async getActivities(dealId, query) {
        return this.activityService.getActivities(dealId, query);
    }
    async getActivity(dealId, activityId) {
        return this.activityService.getActivity(dealId, activityId);
    }
    async createActivity(dealId, dto, req) {
        return this.activityService.createActivity(dealId, dto, req.user?.id, req.user?.email);
    }
    async updateActivity(dealId, activityId, dto) {
        return this.activityService.updateActivity(dealId, activityId, dto);
    }
    async deleteActivity(dealId, activityId) {
        await this.activityService.deleteActivity(dealId, activityId);
        return { message: 'Activity deleted successfully' };
    }
};
exports.DealActivityController = DealActivityController;
__decorate([
    (0, common_1.Get)('timeline'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get activity timeline',
        description: 'Get activity timeline with statistics for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity timeline retrieved successfully',
        type: activity_dto_1.ActivityTimelineDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, activity_dto_1.ActivityQueryDto]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get activities',
        description: 'Get all activities for a deal with optional filtering',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activities retrieved successfully',
        type: [activity_dto_1.ActivityResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, activity_dto_1.ActivityQueryDto]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "getActivities", null);
__decorate([
    (0, common_1.Get)(':activityId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get activity',
        description: 'Get a single activity by ID',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'activityId',
        description: 'Activity ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity retrieved successfully',
        type: activity_dto_1.ActivityResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Activity not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create activity',
        description: 'Create a new activity for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Activity created successfully',
        type: activity_dto_1.ActivityResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, activity_dto_1.CreateActivityDto, Object]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "createActivity", null);
__decorate([
    (0, common_1.Patch)(':activityId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update activity',
        description: 'Update an existing activity',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'activityId',
        description: 'Activity ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity updated successfully',
        type: activity_dto_1.ActivityResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Activity not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('activityId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, activity_dto_1.UpdateActivityDto]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "updateActivity", null);
__decorate([
    (0, common_1.Delete)(':activityId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete activity',
        description: 'Delete an activity',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'activityId',
        description: 'Activity ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Activity not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealActivityController.prototype, "deleteActivity", null);
exports.DealActivityController = DealActivityController = __decorate([
    (0, swagger_1.ApiTags)('Deal Activities'),
    (0, common_1.Controller)('deals/:dealId/activities'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [deal_activity_service_1.DealActivityService])
], DealActivityController);
//# sourceMappingURL=deal-activity.controller.js.map
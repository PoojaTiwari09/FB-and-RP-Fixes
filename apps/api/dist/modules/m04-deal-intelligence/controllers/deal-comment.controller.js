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
exports.DealCommentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_comment_service_1 = require("@m04/services/deal-comment.service");
const comment_dto_1 = require("@m04/schemas/comment.dto");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
let DealCommentController = class DealCommentController {
    commentService;
    constructor(commentService) {
        this.commentService = commentService;
    }
    async getCommentsForDeal(dealId, coachingOnly) {
        return this.commentService.getCommentsForDeal(dealId, coachingOnly);
    }
    async getCoachingComments(dealId) {
        return this.commentService.getCoachingComments(dealId);
    }
    async getComment(dealId, commentId) {
        return this.commentService.getComment(dealId, commentId);
    }
    async createComment(dealId, dto, req) {
        return this.commentService.createComment(dealId, dto, req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role);
    }
    async updateComment(dealId, commentId, dto, req) {
        return this.commentService.updateComment(dealId, commentId, dto, req.user.id);
    }
    async deleteComment(dealId, commentId, req) {
        await this.commentService.deleteComment(dealId, commentId, req.user.id);
        return { message: 'Comment deleted successfully' };
    }
};
exports.DealCommentController = DealCommentController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get comments for a deal',
        description: 'Retrieve all comments for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'coachingOnly',
        description: 'Filter to show only coaching comments',
        required: false,
        type: Boolean,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Comments retrieved successfully',
        type: [comment_dto_1.CommentResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)('coachingOnly', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "getCommentsForDeal", null);
__decorate([
    (0, common_1.Get)('coaching'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get coaching comments',
        description: 'Retrieve only coaching comments for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching comments retrieved successfully',
        type: [comment_dto_1.CommentResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "getCoachingComments", null);
__decorate([
    (0, common_1.Get)(':commentId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single comment',
        description: 'Retrieve details of a specific comment',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'commentId',
        description: 'Comment ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Comment retrieved successfully',
        type: comment_dto_1.CommentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Comment not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "getComment", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a comment',
        description: 'Add a new comment to a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Comment created successfully',
        type: comment_dto_1.CommentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof comment_dto_1.CreateCommentDto !== "undefined" && comment_dto_1.CreateCommentDto) === "function" ? _b : Object, typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "createComment", null);
__decorate([
    (0, common_1.Patch)(':commentId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a comment',
        description: 'Edit a comment (only by the author)',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'commentId',
        description: 'Comment ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Comment updated successfully',
        type: comment_dto_1.CommentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'You can only edit your own comments',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Comment not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('commentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_d = typeof comment_dto_1.UpdateCommentDto !== "undefined" && comment_dto_1.UpdateCommentDto) === "function" ? _d : Object, typeof (_e = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "updateComment", null);
__decorate([
    (0, common_1.Delete)(':commentId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a comment',
        description: 'Remove a comment (only by the author)',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'commentId',
        description: 'Comment ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Comment deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'You can only delete your own comments',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Comment not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('commentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], DealCommentController.prototype, "deleteComment", null);
exports.DealCommentController = DealCommentController = __decorate([
    (0, swagger_1.ApiTags)('Deal Comments'),
    (0, common_1.Controller)('deals/:dealId/comments'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof deal_comment_service_1.DealCommentService !== "undefined" && deal_comment_service_1.DealCommentService) === "function" ? _a : Object])
], DealCommentController);
//# sourceMappingURL=deal-comment.controller.js.map
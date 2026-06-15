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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealCommentService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const deal_comment_entity_1 = require("@m04/entities/deal-comment.entity");
const deal_entity_1 = require("@m04/entities/deal.entity");
let DealCommentService = class DealCommentService {
    commentRepository;
    dealRepository;
    constructor(commentRepository, dealRepository) {
        this.commentRepository = commentRepository;
        this.dealRepository = dealRepository;
    }
    async getCommentsForDeal(dealId, coachingOnly) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const queryBuilder = this.commentRepository
            .createQueryBuilder('comment')
            .where('comment.dealId = :dealId', { dealId });
        if (coachingOnly) {
            queryBuilder.andWhere('comment.isCoaching = :isCoaching', { isCoaching: true });
        }
        const comments = await queryBuilder
            .orderBy('comment.createdAt', 'DESC')
            .getMany();
        return comments.map((comment) => this.toResponseDto(comment));
    }
    async getComment(dealId, commentId) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, dealId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        return this.toResponseDto(comment);
    }
    async createComment(dealId, dto, authorId, authorName, authorRole) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const comment = this.commentRepository.create({
            dealId,
            content: dto.content,
            userId: authorId,
            authorName,
            authorRole,
            isCoaching: dto.isCoaching || false,
            isEdited: false,
        });
        const saved = await this.commentRepository.save(comment);
        return this.toResponseDto(saved);
    }
    async updateComment(dealId, commentId, dto, userId) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, dealId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.userId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own comments');
        }
        comment.content = dto.content;
        comment.isEdited = true;
        comment.editedAt = new Date();
        const updated = await this.commentRepository.save(comment);
        return this.toResponseDto(updated);
    }
    async deleteComment(dealId, commentId, userId) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId, dealId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.commentRepository.remove(comment);
    }
    async getCoachingComments(dealId) {
        return this.getCommentsForDeal(dealId, true);
    }
    toResponseDto(comment) {
        return {
            id: comment.id,
            dealId: comment.dealId,
            content: comment.content,
            authorId: comment.userId,
            authorName: comment.authorName,
            authorRole: comment.authorRole,
            isCoaching: comment.isCoaching,
            isEdited: comment.isEdited,
            editedAt: comment.editedAt,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }
};
exports.DealCommentService = DealCommentService;
exports.DealCommentService = DealCommentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_comment_entity_1.DealComment)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, typeof (_b = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _b : Object])
], DealCommentService);
//# sourceMappingURL=deal-comment.service.js.map
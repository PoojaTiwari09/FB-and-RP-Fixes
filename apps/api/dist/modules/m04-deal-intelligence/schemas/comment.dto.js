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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentResponseDto = exports.UpdateCommentDto = exports.CreateCommentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateCommentDto {
    content;
    isCoaching;
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comment content',
        example: 'Customer is very interested in the enterprise plan',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Is this a coaching comment from a manager',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCommentDto.prototype, "isCoaching", void 0);
class UpdateCommentDto {
    content;
}
exports.UpdateCommentDto = UpdateCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comment content',
        example: 'Customer is very interested in the enterprise plan',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateCommentDto.prototype, "content", void 0);
class CommentResponseDto {
    id;
    dealId;
    content;
    authorId;
    authorName;
    authorRole;
    isCoaching;
    isEdited;
    editedAt;
    createdAt;
    updatedAt;
}
exports.CommentResponseDto = CommentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comment ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comment content',
        example: 'Customer is very interested in the enterprise plan',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "authorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author name',
        example: 'John Doe',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "authorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Author role',
        example: 'MANAGER',
    }),
    __metadata("design:type", String)
], CommentResponseDto.prototype, "authorRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is this a coaching comment',
        example: false,
    }),
    __metadata("design:type", Boolean)
], CommentResponseDto.prototype, "isCoaching", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is the comment edited',
        example: false,
    }),
    __metadata("design:type", Boolean)
], CommentResponseDto.prototype, "isEdited", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Edited at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CommentResponseDto.prototype, "editedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CommentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Updated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CommentResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=comment.dto.js.map
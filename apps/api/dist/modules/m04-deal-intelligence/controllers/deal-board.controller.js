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
exports.DealBoardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_board_service_1 = require("@/services/deal-board.service");
const schemas_1 = require("@/schemas");
const auth_guard_1 = require("@/guards/auth.guard");
const roles_guard_1 = require("@/guards/roles.guard");
const roles_decorator_1 = require("@/decorators/roles.decorator");
const user_role_enum_1 = require("@/interfaces/user-role.enum");
let DealBoardController = class DealBoardController {
    boardService;
    constructor(boardService) {
        this.boardService = boardService;
    }
    async createBoard(dto, req) {
        return this.boardService.createBoard(dto, req.user.id, req.user.role);
    }
    async listBoards(query, req) {
        return this.boardService.listBoards(query, req.user.id, req.user.role);
    }
    async getBoardById(id, req) {
        return this.boardService.getBoardById(id, req.user.id, req.user.role);
    }
    async updateBoard(id, dto, req) {
        return this.boardService.updateBoard(id, dto, req.user.id, req.user.role);
    }
    async deleteBoard(id, req) {
        return this.boardService.deleteBoard(id, req.user.id, req.user.role);
    }
    async publishBoard(id, req) {
        return this.boardService.publishBoard(id, req.user.id, req.user.role);
    }
    async unpublishBoard(id, req) {
        return this.boardService.unpublishBoard(id, req.user.id, req.user.role);
    }
};
exports.DealBoardController = DealBoardController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new deal board' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Board created successfully',
        type: schemas_1.BoardResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CONFLICT, description: 'Board name already exists' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Invalid input data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schemas_1.CreateBoardDto, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "createBoard", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all accessible deal boards' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Boards retrieved successfully',
        type: schemas_1.PaginatedBoardResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schemas_1.QueryBoardDto, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "listBoards", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get board by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Board ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Board retrieved successfully',
        type: schemas_1.BoardResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Board not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "getBoardById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update board configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Board ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Board updated successfully',
        type: schemas_1.BoardResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Board not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied or board is locked' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CONFLICT, description: 'Board name already exists' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schemas_1.UpdateBoardDto, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "updateBoard", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a board' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Board ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT, description: 'Board deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Board not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "deleteBoard", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a board' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Board ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Board published successfully',
        type: schemas_1.BoardResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Board not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Board is already published' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "publishBoard", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Unpublish a board' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Board ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Board unpublished successfully',
        type: schemas_1.BoardResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Board not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Board is not published' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealBoardController.prototype, "unpublishBoard", null);
exports.DealBoardController = DealBoardController = __decorate([
    (0, swagger_1.ApiTags)('Deal Boards'),
    (0, common_1.Controller)('boards'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [deal_board_service_1.DealBoardService])
], DealBoardController);
//# sourceMappingURL=deal-board.controller.js.map
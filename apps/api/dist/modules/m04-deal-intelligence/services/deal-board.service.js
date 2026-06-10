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
exports.DealBoardService = void 0;
const common_1 = require("@nestjs/common");
const deal_board_repository_1 = require("@/repositories/deal-board.repository");
const audit_log_service_1 = require("./audit-log.service");
const entities_1 = require("@/entities");
let DealBoardService = class DealBoardService {
    boardRepository;
    auditLogService;
    constructor(boardRepository, auditLogService) {
        this.boardRepository = boardRepository;
        this.auditLogService = auditLogService;
    }
    async createBoard(dto, userId, userRole) {
        const nameExists = await this.boardRepository.checkNameExists(dto.name);
        if (nameExists) {
            throw new common_1.ConflictException(`Board with name "${dto.name}" already exists`);
        }
        if (!dto.filters || dto.filters.length === 0) {
            throw new common_1.BadRequestException('At least one filter is required');
        }
        if (!dto.tabs || dto.tabs.length === 0) {
            throw new common_1.BadRequestException('At least one tab is required');
        }
        if (!dto.columns || dto.columns.length === 0) {
            throw new common_1.BadRequestException('At least one column is required');
        }
        const board = await this.boardRepository.create({
            name: dto.name,
            description: dto.description,
            audience: dto.audience,
            ownerId: userId,
            isLocked: dto.isLocked ?? false,
            allowRepColumnReorder: dto.allowRepColumnReorder ?? false,
            preventManualDealOverride: dto.preventManualDealOverride ?? true,
            status: entities_1.BoardStatus.DRAFT,
        });
        await this.boardRepository.createFilters(board.id, dto.filters);
        await this.boardRepository.createTabs(board.id, dto.tabs);
        await this.boardRepository.createColumns(board.id, dto.columns);
        const permissionsWithGrantedBy = dto.permissions.map((p) => ({
            ...p,
            grantedBy: userId,
        }));
        await this.boardRepository.createPermissions(board.id, permissionsWithGrantedBy);
        await this.auditLogService.log({
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: board.id,
            action: entities_1.AuditAction.CREATE,
            userId,
            changesAfter: { name: board.name, status: board.status },
        });
        return this.getBoardById(board.id, userId, userRole);
    }
    async getBoardById(id, userId, userRole) {
        const board = await this.boardRepository.findByIdWithRelations(id);
        if (!board) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found`);
        }
        const userPermission = await this.boardRepository.getUserPermission(id, userId, userRole);
        if (userPermission === null) {
            throw new common_1.ForbiddenException('You do not have access to this board');
        }
        return {
            ...this.mapToResponseDto(board),
            userPermission,
        };
    }
    async listBoards(query, userId, userRole) {
        const { page = 1, limit = 25, audience, status, search, accessibleOnly = true } = query;
        let boards;
        let total;
        if (accessibleOnly) {
            [boards, total] = await this.boardRepository.findAccessibleBoards(userId, { audience, status, search }, page, limit, userRole);
        }
        else {
            [boards, total] = await this.boardRepository.findAll({
                ...(audience && { audience }),
                ...(status && { status }),
            }, page, limit);
        }
        const boardsWithPermissions = await Promise.all(boards.map(async (board) => {
            const userPermission = await this.boardRepository.getUserPermission(board.id, userId, userRole);
            return {
                ...board,
                userPermission,
            };
        }));
        return {
            data: boardsWithPermissions.map(this.mapToListItemDto),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updateBoard(id, dto, userId, userRole) {
        const board = await this.boardRepository.findByIdWithRelations(id);
        if (!board) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found`);
        }
        const hasEditAccess = await this.boardRepository.hasEditAccess(id, userId, userRole);
        if (!hasEditAccess) {
            throw new common_1.ForbiddenException('You do not have permission to edit this board');
        }
        if (board.isLocked) {
            throw new common_1.ForbiddenException('This board is locked and cannot be edited');
        }
        if (dto.name && dto.name !== board.name) {
            const nameExists = await this.boardRepository.checkNameExists(dto.name, id);
            if (nameExists) {
                throw new common_1.ConflictException(`Board with name "${dto.name}" already exists`);
            }
        }
        const changesBefore = { ...board };
        if (dto.name || dto.description || dto.audience || dto.isLocked !== undefined) {
            await this.boardRepository.update(id, {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.audience && { audience: dto.audience }),
                ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
                ...(dto.allowRepColumnReorder !== undefined && {
                    allowRepColumnReorder: dto.allowRepColumnReorder,
                }),
                ...(dto.preventManualDealOverride !== undefined && {
                    preventManualDealOverride: dto.preventManualDealOverride,
                }),
            });
        }
        if (dto.filters) {
            await this.boardRepository.updateFilters(id, dto.filters);
        }
        if (dto.tabs) {
            await this.boardRepository.updateTabs(id, dto.tabs);
        }
        if (dto.columns) {
            await this.boardRepository.updateColumns(id, dto.columns);
        }
        if (dto.permissions) {
            const permissionsWithGrantedBy = dto.permissions.map((p) => ({
                ...p,
                grantedBy: userId,
            }));
            await this.boardRepository.updatePermissions(id, permissionsWithGrantedBy);
        }
        const updatedBoard = await this.boardRepository.findByIdWithRelations(id);
        if (!updatedBoard) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found after update`);
        }
        await this.auditLogService.log({
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: id,
            action: entities_1.AuditAction.UPDATE,
            userId,
            changesBefore: { name: changesBefore.name, status: changesBefore.status },
            changesAfter: { name: updatedBoard.name, status: updatedBoard.status },
        });
        return this.mapToResponseDto(updatedBoard);
    }
    async deleteBoard(id, userId, userRole) {
        const board = await this.boardRepository.findById(id);
        if (!board) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found`);
        }
        const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
        if (!hasAdminAccess) {
            throw new common_1.ForbiddenException('You do not have permission to delete this board');
        }
        await this.boardRepository.delete(id);
        await this.auditLogService.log({
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: id,
            action: entities_1.AuditAction.DELETE,
            userId,
            changesBefore: { name: board.name, status: board.status },
        });
    }
    async publishBoard(id, userId, userRole) {
        const board = await this.boardRepository.findById(id);
        if (!board) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found`);
        }
        const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
        if (!hasAdminAccess) {
            throw new common_1.ForbiddenException('You do not have permission to publish this board');
        }
        if (board.status === entities_1.BoardStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Board is already published');
        }
        await this.boardRepository.publish(id);
        await this.auditLogService.log({
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: id,
            action: entities_1.AuditAction.PUBLISH,
            userId,
            changesBefore: { status: entities_1.BoardStatus.DRAFT },
            changesAfter: { status: entities_1.BoardStatus.PUBLISHED },
        });
        return this.getBoardById(id, userId, userRole);
    }
    async unpublishBoard(id, userId, userRole) {
        const board = await this.boardRepository.findById(id);
        if (!board) {
            throw new common_1.NotFoundException(`Board with ID "${id}" not found`);
        }
        const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
        if (!hasAdminAccess) {
            throw new common_1.ForbiddenException('You do not have permission to unpublish this board');
        }
        if (board.status !== entities_1.BoardStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Board is not published');
        }
        await this.boardRepository.unpublish(id);
        await this.auditLogService.log({
            entityType: entities_1.AuditEntityType.BOARD,
            entityId: id,
            action: entities_1.AuditAction.UNPUBLISH,
            userId,
            changesBefore: { status: entities_1.BoardStatus.PUBLISHED },
            changesAfter: { status: entities_1.BoardStatus.DRAFT },
        });
        return this.getBoardById(id, userId, userRole);
    }
    mapToResponseDto(board) {
        return {
            id: board.id,
            name: board.name,
            description: board.description,
            audience: board.audience,
            status: board.status,
            ownerId: board.ownerId,
            isLocked: board.isLocked,
            allowRepColumnReorder: board.allowRepColumnReorder,
            preventManualDealOverride: board.preventManualDealOverride,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            publishedAt: board.publishedAt,
            filters: board.filters || [],
            tabs: (board.tabs || []),
            columns: (board.columns || []),
            permissions: (board.permissions || []),
        };
    }
    mapToListItemDto(board) {
        return {
            id: board.id,
            name: board.name,
            description: board.description,
            audience: board.audience,
            status: board.status,
            ownerId: board.ownerId,
            updatedAt: board.updatedAt,
            userPermission: board.userPermission,
        };
    }
};
exports.DealBoardService = DealBoardService;
exports.DealBoardService = DealBoardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deal_board_repository_1.DealBoardRepository,
        audit_log_service_1.AuditLogService])
], DealBoardService);
//# sourceMappingURL=deal-board.service.js.map
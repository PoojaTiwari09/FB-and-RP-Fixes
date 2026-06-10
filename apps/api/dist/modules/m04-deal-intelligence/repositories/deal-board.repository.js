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
exports.DealBoardRepository = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("@/entities");
const inject_repository_1 = require("../database/inject-repository");
const m04_entity_repository_1 = require("../database/m04-entity.repository");
let DealBoardRepository = class DealBoardRepository {
    boardRepository;
    filterRepository;
    tabRepository;
    columnRepository;
    permissionRepository;
    constructor(boardRepository, filterRepository, tabRepository, columnRepository, permissionRepository) {
        this.boardRepository = boardRepository;
        this.filterRepository = filterRepository;
        this.tabRepository = tabRepository;
        this.columnRepository = columnRepository;
        this.permissionRepository = permissionRepository;
    }
    async create(board) {
        const newBoard = this.boardRepository.create(board);
        return this.boardRepository.save(newBoard);
    }
    async findById(id, relations = []) {
        return this.boardRepository.findOne({
            where: { id },
            relations,
        });
    }
    async findByIdWithRelations(id) {
        return this.boardRepository.findOne({
            where: { id },
            relations: ['filters', 'tabs', 'columns', 'permissions'],
        });
    }
    async findAll(where, page = 1, limit = 25) {
        const skip = (page - 1) * limit;
        return this.boardRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { updatedAt: 'DESC' },
        });
    }
    async findAccessibleBoards(userId, filters, page = 1, limit = 25, userRole) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.boardRepository
            .createQueryBuilder('board')
            .leftJoinAndSelect('board.permissions', 'permission');
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
            queryBuilder.where('(permission.subjectId = :userId OR (board.status = :publishedStatus AND :aeAudience = ANY(board.audience)))', { userId, publishedStatus: entities_1.BoardStatus.PUBLISHED, aeAudience: entities_1.BoardAudience.AE });
        }
        if (filters.audience) {
            queryBuilder.andWhere(':audience = ANY(board.audience)', {
                audience: filters.audience,
            });
        }
        if (filters.status) {
            queryBuilder.andWhere('board.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('board.name ILIKE :search', {
                search: `%${filters.search}%`,
            });
        }
        queryBuilder.orderBy('board.updatedAt', 'DESC').skip(skip).take(limit);
        return queryBuilder.getManyAndCount();
    }
    async update(id, updates) {
        await this.boardRepository.update(id, updates);
        return this.findById(id);
    }
    async delete(id) {
        await this.boardRepository.delete(id);
    }
    async publish(id) {
        await this.boardRepository.update(id, {
            status: entities_1.BoardStatus.PUBLISHED,
            publishedAt: new Date(),
        });
        return this.findById(id);
    }
    async unpublish(id) {
        await this.boardRepository.update(id, {
            status: entities_1.BoardStatus.DRAFT,
            publishedAt: null,
        });
        return this.findById(id);
    }
    async checkNameExists(name, excludeId) {
        const query = this.boardRepository.createQueryBuilder('board').where('board.name = :name', {
            name,
        });
        if (excludeId) {
            query.andWhere('board.id != :excludeId', { excludeId });
        }
        const count = await query.getCount();
        return count > 0;
    }
    async createFilters(boardId, filters) {
        const filterEntities = filters.map((filter) => this.filterRepository.create({ ...filter, boardId }));
        return this.filterRepository.save(filterEntities);
    }
    async updateFilters(boardId, filters) {
        await this.filterRepository.delete({ boardId });
        return this.createFilters(boardId, filters);
    }
    async createTabs(boardId, tabs) {
        const tabEntities = tabs.map((tab) => this.tabRepository.create({ ...tab, boardId }));
        return this.tabRepository.save(tabEntities);
    }
    async updateTabs(boardId, tabs) {
        await this.tabRepository.delete({ boardId });
        return this.createTabs(boardId, tabs);
    }
    async createColumns(boardId, columns) {
        const columnEntities = columns.map((column) => this.columnRepository.create({ ...column, boardId }));
        return this.columnRepository.save(columnEntities);
    }
    async updateColumns(boardId, columns) {
        await this.columnRepository.delete({ boardId });
        return this.createColumns(boardId, columns);
    }
    async createPermissions(boardId, permissions) {
        const permissionEntities = permissions.map((permission) => this.permissionRepository.create({ ...permission, boardId }));
        return this.permissionRepository.save(permissionEntities);
    }
    async updatePermissions(boardId, permissions) {
        await this.permissionRepository.delete({ boardId });
        return this.createPermissions(boardId, permissions);
    }
    async getUserPermission(boardId, userId, userRole) {
        if (userRole === 'ADMIN') {
            return entities_1.PermissionRole.ADMIN;
        }
        if (userRole === 'MANAGER') {
            return entities_1.PermissionRole.ADMIN;
        }
        const permission = await this.permissionRepository.findOne({
            where: {
                boardId,
                subjectId: userId,
            },
        });
        if (permission) {
            return permission.role;
        }
        const board = await this.boardRepository.findOne({ where: { id: boardId } });
        if (board && board.status === entities_1.BoardStatus.PUBLISHED && board.audience.includes(entities_1.BoardAudience.AE)) {
            return entities_1.PermissionRole.VIEWER;
        }
        return null;
    }
    async hasAccess(boardId, userId, userRole) {
        const permission = await this.getUserPermission(boardId, userId, userRole);
        return permission !== null;
    }
    async hasEditAccess(boardId, userId, userRole) {
        const permission = await this.getUserPermission(boardId, userId, userRole);
        return permission === entities_1.PermissionRole.EDITOR || permission === entities_1.PermissionRole.ADMIN;
    }
    async hasAdminAccess(boardId, userId, userRole) {
        const permission = await this.getUserPermission(boardId, userId, userRole);
        return permission === entities_1.PermissionRole.ADMIN;
    }
};
exports.DealBoardRepository = DealBoardRepository;
exports.DealBoardRepository = DealBoardRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.DealBoard)),
    __param(1, (0, inject_repository_1.InjectRepository)(entities_1.BoardFilter)),
    __param(2, (0, inject_repository_1.InjectRepository)(entities_1.BoardTab)),
    __param(3, (0, inject_repository_1.InjectRepository)(entities_1.BoardColumn)),
    __param(4, (0, inject_repository_1.InjectRepository)(entities_1.BoardPermission)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository])
], DealBoardRepository);
//# sourceMappingURL=deal-board.repository.js.map
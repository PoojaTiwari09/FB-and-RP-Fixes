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
exports.BoardsController = void 0;
const common_1 = require("@nestjs/common");
const boards_service_1 = require("../services/boards.service");
let BoardsController = class BoardsController {
    boardsService;
    constructor(boardsService) {
        this.boardsService = boardsService;
    }
    async getAllBoards() {
        const boards = await this.boardsService.getAllBoards();
        return { boards };
    }
    async getTeam() {
        const team = await this.boardsService.getTeam();
        return { team };
    }
    async getPermissions(role) {
        const permissions = await this.boardsService.getPermissions(role);
        return { permissions };
    }
    async getBoardBySlug(slug) {
        const board = await this.boardsService.getBoardBySlug(slug);
        if (!board) {
            return { error: 'Board not found' };
        }
        return { board };
    }
    async createBoard(body) {
        const result = await this.boardsService.createBoard(body.step, body.data);
        if (body.step === 4)
            return { board: result };
        return result;
    }
    async updateBoard(slug, body) {
        const board = await this.boardsService.updateBoard(slug, body);
        return { board };
    }
    async duplicateBoard(slug) {
        const board = await this.boardsService.duplicateBoard(slug);
        return { board };
    }
    async deleteBoard(slug) {
        return this.boardsService.deleteBoard(slug);
    }
    async addColumn(slug, body) {
        const col = await this.boardsService.addColumn(slug, body);
        return { column: col };
    }
    async updateColumn(slug, colId, body) {
        const col = await this.boardsService.updateColumn(slug, colId, body);
        return { column: col };
    }
    async deleteColumn(slug, colId) {
        return this.boardsService.deleteColumn(slug, colId);
    }
    async updateBriefConfig(slug, body) {
        const board = await this.boardsService.updateBriefConfig(slug, body);
        return { board };
    }
};
exports.BoardsController = BoardsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "getAllBoards", null);
__decorate([
    (0, common_1.Get)('team'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Get)('permissions/:role'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "getBoardBySlug", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "createBoard", null);
__decorate([
    (0, common_1.Put)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "updateBoard", null);
__decorate([
    (0, common_1.Post)(':slug/duplicate'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "duplicateBoard", null);
__decorate([
    (0, common_1.Delete)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "deleteBoard", null);
__decorate([
    (0, common_1.Post)(':slug/columns'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "addColumn", null);
__decorate([
    (0, common_1.Put)(':slug/columns/:colId'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('colId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "updateColumn", null);
__decorate([
    (0, common_1.Delete)(':slug/columns/:colId'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('colId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "deleteColumn", null);
__decorate([
    (0, common_1.Patch)(':slug/brief-config'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "updateBriefConfig", null);
exports.BoardsController = BoardsController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/boards'),
    __metadata("design:paramtypes", [boards_service_1.BoardsService])
], BoardsController);
//# sourceMappingURL=boards.controller.js.map
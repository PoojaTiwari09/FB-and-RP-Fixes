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
exports.PreferencesController = void 0;
const common_1 = require("@nestjs/common");
const preferences_service_1 = require("../services/preferences.service");
let PreferencesController = class PreferencesController {
    preferencesService;
    constructor(preferencesService) {
        this.preferencesService = preferencesService;
    }
    async getLastViewedBoard(role) {
        return this.preferencesService.getLastViewedBoard(role);
    }
    async getAllPreferences(role) {
        const preferences = await this.preferencesService.getAllPreferences(role);
        return { preferences };
    }
    async upsertPreferences(role, boardId, prefs) {
        return this.preferencesService.upsertPreferences(role, boardId, prefs);
    }
    async clearPreferences(role, boardId) {
        return this.preferencesService.clearPreferences(role, boardId);
    }
};
exports.PreferencesController = PreferencesController;
__decorate([
    (0, common_1.Get)(':role/last-board'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "getLastViewedBoard", null);
__decorate([
    (0, common_1.Get)(':role'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "getAllPreferences", null);
__decorate([
    (0, common_1.Put)(':role/:boardId'),
    __param(0, (0, common_1.Param)('role')),
    __param(1, (0, common_1.Param)('boardId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "upsertPreferences", null);
__decorate([
    (0, common_1.Delete)(':role'),
    __param(0, (0, common_1.Param)('role')),
    __param(1, (0, common_1.Query)('board_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "clearPreferences", null);
exports.PreferencesController = PreferencesController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/preferences'),
    __metadata("design:paramtypes", [preferences_service_1.PreferencesService])
], PreferencesController);
//# sourceMappingURL=preferences.controller.js.map
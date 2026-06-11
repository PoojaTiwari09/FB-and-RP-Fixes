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
exports.M04TestController = void 0;
const common_1 = require("@nestjs/common");
const deal_repository_1 = require("@/repositories/deal.repository");
const deal_board_repository_1 = require("@/repositories/deal-board.repository");
const m04_memory_store_1 = require("../database/m04-memory.store");
const jwt_guard_1 = require("../interfaces/jwt.guard");
let M04TestController = class M04TestController {
    deals;
    boards;
    store;
    constructor(deals, boards, store) {
        this.deals = deals;
        this.boards = boards;
        this.store = store;
    }
    health() {
        return {
            success: true,
            storage: 'memory',
            counts: {
                deals: this.store.deals.size,
                boards: this.store.boards.size,
                users: this.store.users.size,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async smoke() {
        const [deals] = await this.deals.findAll({}, 1, 10);
        const [boards] = await this.boards.findAll({}, 1, 10);
        const deal = deals[0] ? await this.deals.findById(deals[0].id) : null;
        return {
            success: true,
            dealCount: deals.length,
            boardCount: boards.length,
            sampleDealId: deal?.id,
            devUserId: m04_memory_store_1.M04_DEV_USER,
        };
    }
};
exports.M04TestController = M04TestController;
__decorate([
    (0, jwt_guard_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M04TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('smoke'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M04TestController.prototype, "smoke", null);
exports.M04TestController = M04TestController = __decorate([
    (0, common_1.Controller)('m04-test'),
    __metadata("design:paramtypes", [deal_repository_1.DealRepository,
        deal_board_repository_1.DealBoardRepository,
        m04_memory_store_1.M04MemoryStore])
], M04TestController);
//# sourceMappingURL=m04-test.controller.js.map
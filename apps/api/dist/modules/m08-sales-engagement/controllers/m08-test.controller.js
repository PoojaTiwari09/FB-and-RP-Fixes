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
exports.M08TestController = void 0;
const common_1 = require("@nestjs/common");
let M08TestController = class M08TestController {
    health() {
        return { success: true, module: 'm08-sales-engagement', status: 'ok' };
    }
    smoke() {
        return {
            success: true,
            module: 'm08-sales-engagement',
            checks: ['routes', 'prisma', 'queues', 'events'],
        };
    }
};
exports.M08TestController = M08TestController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M08TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('smoke'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M08TestController.prototype, "smoke", null);
exports.M08TestController = M08TestController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement/test')
], M08TestController);
//# sourceMappingURL=m08-test.controller.js.map
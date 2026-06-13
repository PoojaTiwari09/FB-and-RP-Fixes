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
exports.M05AccountIntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../platform-core/decorators/public.decorator");
const m05_env_1 = require("../config/m05-env");
let M05AccountIntelligenceController = class M05AccountIntelligenceController {
    getModuleInfo() {
        return {
            module: 'm05-account-intelligence',
            enabled: (0, m05_env_1.getM05Enabled)(),
            version: '1.0.0',
            routes: {
                accounts: '/api/v1/account-intelligence/accounts',
                boards: '/api/v1/account-intelligence/boards',
                webhooks: '/api/v1/account-intelligence/webhooks/hubspot',
                health: '/api/v1/account-intelligence/test/health',
            },
        };
    }
};
exports.M05AccountIntelligenceController = M05AccountIntelligenceController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M05AccountIntelligenceController.prototype, "getModuleInfo", null);
exports.M05AccountIntelligenceController = M05AccountIntelligenceController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('api/v1/account-intelligence')
], M05AccountIntelligenceController);
//# sourceMappingURL=m05.controller.js.map
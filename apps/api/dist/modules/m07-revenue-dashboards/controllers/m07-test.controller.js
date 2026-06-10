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
exports.M07TestController = void 0;
const common_1 = require("@nestjs/common");
let M07TestController = class M07TestController {
    health() {
        return {
            success: true,
            module: 'm07-revenue-dashboards',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    smoke() {
        return {
            success: true,
            module: 'm07-revenue-dashboards',
            checks: ['health', 'sample_dashboard', 'widget_catalog'],
            endpoints: {
                sampleDashboard: '/api/v1/revenue-dashboards/sample-dashboard',
                widgetCatalog: '/api/v1/revenue-dashboards/widgets/catalog',
            },
        };
    }
};
exports.M07TestController = M07TestController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07TestController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('smoke'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M07TestController.prototype, "smoke", null);
exports.M07TestController = M07TestController = __decorate([
    (0, common_1.Controller)('api/v1/revenue-dashboards/test')
], M07TestController);
//# sourceMappingURL=m07-test.controller.js.map
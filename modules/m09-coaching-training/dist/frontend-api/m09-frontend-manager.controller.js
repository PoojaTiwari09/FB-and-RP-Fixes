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
exports.M09FrontendManagerController = void 0;
const common_1 = require("@nestjs/common");
const m09_frontend_auth_guard_1 = require("./m09-frontend-auth.guard");
const m09_frontend_trainings_service_1 = require("./m09-frontend-trainings.service");
let M09FrontendManagerController = class M09FrontendManagerController {
    constructor(svc) {
        this.svc = svc;
    }
    dashboard(req) {
        return this.svc.getManagerDashboard(req.orgId);
    }
    create(body, req) {
        return this.svc.createManagerTraining(body, req.orgId);
    }
    reassign(trainingId, body, req) {
        return this.svc.reassignTraining(trainingId, body, req.orgId);
    }
};
exports.M09FrontendManagerController = M09FrontendManagerController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M09FrontendManagerController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendManagerController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':trainingId/reassign'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendManagerController.prototype, "reassign", null);
exports.M09FrontendManagerController = M09FrontendManagerController = __decorate([
    (0, common_1.Controller)('api/manager/trainings'),
    (0, common_1.UseGuards)(m09_frontend_auth_guard_1.M09FrontendAuthGuard),
    __metadata("design:paramtypes", [m09_frontend_trainings_service_1.M09FrontendTrainingsService])
], M09FrontendManagerController);
//# sourceMappingURL=m09-frontend-manager.controller.js.map
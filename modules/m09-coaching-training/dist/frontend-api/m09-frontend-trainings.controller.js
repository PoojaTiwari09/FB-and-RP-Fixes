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
exports.M09FrontendTrainingsController = void 0;
const common_1 = require("@nestjs/common");
const m09_frontend_auth_guard_1 = require("./m09-frontend-auth.guard");
const m09_frontend_trainings_service_1 = require("./m09-frontend-trainings.service");
let M09FrontendTrainingsController = class M09FrontendTrainingsController {
    constructor(svc) {
        this.svc = svc;
    }
    list(status, req) {
        return this.svc.listTrainings(req.user.id, req.orgId, status);
    }
    getSetup(trainingId, req) {
        return this.svc.getTraining(trainingId, req.orgId);
    }
    getTraining(trainingId, req) {
        return this.svc.getTraining(trainingId, req.orgId);
    }
    start(trainingId, body, req) {
        return this.svc.startSession(trainingId, body, req.user.id, req.orgId);
    }
    getSession(trainingId, sessionId, req) {
        return this.svc.getSession(trainingId, sessionId, req.orgId);
    }
    sendMessage(trainingId, sessionId, body, req) {
        return this.svc.sendMessage(trainingId, sessionId, body, req.orgId);
    }
    pause(trainingId, sessionId, req) {
        return this.svc.pauseSession(trainingId, sessionId, req.orgId);
    }
    resume(trainingId, sessionId, req) {
        return this.svc.resumeSession(trainingId, sessionId, req.orgId);
    }
    end(trainingId, sessionId, req) {
        return this.svc.endSession(trainingId, sessionId, req.orgId);
    }
    results(trainingId, sessionId, req) {
        return this.svc.getResults(trainingId, sessionId, req.orgId);
    }
};
exports.M09FrontendTrainingsController = M09FrontendTrainingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':trainingId/setup'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "getSetup", null);
__decorate([
    (0, common_1.Get)(':trainingId'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "getTraining", null);
__decorate([
    (0, common_1.Post)(':trainingId/sessions'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "start", null);
__decorate([
    (0, common_1.Get)(':trainingId/sessions/:sessionId'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)(':trainingId/sessions/:sessionId/messages'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)(':trainingId/sessions/:sessionId/pause'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "pause", null);
__decorate([
    (0, common_1.Patch)(':trainingId/sessions/:sessionId/resume'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)(':trainingId/sessions/:sessionId/end'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "end", null);
__decorate([
    (0, common_1.Get)(':trainingId/sessions/:sessionId/results'),
    __param(0, (0, common_1.Param)('trainingId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], M09FrontendTrainingsController.prototype, "results", null);
exports.M09FrontendTrainingsController = M09FrontendTrainingsController = __decorate([
    (0, common_1.Controller)('api/trainings'),
    (0, common_1.UseGuards)(m09_frontend_auth_guard_1.M09FrontendAuthGuard),
    __metadata("design:paramtypes", [m09_frontend_trainings_service_1.M09FrontendTrainingsService])
], M09FrontendTrainingsController);
//# sourceMappingURL=m09-frontend-trainings.controller.js.map
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
exports.M02FrontendStreamsController = exports.M02FrontendCallsActionsController = exports.M02FrontendFiltersController = exports.M02FrontendSearchController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m02_frontend_search_service_1 = require("../services/m02-frontend-search.service");
const m02_frontend_search_schema_1 = require("../schemas/m02-frontend-search.schema");
let M02FrontendSearchController = class M02FrontendSearchController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    searchCalls(query, req) {
        return this.svc.searchCalls(req.tenantId, query);
    }
    getCallDrawer(callId, req) {
        return this.svc.getCallDrawer(req.tenantId, callId);
    }
    getFilterOptionsAlias() {
        return this.svc.getFilterOptions();
    }
};
exports.M02FrontendSearchController = M02FrontendSearchController;
__decorate([
    (0, common_1.Get)('calls'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendSearchController.prototype, "searchCalls", null);
__decorate([
    (0, common_1.Get)('calls/:callId'),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendSearchController.prototype, "getCallDrawer", null);
__decorate([
    (0, common_1.Get)('options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M02FrontendSearchController.prototype, "getFilterOptionsAlias", null);
exports.M02FrontendSearchController = M02FrontendSearchController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/search'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_search_service_1.M02FrontendSearchService])
], M02FrontendSearchController);
let M02FrontendFiltersController = class M02FrontendFiltersController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    getFilterOptions() {
        return this.svc.getFilterOptions();
    }
    async getTeams(req) {
        return this.svc.getTeams(req.tenantId);
    }
};
exports.M02FrontendFiltersController = M02FrontendFiltersController;
__decorate([
    (0, common_1.Get)('options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M02FrontendFiltersController.prototype, "getFilterOptions", null);
__decorate([
    (0, common_1.Get)('teams'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M02FrontendFiltersController.prototype, "getTeams", null);
exports.M02FrontendFiltersController = M02FrontendFiltersController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/filters'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_search_service_1.M02FrontendSearchService])
], M02FrontendFiltersController);
let M02FrontendCallsActionsController = class M02FrontendCallsActionsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    aiAsk(body, req) {
        const dto = m02_frontend_search_schema_1.M02AiAskBodySchema.parse(body);
        return this.svc.aiAsk(req.tenantId, dto);
    }
    startExport(body, req) {
        m02_frontend_search_schema_1.M02ExportBodySchema.parse(body);
        return this.svc.startExport(req.tenantId, body);
    }
};
exports.M02FrontendCallsActionsController = M02FrontendCallsActionsController;
__decorate([
    (0, common_1.Post)('ai-ask'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallsActionsController.prototype, "aiAsk", null);
__decorate([
    (0, common_1.Post)('export'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendCallsActionsController.prototype, "startExport", null);
exports.M02FrontendCallsActionsController = M02FrontendCallsActionsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/calls'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_search_service_1.M02FrontendSearchService])
], M02FrontendCallsActionsController);
let M02FrontendStreamsController = class M02FrontendStreamsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    createStream(body, req) {
        const dto = m02_frontend_search_schema_1.M02CreateStreamBodySchema.parse(body);
        return this.svc.createStream(req.tenantId, dto);
    }
};
exports.M02FrontendStreamsController = M02FrontendStreamsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M02FrontendStreamsController.prototype, "createStream", null);
exports.M02FrontendStreamsController = M02FrontendStreamsController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/streams'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m02_frontend_search_service_1.M02FrontendSearchService])
], M02FrontendStreamsController);
//# sourceMappingURL=m02-frontend-search.controller.js.map
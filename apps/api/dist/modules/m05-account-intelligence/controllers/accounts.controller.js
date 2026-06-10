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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("../services/accounts.service");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
let AccountsController = class AccountsController {
    accountsService;
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    async getAccounts(req, board_slug, tab_id, rep_id, period, sort_field, sort_dir, page, page_size) {
        if (!board_slug) {
            return { error: 'board_slug is required' };
        }
        return this.accountsService.getAccounts(req.tenantId, {
            board_slug,
            tab_id,
            rep_id: rep_id || (req.userRole === 'sales_rep' ? req.userId : undefined),
            period,
            sort_field,
            sort_dir,
            page: page ? parseInt(page) : 1,
            page_size: page_size ? parseInt(page_size) : 20,
        }, req.userId, req.userRole);
    }
    async getEngagementGap(req, board_slug, days) {
        if (!board_slug)
            return { error: 'board_slug is required' };
        return this.accountsService.getEngagementGap(board_slug, days ? parseInt(days) : 21);
    }
    async getSparklines(req, board_slug, hubspot_ids) {
        if (!board_slug)
            return { error: 'board_slug is required' };
        const ids = hubspot_ids ? hubspot_ids.split(',').map(s => s.trim()) : [];
        return this.accountsService.getSparklineData(board_slug, ids);
    }
    async getAccountDetail(req, hubspotId) {
        return this.accountsService.getAccountDetail(hubspotId);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('board_slug')),
    __param(2, (0, common_1.Query)('tab_id')),
    __param(3, (0, common_1.Query)('rep_id')),
    __param(4, (0, common_1.Query)('period')),
    __param(5, (0, common_1.Query)('sort_field')),
    __param(6, (0, common_1.Query)('sort_dir')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('page_size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)('engagement-gap'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('board_slug')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getEngagementGap", null);
__decorate([
    (0, common_1.Get)('sparklines'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('board_slug')),
    __param(2, (0, common_1.Query)('hubspot_ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getSparklines", null);
__decorate([
    (0, common_1.Get)(':hubspotId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('hubspotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getAccountDetail", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/accounts'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map
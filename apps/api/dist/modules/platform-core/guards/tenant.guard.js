"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantGuard = void 0;
const common_1 = require("@nestjs/common");
const role_mapper_1 = require("../auth/role-mapper");
let TenantGuard = class TenantGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        console.log(`[TenantGuard] Path: ${request.url}, Headers:`, request.headers);
        const allowDevHeaders = process.env.ALLOW_DEV_HEADER_AUTH === 'true';
        const headerTenant = allowDevHeaders ? request.headers?.['x-tenant-id'] : undefined;
        const userTenant = request.user?.tenantId;
        const tenantId = userTenant || headerTenant;
        if (!tenantId || typeof tenantId !== 'string') {
            throw new common_1.UnauthorizedException('Missing tenant context. Authenticate with a valid Bearer token.');
        }
        request.tenantId = tenantId;
        request.tenantid = tenantId;
        request.userId = request.user?.sub ?? request.user?.id ?? 'anonymous';
        request.userName = request.user?.name;
        request.backendRole = request.user?.role ?? 'SALES_REP';
        request.userRole = (0, role_mapper_1.toFrontendRole)((request.user?.role ?? 'SALES_REP'));
        if (request.user?.tenantId && !request.tenantId) {
            request.tenantId = request.user.tenantId;
            request.tenantid = request.user.tenantId;
        }
        return true;
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)()
], TenantGuard);
//# sourceMappingURL=tenant.guard.js.map
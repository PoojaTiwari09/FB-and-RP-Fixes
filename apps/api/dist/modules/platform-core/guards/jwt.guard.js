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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const public_decorator_1 = require("../decorators/public.decorator");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    reflector;
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const allowDevHeaders = process.env.ALLOW_DEV_HEADER_AUTH === 'true';
        if (allowDevHeaders) {
            const request = context.switchToHttp().getRequest();
            const tenantIdHeader = request.headers?.['x-tenant-id'] ||
                request.headers?.['X-Tenant-ID'] ||
                request.headers?.['tenant-id'];
            if (tenantIdHeader) {
                const userId = request.headers?.['x-user-id'] || '00000000-0000-0000-0000-000000000002';
                const role = request.headers?.['x-user-role'] || 'MANAGER';
                const email = request.headers?.['x-user-email'] || 'dev@company.com';
                const name = request.headers?.['x-user-name'] || 'Dev User';
                const permissions = this.permissionsForRole(role);
                request.user = {
                    sub: userId,
                    id: userId,
                    tenantId: tenantIdHeader,
                    role,
                    email,
                    name,
                    permissions,
                };
                return true;
            }
        }
        return super.canActivate(context);
    }
    permissionsForRole(role) {
        if (role === 'ADMIN' || role === 'sales_manager' || role === 'MANAGER') {
            return [
                'task.view', 'task.create', 'task.update', 'task.assign',
                'opportunity.view', 'opportunity.create', 'opportunity.update',
                'customer.view', 'customer.create', 'customer.update',
                'report.view', 'report.export', 'user.view', 'user.invite',
                'ai.query', 'ai.report',
            ];
        }
        if (role === 'ANALYST') {
            return ['report.view', 'report.export', 'ai.query', 'ai.report'];
        }
        return [
            'task.view', 'task.create', 'task.update',
            'opportunity.view', 'opportunity.create', 'opportunity.update',
            'customer.view', 'customer.create', 'customer.update', 'ai.query',
        ];
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt.guard.js.map
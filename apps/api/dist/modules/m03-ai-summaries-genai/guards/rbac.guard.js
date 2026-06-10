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
exports.RbacGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const RESEARCH_ALLOWED_ROLES = ['SALES_MANAGER', 'CRO', 'ADMIN', 'REVOPS'];
const RESEARCH_VIEW_ROLES = ['SALES_REP', 'SALES_MANAGER', 'CRO', 'ADMIN', 'REVOPS'];
let RbacGuard = class RbacGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const method = request.method;
        const path = request.path || request.url;
        if (method === 'POST' && path.includes('/research')) {
            if (!RESEARCH_ALLOWED_ROLES.includes(user.role)) {
                throw new common_1.ForbiddenException(`Role ${user.role} is not authorized to create research jobs. Required: SALES_MANAGER or above.`);
            }
        }
        if (method === 'GET' && path.includes('/research')) {
            if (!RESEARCH_VIEW_ROLES.includes(user.role)) {
                throw new common_1.ForbiddenException(`Role ${user.role} is not authorized to view research results.`);
            }
        }
        return true;
    }
};
exports.RbacGuard = RbacGuard;
exports.RbacGuard = RbacGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RbacGuard);
//# sourceMappingURL=rbac.guard.js.map
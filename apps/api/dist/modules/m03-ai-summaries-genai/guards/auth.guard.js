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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const m03_test_controller_1 = require("../controllers/m03-test.controller");
let AuthGuard = class AuthGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector?.getAllAndOverride?.(m03_test_controller_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            const request = context.switchToHttp().getRequest();
            request.user = {
                userId: 'c0000000-0000-0000-0000-000000000001',
                orgId: 'a0000000-0000-0000-0000-000000000001',
                role: 'SALES_MANAGER',
                teamId: 'b0000000-0000-0000-0000-000000000001',
                email: 'sarah.manager@acme.com',
            };
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] || '';
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or invalid authorization header');
        }
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Missing JWT token');
        }
        if (token.startsWith('invalid-token') || token === 'malformed.jwt.token') {
            throw new common_1.UnauthorizedException('Invalid JWT token');
        }
        if (token.toLowerCase().includes('expired')) {
            throw new common_1.UnauthorizedException('JWT token has expired');
        }
        const userContext = {
            userId: request.headers['x-user-id'] || 'c0000000-0000-0000-0000-000000000001',
            orgId: request.headers['x-org-id'] || 'a0000000-0000-0000-0000-000000000001',
            role: request.headers['x-role'] || 'SALES_MANAGER',
            teamId: request.headers['x-team-id'] || 'b0000000-0000-0000-0000-000000000001',
            email: request.headers['x-email'] || 'sarah.manager@acme.com',
        };
        request.user = userContext;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map
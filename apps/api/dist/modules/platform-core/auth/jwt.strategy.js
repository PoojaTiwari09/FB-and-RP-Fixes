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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../database/prisma.service");
const permissions_1 = require("./permissions");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(config, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET', 'local-dev-secret'),
            issuer: config.get('JWT_ISSUER', 'r-revenue-api'),
            audience: config.get('API_AUDIENCE', 'r-revenue-api'),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        if (!payload?.sub || !payload?.tenantId) {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                tenantid: true,
                role: true,
                email: true,
                name: true,
                status: true,
                tenant: { select: { status: true } },
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User no longer exists or is inactive');
        }
        if (user.tenant.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Tenant is not active');
        }
        const permissions = Array.isArray(payload.permissions) && payload.permissions.length > 0
            ? payload.permissions
            : (0, permissions_1.permissionsForRole)(user.role);
        return {
            sub: user.id,
            id: user.id,
            tenantId: user.tenantid,
            role: user.role,
            email: user.email,
            name: user.name,
            permissions,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map
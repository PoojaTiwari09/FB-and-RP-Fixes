"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../database/prisma.service");
const permissions_1 = require("./permissions");
const role_mapper_1 = require("./role-mapper");
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    issuer;
    audience;
    accessTtlSeconds;
    refreshTtlDays;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.issuer = this.config.get('JWT_ISSUER', 'r-revenue-api');
        this.audience = this.config.get('API_AUDIENCE', 'r-revenue-api');
        const ttlRaw = this.config.get('JWT_ACCESS_TTL_SECONDS') ??
            this.config.get('JWT_EXPIRES_IN', '600');
        this.accessTtlSeconds = /^\d+$/.test(ttlRaw)
            ? parseInt(ttlRaw, 10)
            : 86400;
        this.refreshTtlDays = parseInt(this.config.get('JWT_REFRESH_TTL_DAYS', '7'), 10);
    }
    async register(input) {
        const email = input.email.trim().toLowerCase();
        const slug = input.tenantSlug.trim().toLowerCase();
        const role = (0, role_mapper_1.toBackendRole)(input.role ?? 'ADMIN');
        if (role === 'ADMIN') {
            const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
            if (existingTenant) {
                throw new common_1.ConflictException('Tenant slug already exists');
            }
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const tenant = await this.prisma.tenant.upsert({
            where: { slug },
            update: {},
            create: {
                name: input.tenantName,
                slug,
                status: 'ACTIVE',
            },
        });
        const existingUser = await this.prisma.user.findUnique({
            where: { tenantid_email: { tenantid: tenant.id, email } },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists in this tenant');
        }
        const user = await this.prisma.user.create({
            data: {
                tenantid: tenant.id,
                email,
                name: input.name.trim(),
                passwordHash,
                role,
                status: 'ACTIVE',
            },
            include: { tenant: true },
        });
        return this.issueTokens(user, user.tenant.slug);
    }
    async login(input) {
        const email = input.email.trim().toLowerCase();
        const slug = input.tenantSlug.trim().toLowerCase();
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.assertTenantActive(tenant.status);
        const user = await this.prisma.user.findUnique({
            where: { tenantid_email: { tenantid: tenant.id, email } },
            include: { tenant: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.issueTokens(user, tenant.slug);
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { tenant: true } } },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        this.assertTenantActive(stored.user.tenant.status);
        if (stored.user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User account is not active');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        return this.issueTokens(stored.user, stored.user.tenant.slug);
    }
    async logout(refreshToken, userId) {
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async logoutAll(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User not found');
        }
        this.assertTenantActive(user.tenant.status);
        return this.toUserResponse(user, user.tenant.slug);
    }
    async issueTokens(user, tenantSlug) {
        const permissions = (0, permissions_1.permissionsForRole)(user.role);
        const payload = {
            sub: user.id,
            tenantId: user.tenantid,
            role: user.role,
            permissions,
            email: user.email,
            name: user.name,
        };
        const accessToken = this.jwt.sign(payload);
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('base64url');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: this.hashToken(refreshToken),
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.accessTtlSeconds,
            tokenType: 'Bearer',
            user: this.toUserResponse(user, tenantSlug, permissions),
        };
    }
    toUserResponse(user, tenantSlug, permissions) {
        const perms = permissions ?? (0, permissions_1.permissionsForRole)(user.role);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            frontendRole: (0, role_mapper_1.toFrontendRole)(user.role),
            tenantId: user.tenantid,
            tenantSlug,
            permissions: perms,
        };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    assertTenantActive(status) {
        if (status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Tenant is not active');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
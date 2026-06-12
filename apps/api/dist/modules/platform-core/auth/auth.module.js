"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../database/prisma.module");
const jwt_guard_1 = require("../guards/jwt.guard");
const permissions_guard_1 = require("../guards/permissions.guard");
const roles_guard_1 = require("../guards/roles.guard");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./jwt.strategy");
let PlatformAuthModule = class PlatformAuthModule {
};
exports.PlatformAuthModule = PlatformAuthModule;
exports.PlatformAuthModule = PlatformAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PlatformPrismaModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    secret: cfg.get('JWT_SECRET', 'local-dev-secret'),
                    signOptions: {
                        expiresIn: cfg.get('JWT_EXPIRES_IN') ??
                            cfg.get('JWT_ACCESS_TTL_SECONDS', '600'),
                        issuer: cfg.get('JWT_ISSUER', 'r-revenue-api'),
                        audience: cfg.get('API_AUDIENCE', 'r-revenue-api'),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            { provide: core_1.APP_GUARD, useClass: jwt_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule, passport_1.PassportModule],
    })
], PlatformAuthModule);
//# sourceMappingURL=auth.module.js.map
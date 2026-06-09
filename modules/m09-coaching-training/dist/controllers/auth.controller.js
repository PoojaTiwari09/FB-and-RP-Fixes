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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const m09_repository_1 = require("../repositories/m09.repository");
const m09_schema_1 = require("../schemas/m09.schema");
const bcrypt = require("bcrypt");
const m09_controller_1 = require("./m09.controller");
let AuthController = class AuthController {
    constructor(repository, jwtService) {
        this.repository = repository;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.repository.findUserByEmail(dto.email);
        if (existing) {
            throw new common_1.BadRequestException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.repository.createUser({
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role: dto.role,
            org_id: dto.org_id,
            manager_id: dto.manager_id,
            status: 'active',
        });
        const payload = { sub: user.id, email: user.email, role: user.role, org_id: user.org_id };
        return {
            success: true,
            token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                org_id: user.org_id,
            },
        };
    }
    async login(dto) {
        const user = await this.repository.findUserByEmail(dto.email);
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const payload = { sub: user.id, email: user.email, role: user.role, org_id: user.org_id };
        return {
            success: true,
            token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                org_id: user.org_id,
            },
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, m09_controller_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, m09_controller_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/auth'),
    __metadata("design:paramtypes", [m09_repository_1.M09Repository,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
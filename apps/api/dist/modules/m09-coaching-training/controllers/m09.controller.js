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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = exports.AnalyticsController = exports.TrainingController = exports.CoachingController = exports.ScenariosController = exports.SessionsController = exports.RolesGuard = exports.JwtAuthGuard = exports.Public = exports.IS_PUBLIC_KEY = exports.Roles = exports.ROLES_KEY = exports.CurrentUser = exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const platform_express_1 = require("@nestjs/platform-express");
const core_1 = require("@nestjs/core");
const bcrypt = __importStar(require("bcrypt"));
const m09_service_1 = require("../services/m09.service");
const m09_repository_1 = require("../repositories/m09.repository");
const prisma_service_1 = require("../database/prisma.service");
const m09_schema_1 = require("../schemas/m09.schema");
let AppController = class AppController {
    root() {
        return {
            name: 'M09 Sales AI Coaching & Training API',
            version: '1.0.0',
            status: '🟢 Online',
            docs: 'http://localhost:4001/api/docs',
            health: 'http://localhost:4001/api/test/health',
            endpoints: {
                auth: ['POST /api/auth/register', 'POST /api/auth/login'],
                sessions: ['POST /api/sessions/start', 'POST /api/sessions/send-message', 'POST /api/sessions/end'],
                scenarios: ['GET /api/scenarios', 'POST /api/scenarios'],
                analytics: ['GET /api/analytics/dashboard', 'GET /api/analytics/my'],
                coaching: ['GET /api/coaching/notes', 'GET /api/coaching/recommendations'],
                training: ['GET /api/training/assignments', 'POST /api/training/assignments'],
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "root", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training')
], AppController);
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    repository;
    jwtService;
    constructor(reflector, repository, jwtService) {
        this.reflector = reflector;
        this.repository = repository;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('No token provided');
        }
        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = this.jwtService.verify(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        if (!payload || !payload.sub) {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
        const user = await this.repository.getUserById(payload.sub);
        if (!user || user.status !== 'active') {
            throw new common_1.UnauthorizedException('User not active or not found');
        }
        request.user = user;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        m09_repository_1.M09Repository,
        jwt_1.JwtService])
], JwtAuthGuard);
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(exports.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.role) {
            throw new common_1.ForbiddenException('Access denied: role not found');
        }
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new common_1.ForbiddenException(`Access denied: required roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
let SessionsController = class SessionsController {
    sessionsService;
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async findAll(user) {
        return this.sessionsService.findAll(user.id, user.org_id);
    }
    async getMySessions(user) {
        return this.sessionsService.getMySessions(user.id, user.org_id);
    }
    async getVoices() {
        return this.sessionsService.getVoices();
    }
    async getVoicesFrontendAlias() {
        return this.sessionsService.getVoices();
    }
    async getSessionById(id, user) {
        return this.sessionsService.getSessionById(id, user.org_id);
    }
    async getHint(id, user) {
        return this.sessionsService.getHint(id, user.org_id);
    }
    async startSession(dto, user) {
        return this.sessionsService.startSession(dto, user.id, user.org_id);
    }
    async sendMessage(dto, user) {
        return this.sessionsService.sendMessage(dto, user.org_id);
    }
    async sendVoiceMessage(sessionId, audio, user) {
        return this.sessionsService.sendVoiceMessage(sessionId, audio, user.org_id);
    }
    async endSession(dto, user) {
        return this.sessionsService.endSession(dto.sessionId, user.org_id);
    }
    async submitSessionToManager(body, user) {
        return this.sessionsService.submitSessionToManager(body.sessionId, user.id, user.org_id);
    }
    async retrySession(dto, user) {
        return this.sessionsService.retrySession(dto.sessionId, user.id, user.org_id);
    }
    async sendMessageAlias(dto, user) {
        return this.sessionsService.sendMessage(dto, user.org_id);
    }
    async sendVoiceMessageAlias(sessionId, audio, user) {
        return this.sessionsService.sendVoiceMessage(sessionId, audio, user.org_id);
    }
    async getVoicesAlias() {
        return this.sessionsService.getVoices();
    }
    async updateSession(id, dto, user) {
        return this.sessionsService.updateSession(id, dto, user.org_id);
    }
    async analyzeUploadedCall(audio, user) {
        return this.sessionsService.analyzeUploadedCall(user.id, user.org_id, audio);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)(),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getMySessions", null);
__decorate([
    (0, common_1.Get)('voices'),
    (0, exports.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getVoices", null);
__decorate([
    (0, common_1.Get)('get-voices'),
    (0, exports.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getVoicesFrontendAlias", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSessionById", null);
__decorate([
    (0, common_1.Get)(':id/hint'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getHint", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.StartSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('send-message'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('send-voice'),
    (0, exports.Roles)('rep'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.Body)('sessionId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendVoiceMessage", null);
__decorate([
    (0, common_1.Post)('end'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "endSession", null);
__decorate([
    (0, common_1.Post)('submit-to-manager'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "submitSessionToManager", null);
__decorate([
    (0, common_1.Post)('retry'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "retrySession", null);
__decorate([
    (0, common_1.Post)('message'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendMessageAlias", null);
__decorate([
    (0, common_1.Post)('voice-message'),
    (0, exports.Roles)('rep'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.Body)('sessionId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendVoiceMessageAlias", null);
__decorate([
    (0, common_1.Get)('get-voices-legacy'),
    (0, exports.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getVoicesAlias", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Post)('analyze-call'),
    (0, exports.Roles)('rep'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "analyzeUploadedCall", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/sessions'),
    (0, common_1.UseGuards)(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [m09_service_1.SessionsService])
], SessionsController);
let ScenariosController = class ScenariosController {
    scenariosService;
    constructor(scenariosService) {
        this.scenariosService = scenariosService;
    }
    async findAll(user) {
        return this.scenariosService.findAll(user.org_id);
    }
    async findOne(id, user) {
        return this.scenariosService.findOne(id, user.org_id);
    }
    async create(dto, user) {
        return this.scenariosService.create(dto, user.org_id, user.id);
    }
    async update(id, dto, user) {
        return this.scenariosService.update(id, dto, user.org_id);
    }
    async delete(id, user) {
        return this.scenariosService.delete(id, user.org_id);
    }
    async transcribeAudio(audio) {
        if (!audio)
            throw new common_1.BadRequestException('No audio file provided');
        const transcript = await this.scenariosService.transcribeAudio(audio.buffer);
        return { transcript };
    }
    async analyzeAudio(audio) {
        if (!audio)
            throw new common_1.BadRequestException('No audio file provided');
        return this.scenariosService.analyzeAudioForScenario(audio.buffer);
    }
    async generatePersona(transcript) {
        if (!transcript)
            throw new common_1.BadRequestException('Transcript is required');
        return this.scenariosService.generatePersonaFromTranscript(transcript);
    }
};
exports.ScenariosController = ScenariosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.CreateScenarioDto, Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, m09_schema_1.UpdateScenarioDto, Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('transcribe'),
    (0, exports.Roles)('manager', 'org_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "transcribeAudio", null);
__decorate([
    (0, common_1.Post)('analyze-audio'),
    (0, exports.Roles)('manager', 'org_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "analyzeAudio", null);
__decorate([
    (0, common_1.Post)('generate-persona'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Body)('transcript')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "generatePersona", null);
exports.ScenariosController = ScenariosController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/scenarios'),
    (0, common_1.UseGuards)(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [m09_service_1.ScenariosService])
], ScenariosController);
let CoachingController = class CoachingController {
    coachingService;
    constructor(coachingService) {
        this.coachingService = coachingService;
    }
    async getNotes(user) {
        return this.coachingService.getNotes(user.id, user.role, user.org_id);
    }
    async createNote(dto, user) {
        return this.coachingService.createNote(user.id, dto.repId, dto.content, dto.priority, user.org_id);
    }
    async getRecommendations(user) {
        return this.coachingService.getRecommendations(user.id);
    }
    async pushRecommendation(dto, user) {
        return this.coachingService.pushRecommendation(user.id, dto.repId, dto.focusArea, dto.text);
    }
};
exports.CoachingController = CoachingController;
__decorate([
    (0, common_1.Get)('notes'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Post)('notes'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.CreateNoteDto, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "createNote", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('recommendations'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "pushRecommendation", null);
exports.CoachingController = CoachingController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/coaching'),
    (0, common_1.UseGuards)(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [m09_service_1.CoachingService])
], CoachingController);
let TrainingController = class TrainingController {
    trainingService;
    sessionsService;
    constructor(trainingService, sessionsService) {
        this.trainingService = trainingService;
        this.sessionsService = sessionsService;
    }
    async submitSessionToManager(body, user) {
        return this.sessionsService.submitSessionToManager(body.sessionId, user.id, user.org_id);
    }
    async createAssignments(dto, user) {
        return this.trainingService.createAssignments(dto, user.id, user.org_id);
    }
    async getAssignments(user) {
        return this.trainingService.getAssignments(user);
    }
    async updateAssignment(id, dto, user) {
        if (user.role === 'rep') {
            return this.trainingService.updateAssignmentByRep(id, dto, user.id);
        }
        return this.trainingService.updateAssignment(id, dto, user.id);
    }
    async deleteAssignment(id, user) {
        return this.trainingService.deleteAssignment(id, user.id);
    }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Post)('submit-session'),
    (0, exports.Roles)('rep'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "submitSessionToManager", null);
__decorate([
    (0, common_1.Post)('assignments'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [m09_schema_1.CreateAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "createAssignments", null);
__decorate([
    (0, common_1.Get)('assignments'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "getAssignments", null);
__decorate([
    (0, common_1.Patch)('assignments/:id'),
    (0, exports.Roles)('manager', 'org_admin', 'rep'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, m09_schema_1.UpdateAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "updateAssignment", null);
__decorate([
    (0, common_1.Delete)('assignments/:id'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "deleteAssignment", null);
exports.TrainingController = TrainingController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/training'),
    (0, common_1.UseGuards)(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [m09_service_1.TrainingService,
        m09_service_1.SessionsService])
], TrainingController);
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboardStats(user) {
        return this.analyticsService.getDashboardStats(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getRepsWithStats(user) {
        return this.analyticsService.getRepsWithStats(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getRepComparison(repId, user) {
        return this.analyticsService.getRepComparison(repId, user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getTeamAnalytics(user) {
        return this.analyticsService.getTeamAnalytics(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getActivityMetrics(user) {
        return this.analyticsService.getActivityMetrics(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getInteractionAnalytics(user) {
        return this.analyticsService.getInteractionAnalytics(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getTopicInsights(user) {
        return this.analyticsService.getTopicInsights(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getCallDrilldown(sessionId, user) {
        return this.analyticsService.getCallDrilldown(sessionId, user.org_id);
    }
    async getBenchmarks(user) {
        return this.analyticsService.getBenchmarks(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async getManagerReview(user) {
        return this.analyticsService.getManagerReview(user.id, user.org_id);
    }
    async getTrainingReport(user) {
        return this.analyticsService.getTrainingReport(user.org_id, user.role === 'manager' ? user.id : undefined);
    }
    async exportCsv(user, query) {
        return this.analyticsService.exportCsv(user.org_id, query, user.role === 'manager' ? user.id : undefined);
    }
    async exportTrainingCsv(user, query) {
        return this.analyticsService.exportTrainingCsv(user.org_id, query, user.role === 'manager' ? user.id : undefined);
    }
    async getMyAnalytics(user) {
        return this.analyticsService.getMyAnalytics(user.id, user.org_id);
    }
    async getMyNotes(user) {
        return this.analyticsService.getMyNotes(user.id, user.org_id);
    }
    async getMyAssignments(user) {
        return this.analyticsService.getMyAssignments(user.id, user.org_id);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('reps'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRepsWithStats", null);
__decorate([
    (0, common_1.Get)('compare/:repId'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, common_1.Param)('repId')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRepComparison", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTeamAnalytics", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getActivityMetrics", null);
__decorate([
    (0, common_1.Get)('interactions'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getInteractionAnalytics", null);
__decorate([
    (0, common_1.Get)('topics'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopicInsights", null);
__decorate([
    (0, common_1.Get)('call-drilldown/:sessionId'),
    (0, exports.Roles)('manager', 'org_admin', 'rep'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCallDrilldown", null);
__decorate([
    (0, common_1.Get)('benchmarks'),
    (0, exports.Roles)('manager', 'org_admin', 'rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBenchmarks", null);
__decorate([
    (0, common_1.Get)('manager-review'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getManagerReview", null);
__decorate([
    (0, common_1.Get)('training-report'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTrainingReport", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, m09_schema_1.ExportQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('export-training'),
    (0, exports.Roles)('manager', 'org_admin'),
    __param(0, (0, exports.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, m09_schema_1.ExportQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportTrainingCsv", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMyAnalytics", null);
__decorate([
    (0, common_1.Get)('my-notes'),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMyNotes", null);
__decorate([
    (0, common_1.Get)('my-assignments'),
    (0, exports.Roles)('rep'),
    __param(0, (0, exports.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMyAssignments", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/analytics'),
    (0, common_1.UseGuards)(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [m09_service_1.AnalyticsService])
], AnalyticsController);
let TestController = class TestController {
    prisma;
    repository;
    sessionsService;
    analyticsService;
    llmService;
    jwtService;
    constructor(prisma, repository, sessionsService, analyticsService, llmService, jwtService) {
        this.prisma = prisma;
        this.repository = repository;
        this.sessionsService = sessionsService;
        this.analyticsService = analyticsService;
        this.llmService = llmService;
        this.jwtService = jwtService;
    }
    async ensureSeedData() {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const seed = this.repository.seedTestData(hashedPassword);
        return {
            success: true,
            message: 'Test data seeded successfully',
            repId: seed.repId,
            managerId: seed.managerId,
            orgId: seed.orgId,
        };
    }
    async health() {
        await this.prisma.$queryRaw `SELECT 1`;
        const scenarios = await this.repository.findAllScenarios('00000000-0000-0000-0000-000000000001').catch(() => []);
        return {
            success: true,
            database: 'up',
            aiMode: this.llmService.getRuntimeMode(),
            provider: this.llmService.getActiveProviderName(),
            counts: {
                scenarios: scenarios.length,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async seedTestData() {
        return this.ensureSeedData();
    }
    async generateToken(dto) {
        const user = await this.repository.getUserById(dto.userId);
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            org_id: user.org_id,
        });
        return { token, userId: user.id, org_id: user.org_id, role: user.role };
    }
    async smokeTest() {
        const seed = await this.ensureSeedData();
        const scenarios = await this.repository.findAllScenarios(seed.orgId);
        const voices = await this.repository.getVoices();
        const session = await this.sessionsService.startSession({
            scenarioId: scenarios[0].id,
            voiceId: voices[0]?.id,
        }, seed.repId, seed.orgId);
        const turn = await this.sessionsService.sendMessage({
            sessionId: session.sessionId,
            message: 'We help reduce ramp time and improve rep consistency. What matters most to you right now?',
        }, seed.orgId);
        const feedback = await this.sessionsService.endSession(session.sessionId, seed.orgId);
        const analytics = await this.analyticsService.getMyAnalytics(seed.repId, seed.orgId);
        return {
            success: true,
            aiMode: this.llmService.getRuntimeMode(),
            sessionId: session.sessionId,
            replyPreview: turn.reply,
            finalScore: feedback.overall_score,
            analyticsEntries: analytics.length,
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, exports.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "health", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "seedTestData", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Post)('token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "generateToken", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Post)('smoke'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "smokeTest", null);
exports.TestController = TestController = __decorate([
    (0, common_1.Controller)('api/v1/coaching-training/test'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        m09_repository_1.M09Repository,
        m09_service_1.SessionsService,
        m09_service_1.AnalyticsService,
        m09_service_1.LlmService,
        jwt_1.JwtService])
], TestController);
//# sourceMappingURL=m09.controller.js.map
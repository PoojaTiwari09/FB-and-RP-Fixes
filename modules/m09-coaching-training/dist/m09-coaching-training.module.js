"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M09CoachingTrainingModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./database/prisma.module");
const jwt_1 = require("@nestjs/jwt");
const m09_controller_1 = require("./controllers/m09.controller");
const auth_controller_1 = require("./controllers/auth.controller");
const m09_frontend_trainings_controller_1 = require("./frontend-api/m09-frontend-trainings.controller");
const m09_frontend_manager_controller_1 = require("./frontend-api/m09-frontend-manager.controller");
const m09_frontend_revenue_manager_controller_1 = require("./frontend-api/m09-frontend-revenue-manager.controller");
const m09_frontend_trainings_service_1 = require("./frontend-api/m09-frontend-trainings.service");
const m09_frontend_auth_guard_1 = require("./frontend-api/m09-frontend-auth.guard");
const m09_service_1 = require("./services/m09.service");
const m09_repository_1 = require("./repositories/m09.repository");
const m09_worker_1 = require("./workers/m09.worker");
let M09CoachingTrainingModule = class M09CoachingTrainingModule {
};
exports.M09CoachingTrainingModule = M09CoachingTrainingModule;
exports.M09CoachingTrainingModule = M09CoachingTrainingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET ||
                    process.env.M09_JWT_SECRET ||
                    'local-dev-secret',
                signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
            }),
            prisma_module_1.PrismaModule,
        ],
        controllers: [
            m09_controller_1.AppController,
            auth_controller_1.AuthController,
            m09_controller_1.SessionsController,
            m09_controller_1.ScenariosController,
            m09_controller_1.CoachingController,
            m09_controller_1.TrainingController,
            m09_controller_1.AnalyticsController,
            m09_controller_1.TestController,
            m09_frontend_trainings_controller_1.M09FrontendTrainingsController,
            m09_frontend_manager_controller_1.M09FrontendManagerController,
            m09_frontend_revenue_manager_controller_1.M09FrontendRevenueManagerController,
        ],
        providers: [
            core_1.Reflector,
            m09_frontend_auth_guard_1.M09FrontendAuthGuard,
            m09_frontend_trainings_service_1.M09FrontendTrainingsService,
            m09_controller_1.JwtAuthGuard,
            m09_controller_1.RolesGuard,
            m09_service_1.LlmService,
            m09_service_1.SessionsService,
            m09_service_1.ScenariosService,
            m09_service_1.CoachingService,
            m09_service_1.TrainingService,
            m09_service_1.AnalyticsService,
            m09_service_1.SchedulerService,
            m09_repository_1.M09Repository,
            m09_worker_1.M09Worker,
        ],
        exports: [
            m09_service_1.SessionsService,
            m09_service_1.ScenariosService,
            m09_service_1.AnalyticsService,
            m09_service_1.TrainingService,
            m09_repository_1.M09Repository,
        ],
    })
], M09CoachingTrainingModule);
//# sourceMappingURL=m09-coaching-training.module.js.map
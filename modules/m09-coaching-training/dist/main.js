"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const m09_coaching_training_module_1 = require("./m09-coaching-training.module");
const config_1 = require("@nestjs/config");
const express_1 = require("express");
const swagger_1 = require("@nestjs/swagger");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' && res['message'] ? res['message'] : res;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        response.status(status).json({
            success: false,
            message: Array.isArray(message) ? message[0] : message,
            statusCode: status,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
async function bootstrap() {
    const app = await core_1.NestFactory.create(m09_coaching_training_module_1.M09CoachingTrainingModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors({
        origin: '*',
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('M09 Sales AI Coaching API')
        .setDescription('Sales AI Coaching & Training Backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('M09_API_PORT') || configService.get('PORT') || 4009;
    await app.listen(port);
    console.log(`\x1b[32m[NestJS]\x1b[0m M09 Coaching & Training is running on: \x1b[34mhttp://localhost:${port}/api/v1/coaching-training\x1b[0m`);
    console.log(`\x1b[32m[NestJS]\x1b[0m Submit to manager: POST /api/training/submit-session or POST /api/sessions/submit-to-manager`);
}
bootstrap();
//# sourceMappingURL=main.js.map
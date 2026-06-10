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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tsconfig_paths_1 = require("tsconfig-paths");
const path = __importStar(require("path"));
(0, tsconfig_paths_1.register)({
    baseUrl: path.join(__dirname, '..'),
    paths: require('../tsconfig.json').compilerOptions.paths,
});
const fs = __importStar(require("fs"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const zod_exception_filter_1 = require("./zod-exception.filter");
const response_transform_interceptor_1 = require("./response-transform.interceptor");
const frontend_api_exception_filter_1 = require("../../../modules/platform-core/filters/frontend-api-exception.filter");
const jwt_guard_1 = require("../../../modules/platform-core/guards/jwt.guard");
const tenant_throttler_guard_1 = require("./tenant-throttler.guard");
const trace_tenant_middleware_1 = require("./trace-tenant.middleware");
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: false,
    });
    const reflector = app.get(core_1.Reflector);
    app.enableCors({ origin: true, credentials: true });
    app.use(trace_tenant_middleware_1.TraceAndTenantMiddleware);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
    }));
    app.useGlobalInterceptors(new response_transform_interceptor_1.ResponseTransformInterceptor());
    app.useGlobalFilters(new frontend_api_exception_filter_1.FrontendApiExceptionFilter(), new zod_exception_filter_1.ZodExceptionFilter());
    app.useGlobalGuards(new jwt_guard_1.JwtAuthGuard(reflector), new tenant_throttler_guard_1.TenantThrottlerGuard(app.get('ThrottlerStorage'), app.get('ThrottlerConfig'), reflector));
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen(port);
    logger.log(`API listening on http://localhost:${port}`);
    logger.log('Mounted routes:');
    logger.log('  POST   /api/v1/capture-transcription/calls/upload (multer audio)');
    logger.log('  *      /api/v1/capture-transcription/calls/:id/next-steps (CRUD)');
    logger.log('  *      /api/v1/ai-extractor/fields + /calls/:id/extract');
    logger.log('  Worker queue: m01-queue (when DISABLE_REDIS !== true)');
}
bootstrap().catch((err) => {
    console.error('[BOOT FAILED]', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
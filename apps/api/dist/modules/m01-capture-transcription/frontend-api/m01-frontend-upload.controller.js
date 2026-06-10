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
exports.M01FrontendUploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const multer = __importStar(require("multer"));
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const call_service_1 = require("../services/call.service");
const upload_paths_1 = require("../lib/upload-paths");
const UPLOAD_DIR = (0, upload_paths_1.getUploadAudioDir)();
const audioStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = (0, path_1.extname)(file.originalname) || '.mp3';
        cb(null, `call-${uniqueSuffix}${ext}`);
    },
});
const ALLOWED_AUDIO = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a',
];
let M01FrontendUploadController = class M01FrontendUploadController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async upload(file, req) {
        if (!file)
            throw new common_1.BadRequestException('No audio file provided');
        if (!ALLOWED_AUDIO.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported audio format: ${file.mimetype}`);
        }
        const rawName = (0, path_1.basename)(file.originalname, (0, path_1.extname)(file.originalname));
        const title = rawName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim() ||
            'Uploaded Call';
        const call = await this.svc.createCallFromUpload({
            title,
            audioUrl: (0, upload_paths_1.getPublicAudioUrl)(file.filename),
            originalFilename: file.originalname,
            fileSizeBytes: file.size,
            mimeType: file.mimetype,
        }, req.tenantId);
        return {
            callId: call.id,
            status: 'processing',
            message: 'Upload received. Transcription queued.',
        };
    }
};
exports.M01FrontendUploadController = M01FrontendUploadController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', { storage: audioStorage, limits: { fileSize: 500 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M01FrontendUploadController.prototype, "upload", null);
exports.M01FrontendUploadController = M01FrontendUploadController = __decorate([
    (0, common_1.Controller)('api/calls'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [call_service_1.CallService])
], M01FrontendUploadController);
//# sourceMappingURL=m01-frontend-upload.controller.js.map
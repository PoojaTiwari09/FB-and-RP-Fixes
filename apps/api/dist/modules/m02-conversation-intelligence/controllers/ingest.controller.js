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
exports.ConversationIngestController = void 0;
const common_1 = require("@nestjs/common");
const ingest_service_1 = require("../services/ingest.service");
let ConversationIngestController = class ConversationIngestController {
    ingest;
    constructor(ingest) {
        this.ingest = ingest;
    }
    fromTranscription(body, serviceKey) {
        const expected = process.env.INTERNAL_SERVICE_KEY;
        if (expected && serviceKey !== expected) {
            throw new common_1.UnauthorizedException('Invalid or missing x-service-key');
        }
        if (!body?.tenantId || !body?.callId) {
            throw new common_1.BadRequestException('tenantId and callId are required');
        }
        return this.ingest.ingestFromTranscription(body);
    }
};
exports.ConversationIngestController = ConversationIngestController;
__decorate([
    (0, common_1.Post)('from-transcription'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-service-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConversationIngestController.prototype, "fromTranscription", null);
exports.ConversationIngestController = ConversationIngestController = __decorate([
    (0, common_1.Controller)('api/v1/conversation-intelligence/ingest'),
    __metadata("design:paramtypes", [ingest_service_1.ConversationIngestService])
], ConversationIngestController);
//# sourceMappingURL=ingest.controller.js.map
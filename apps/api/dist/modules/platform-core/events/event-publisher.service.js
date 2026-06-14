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
var EventPublisherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPublisherService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const schemas = __importStar(require("@rri/shared-types"));
let EventPublisherService = EventPublisherService_1 = class EventPublisherService {
    eventQueue;
    logger = new common_1.Logger(EventPublisherService_1.name);
    constructor(eventQueue) {
        this.eventQueue = eventQueue;
    }
    async publish(eventName, payload) {
        const tenantId = payload.tenantId || payload.payload?.tenantId || '00000000-0000-0000-0000-000000000000';
        const correlationId = payload.correlationId || payload.payload?.correlationId;
        const traceId = payload.traceId || payload.payload?.traceId;
        const producer = payload.producer || eventName.split('.')[0] || 'platform';
        const businessPayload = payload.payload !== undefined && typeof payload.payload === 'object' && payload.payload !== null
            ? { ...payload.payload }
            : { ...payload };
        const envelopeKeys = ['eventId', 'eventName', 'eventVersion', 'schemaId', 'tenantId', 'producer', 'occurredAt', 'publishedAt', 'correlationId', 'traceId'];
        if (payload.payload === undefined) {
            for (const key of envelopeKeys) {
                delete businessPayload[key];
            }
        }
        const envelope = {
            eventId: (0, crypto_1.randomUUID)(),
            eventName,
            eventVersion: 'v1',
            schemaId: `${eventName}@v1`,
            tenantId,
            producer,
            occurredAt: payload.occurredAt || new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            correlationId,
            traceId,
            payload: businessPayload,
        };
        const schemaMap = {
            'call.transcription.completed': schemas.CallTranscriptionCompleted_v1,
            'call.transcription.failed': schemas.CallTranscriptionFailed_v1,
            'notification.alert.requested': schemas.NotificationAlertRequested_v1,
            'forecast.submitted': schemas.ForecastSubmitted_v1,
            'crm.ingested': schemas.CrmIngestedEvent_v1,
        };
        const schema = schemaMap[eventName];
        if (schema) {
            const result = schema.safeParse(envelope);
            if (!result.success) {
                this.logger.warn(`Event validation failed for "${eventName}": ${JSON.stringify(result.error.format())}`);
            }
            else {
                this.logger.log(`Event validation succeeded for "${eventName}"`);
            }
        }
        try {
            this.logger.debug(`[Event Publisher] Queueing async job "${eventName}" id=${envelope.eventId}`);
            await this.eventQueue.add(eventName, envelope);
        }
        catch (error) {
            this.logger.warn(`[Event Publisher] Failed to queue job "${eventName}": ${error.message}`);
        }
    }
};
exports.EventPublisherService = EventPublisherService;
exports.EventPublisherService = EventPublisherService = EventPublisherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('platform-events')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], EventPublisherService);
//# sourceMappingURL=event-publisher.service.js.map
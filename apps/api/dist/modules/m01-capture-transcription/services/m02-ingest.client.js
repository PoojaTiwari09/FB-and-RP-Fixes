"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var M02IngestClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02IngestClient = void 0;
const common_1 = require("@nestjs/common");
let M02IngestClient = M02IngestClient_1 = class M02IngestClient {
    logger = new common_1.Logger(M02IngestClient_1.name);
    get baseUrl() {
        return (process.env.M02_API_URL || 'http://localhost:3002').replace(/\/$/, '');
    }
    async notifyTranscriptionCompleted(payload) {
        const url = `${this.baseUrl}/api/v1/conversation-intelligence/ingest/from-transcription`;
        const headers = {
            'Content-Type': 'application/json',
        };
        const key = process.env.INTERNAL_SERVICE_KEY;
        if (key)
            headers['x-service-key'] = key;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    tenantId: payload.tenantId,
                    callId: payload.callId,
                    transcriptId: payload.transcriptId,
                    sourcePlatform: payload.sourcePlatform || 'm01-capture-transcription',
                    occurredAt: payload.occurredAt || new Date().toISOString(),
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                this.logger.warn(`M02 ingest failed (${res.status}) for call ${payload.callId}: ${text}`);
                return;
            }
            this.logger.log(`M02 ingest OK for call ${payload.callId}`);
        }
        catch (err) {
            this.logger.warn(`M02 ingest unreachable for call ${payload.callId}: ${err?.message || err}`);
        }
    }
};
exports.M02IngestClient = M02IngestClient;
exports.M02IngestClient = M02IngestClient = M02IngestClient_1 = __decorate([
    (0, common_1.Injectable)()
], M02IngestClient);
//# sourceMappingURL=m02-ingest.client.js.map
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
var ForecastSubmittedListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastSubmittedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const m06_prediction_queue_service_1 = require("../services/m06-prediction-queue.service");
let ForecastSubmittedListener = ForecastSubmittedListener_1 = class ForecastSubmittedListener {
    predictionQueue;
    logger = new common_1.Logger(ForecastSubmittedListener_1.name);
    constructor(predictionQueue) {
        this.predictionQueue = predictionQueue;
    }
    async handleForecastSubmitted(envelope) {
        const { tenantId, payload } = envelope;
        if (!tenantId || !payload?.periodId)
            return;
        this.logger.log(`forecast.submitted → enqueue prediction + executive snapshot (${payload.submissionId})`);
        await this.predictionQueue.enqueuePrediction(tenantId, payload.periodId, 'forecast.submitted', { submissionId: payload.submissionId });
        await this.predictionQueue.enqueueExecutiveMaterialize(tenantId, payload.periodId, payload.submissionId, payload);
    }
};
exports.ForecastSubmittedListener = ForecastSubmittedListener;
__decorate([
    (0, event_emitter_1.OnEvent)('forecast.submitted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ForecastSubmittedListener.prototype, "handleForecastSubmitted", null);
exports.ForecastSubmittedListener = ForecastSubmittedListener = ForecastSubmittedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m06_prediction_queue_service_1.M06PredictionQueueService])
], ForecastSubmittedListener);
//# sourceMappingURL=forecast-submitted.listener.js.map
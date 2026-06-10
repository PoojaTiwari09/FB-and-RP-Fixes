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
exports.M08SalesEngagementWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const m08_service_1 = require("../services/m08.service");
let M08SalesEngagementWorker = class M08SalesEngagementWorker extends bullmq_1.WorkerHost {
    service;
    constructor(service) {
        super();
        this.service = service;
    }
    async process(job) {
        console.log(`[Queue Worker] Processing job ID ${job.id} for type: ${job.name}`);
        switch (job.name) {
            case 'process-auto-enrollment': {
                const { tenantId, playId, dealId, userId, triggerEventId } = job.data;
                console.log(`[Queue Worker] Initiating auto-enrollment transaction for Play ${playId}, Deal ${dealId}`);
                try {
                    const enrollment = await this.service.enrollOpportunity({
                        playId,
                        dealId,
                        userId,
                        triggerEventId,
                    }, tenantId);
                    return { status: 'success', enrollmentId: enrollment.id };
                }
                catch (e) {
                    console.error(`[Queue Worker] Failed auto-enrollment execution attempt:`, e);
                    throw e;
                }
            }
            default: {
                console.warn(`[Queue Worker] Unknown job handler called: ${job.name}`);
                return { status: 'ignored' };
            }
        }
    }
};
exports.M08SalesEngagementWorker = M08SalesEngagementWorker;
exports.M08SalesEngagementWorker = M08SalesEngagementWorker = __decorate([
    (0, bullmq_1.Processor)('m08-queue'),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => m08_service_1.M08SalesEngagementService))),
    __metadata("design:paramtypes", [m08_service_1.M08SalesEngagementService])
], M08SalesEngagementWorker);
//# sourceMappingURL=m08.worker.js.map
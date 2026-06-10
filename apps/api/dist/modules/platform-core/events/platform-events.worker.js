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
var PlatformEventsWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformEventsWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_1 = require("@nestjs/common");
let PlatformEventsWorker = PlatformEventsWorker_1 = class PlatformEventsWorker extends bullmq_1.WorkerHost {
    emitter;
    logger = new common_1.Logger(PlatformEventsWorker_1.name);
    constructor(emitter) {
        super();
        this.emitter = emitter;
    }
    async process(job) {
        const { name, data } = job;
        this.logger.log(`Processing async platform event "${name}" with job ID ${job.id}`);
        this.emitter.emit(name, data);
    }
};
exports.PlatformEventsWorker = PlatformEventsWorker;
exports.PlatformEventsWorker = PlatformEventsWorker = PlatformEventsWorker_1 = __decorate([
    (0, bullmq_1.Processor)('platform-events'),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], PlatformEventsWorker);
//# sourceMappingURL=platform-events.worker.js.map
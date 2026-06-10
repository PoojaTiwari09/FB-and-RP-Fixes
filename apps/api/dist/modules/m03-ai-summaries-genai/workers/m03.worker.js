"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M03AiSummariesGenaiWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
let M03AiSummariesGenaiWorker = class M03AiSummariesGenaiWorker extends bullmq_1.WorkerHost {
    async process(job) {
        console.log(`Processing job in module M-03`, job.id);
    }
};
exports.M03AiSummariesGenaiWorker = M03AiSummariesGenaiWorker;
exports.M03AiSummariesGenaiWorker = M03AiSummariesGenaiWorker = __decorate([
    (0, bullmq_1.Processor)('m03-queue')
], M03AiSummariesGenaiWorker);
//# sourceMappingURL=m03.worker.js.map
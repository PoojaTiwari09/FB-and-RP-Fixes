"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const m03_data_store_1 = require("./m03-data.store");
let FeedbackService = class FeedbackService {
    async submitFeedback(params) {
        m03_data_store_1.m03DataStore.feedback.push({
            id: (0, uuid_1.v4)(),
            org_id: params.orgId,
            user_id: params.userId,
            report_id: params.reportId,
            section_id: params.sectionId,
            bullet_id: params.bulletId,
            feedback_type: params.type,
            note: params.note,
        });
        return { status: 'ok' };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)()
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map
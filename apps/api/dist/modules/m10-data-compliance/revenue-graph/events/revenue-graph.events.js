"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M10_REVENUE_GRAPH_QUEUES = exports.M10_REVENUE_GRAPH_EVENTS = void 0;
exports.M10_REVENUE_GRAPH_EVENTS = {
    CONSUMED: {
        CALL_TRANSCRIPTION_COMPLETED: 'call.transcription.completed',
        MEETING_CAPTURED: 'meeting.captured',
        EMAIL_SENT: 'email.sent',
        CRM_FIELDS_EXTRACTED: 'crm.fields.extracted',
        CALL_SUMMARY_GENERATED: 'call.summary.generated',
        DEAL_STAGE_UPDATE_REQUESTED: 'deal.stage.update.requested',
    },
    PUBLISHED: {
        ENTITY_LINKED: 'revenue_graph.entity.linked',
        ENTITY_LINK_FAILED: 'revenue_graph.entity.link_failed',
        DEAL_STAGE_CHANGED: 'deal.stage.changed',
    },
};
exports.M10_REVENUE_GRAPH_QUEUES = {
    INTAKE: process.env.M10_LINKING_QUEUE_NAME ?? 'revenue-graph-linking',
    DEAL_STAGE: 'm10-deal-stage-coordination',
    LINKING_DLQ: 'm10-revenue-graph-linking-dlq',
};
//# sourceMappingURL=revenue-graph.events.js.map
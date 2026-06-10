export declare const M10_REVENUE_GRAPH_EVENTS: {
    readonly CONSUMED: {
        readonly CALL_TRANSCRIPTION_COMPLETED: "call.transcription.completed";
        readonly MEETING_CAPTURED: "meeting.captured";
        readonly EMAIL_SENT: "email.sent";
        readonly CRM_FIELDS_EXTRACTED: "crm.fields.extracted";
        readonly CALL_SUMMARY_GENERATED: "call.summary.generated";
        readonly DEAL_STAGE_UPDATE_REQUESTED: "deal.stage.update.requested";
    };
    readonly PUBLISHED: {
        readonly ENTITY_LINKED: "revenue_graph.entity.linked";
        readonly ENTITY_LINK_FAILED: "revenue_graph.entity.link_failed";
        readonly DEAL_STAGE_CHANGED: "deal.stage.changed";
    };
};
export declare const M10_REVENUE_GRAPH_QUEUES: {
    readonly INTAKE: string;
    readonly DEAL_STAGE: "m10-deal-stage-coordination";
    readonly LINKING_DLQ: "m10-revenue-graph-linking-dlq";
};

// M10 Revenue Graph — Event Type Constants
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// All event names follow platform snake_case convention.
// Architecture rule: No module copies event name strings manually.

export const M10_REVENUE_GRAPH_EVENTS = {
  // Events this module CONSUMES (from M1 and other upstream modules)
  CONSUMED: {
    /** Published by M1 Capture & Transcription after durable transcript write */
    CALL_TRANSCRIPTION_COMPLETED: 'call.transcription.completed',
    /** Published when a meeting is fully captured */
    MEETING_CAPTURED: 'meeting.captured',
    /** Published when an outbound email interaction is recorded */
    EMAIL_SENT: 'email.sent',
    /** Published after CRM field extraction */
    CRM_FIELDS_EXTRACTED: 'crm.fields.extracted',
    /** Published when a call summary has been generated (M3) */
    CALL_SUMMARY_GENERATED: 'call.summary.generated',
    /** M4 Deal Intelligence requests a deal stage change via ADR-005 */
    DEAL_STAGE_UPDATE_REQUESTED: 'deal.stage.update.requested',
  },

  // Events this module PUBLISHES (to M2, M3, M4, M5, M6, M7, M8, M9)
  PUBLISHED: {
    /**
     * Published after Revenue Graph durably writes linked entity records.
     * This is the primary output event of the Revenue Graph feature.
     * Consumers: M2 (CI), M3 (Briefs), M4 (Deals), M5 (Accounts),
     *            M6 (Forecasting), M7 (Dashboards), M9 (Coaching).
     * CRITICAL: Only published AFTER successful durable DB write (TDD §16.4 equivalent).
     */
    ENTITY_LINKED: 'revenue_graph.entity.linked',

    /**
     * Published when entity linking could not complete
     * (no tenant context, validation failure, retries exhausted).
     */
    ENTITY_LINK_FAILED: 'revenue_graph.entity.link_failed',

    /**
     * Published by ADR-005 pattern after CRM deal stage sync success.
     * Consumers: M4 (board lock), M6 (forecast recalc), M8 (playbook trigger).
     */
    DEAL_STAGE_CHANGED: 'deal.stage.changed',
  },
} as const;

// BullMQ Queue names — M10_ prefixed per monorepo env variable convention
export const M10_REVENUE_GRAPH_QUEUES = {
  /** Primary intake queue: M10 worker listens here for M1 call events */
  INTAKE: process.env.M10_LINKING_QUEUE_NAME ?? 'revenue-graph-linking',
  /** ADR-005 deal stage coordination queue */
  DEAL_STAGE: 'm10-deal-stage-coordination',
  /** Dead-letter queue for failed linking jobs */
  LINKING_DLQ: 'm10-revenue-graph-linking-dlq',
} as const;

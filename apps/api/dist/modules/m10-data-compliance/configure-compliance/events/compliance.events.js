"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLIANCE_REASON_CODES = exports.M10_COMPLIANCE_EVENTS = exports.M10_COMPLIANCE_QUEUES = void 0;
exports.M10_COMPLIANCE_QUEUES = {
    POLICY_SYNC: "compliance-policy-sync",
    OPTOUT_SYNC: "compliance-optout-sync",
};
exports.M10_COMPLIANCE_EVENTS = {
    PUBLISHED: {
        POLICY_UPDATED: "compliance.policy.updated",
        EVALUATION_COMPLETED: "compliance.evaluation.completed",
    },
    CONSUMED: {
        CRM_OPTOUT_SYNCED: "crm.optout.synced",
    },
};
exports.COMPLIANCE_REASON_CODES = {
    ALLOW: {
        POLICY_PASSED: "POLICY_PASSED",
    },
    BLOCK: {
        CRM_OPTED_OUT: "CRM_OPTED_OUT",
        SUPPRESSED: "SUPPRESSED",
        GDPR_ERASURE_IN_PROGRESS: "GDPR_ERASURE_IN_PROGRESS",
        EPRIVACY_CONSENT_REQUIRED: "EPRIVACY_CONSENT_REQUIRED",
        GDPR_CONSENT_REQUIRED: "GDPR_CONSENT_REQUIRED",
        CCPA_RESTRICTED: "CCPA_RESTRICTED",
        FAIL_CLOSED_MISSING_DATA: "FAIL_CLOSED_MISSING_DATA",
        NO_ACTIVE_POLICY: "NO_ACTIVE_POLICY",
    },
};
//# sourceMappingURL=compliance.events.js.map
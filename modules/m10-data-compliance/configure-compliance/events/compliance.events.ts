// M10 Configure Compliance — Event & Queue Constants
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)

export const M10_COMPLIANCE_QUEUES = {
  POLICY_SYNC: "compliance-policy-sync",
  OPTOUT_SYNC: "compliance-optout-sync",
} as const;

export const M10_COMPLIANCE_EVENTS = {
  PUBLISHED: {
    POLICY_UPDATED: "compliance.policy.updated",
    EVALUATION_COMPLETED: "compliance.evaluation.completed",
  },
  CONSUMED: {
    CRM_OPTOUT_SYNCED: "crm.optout.synced",
  },
} as const;

// Reason codes returned by the evaluation engine (TDD §5.1)
export const COMPLIANCE_REASON_CODES = {
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
} as const;

export type ComplianceReasonCode =
  | (typeof COMPLIANCE_REASON_CODES.ALLOW)[keyof typeof COMPLIANCE_REASON_CODES.ALLOW]
  | (typeof COMPLIANCE_REASON_CODES.BLOCK)[keyof typeof COMPLIANCE_REASON_CODES.BLOCK];

// ============================================================
// ENDPOINTS — AI Deep Researcher
// Revenue Intelligence UI | Sales Manager
// ============================================================

export const API_ENDPOINTS = {
  // Config & Init
  FILTERS_DEFAULTS: '/api/v1/ai-deep-researcher/filters/defaults',
  EXAMPLE_QUESTIONS: '/api/v1/ai-deep-researcher/example-questions',
  
  // Job execution
  RUN_ANALYSIS: '/api/v1/ai-deep-researcher/run',
  PROGRESS: (jobId: string) => `/api/v1/ai-deep-researcher/progress/${jobId}`,
  
  // Report sections (Dashboard / Tabs)
  DASHBOARD: '/api/v1/ai-deep-researcher/dashboard', // Used for top-level report stats
  EXECUTIVE_SUMMARY: '/api/v1/ai-deep-researcher/executive-summary',
  KEY_FINDINGS: '/api/v1/ai-deep-researcher/key-findings',
  OBJECTIONS: '/api/v1/ai-deep-researcher/objections',
  EVIDENCE: '/api/v1/ai-deep-researcher/evidence',
  TRENDS: '/api/v1/ai-deep-researcher/trends',
  RISKS_OPPORTUNITIES: '/api/v1/ai-deep-researcher/risks-opportunities',
  RECOMMENDATIONS: '/api/v1/ai-deep-researcher/recommendations',
  ESCALATIONS: '/api/v1/ai-deep-researcher/escalations', // Tab data if any
  
  // Refactored REST Endpoints
  REPS: '/api/v1/ai-deep-researcher/reps',
  REP_CALLS: (repId: string) => `/api/v1/ai-deep-researcher/reps/${repId}/calls`,
  OBJECTION_REP_BREAKDOWN: (objectionId: string) => `/api/v1/ai-deep-researcher/objections/${objectionId}/rep-breakdown`,
  OBJECTION_EVIDENCE: (objectionId: string) => `/api/v1/ai-deep-researcher/objections/${objectionId}/evidence`,
  CALL_DETAILS: (callId: string) => `/api/v1/conversation-intelligence/calls/${callId}`,
  ACCOUNT_DETAILS: (accountId: string) => `/api/v1/ai-deep-researcher/accounts/${accountId}`,

  // Escalation / Share
  ESCALATION_SUBMIT: '/api/v1/ai-deep-researcher/escalation',
  RECOMMENDATION_SHARE: '/api/v1/ai-deep-researcher/recommendation/share',
  RECOMMENDATION_DETAILS: (recId: string) => `/api/v1/ai-deep-researcher/recommendations/${recId}`,
};

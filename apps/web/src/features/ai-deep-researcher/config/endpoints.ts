// ============================================================
// ENDPOINTS — AI Deep Researcher
// Revenue Intelligence UI | Sales Manager
// ============================================================

export const API_ENDPOINTS = {
  // Config & Init
  FILTERS_DEFAULTS: '/api/ai-deep-researcher/filters/defaults',
  EXAMPLE_QUESTIONS: '/api/ai-deep-researcher/example-questions',
  
  // Job execution
  RUN_ANALYSIS: '/api/ai-deep-researcher/run',
  PROGRESS: (jobId: string) => `/api/ai-deep-researcher/progress/${jobId}`,
  
  // Report sections (Dashboard / Tabs)
  DASHBOARD: '/api/ai-deep-researcher/dashboard', // Used for top-level report stats
  EXECUTIVE_SUMMARY: '/api/ai-deep-researcher/executive-summary',
  KEY_FINDINGS: '/api/ai-deep-researcher/key-findings',
  OBJECTIONS: '/api/ai-deep-researcher/objections',
  EVIDENCE: '/api/ai-deep-researcher/evidence',
  TRENDS: '/api/ai-deep-researcher/trends',
  RISKS_OPPORTUNITIES: '/api/ai-deep-researcher/risks-opportunities',
  RECOMMENDATIONS: '/api/ai-deep-researcher/recommendations',
  ESCALATIONS: '/api/ai-deep-researcher/escalations', // Tab data if any
  
  // Refactored REST Endpoints
  REPS: '/api/reps',
  REP_CALLS: (repId: string) => `/api/reps/${repId}/calls`,
  OBJECTION_REP_BREAKDOWN: (objectionId: string) => `/api/objections/${objectionId}/rep-breakdown`,
  OBJECTION_EVIDENCE: (objectionId: string) => `/api/objections/${objectionId}/evidence`,
  CALL_DETAILS: (callId: string) => `/api/calls/${callId}`,
  ACCOUNT_DETAILS: (accountId: string) => `/api/accounts/${accountId}`,

  // Escalation / Share
  ESCALATION_SUBMIT: '/api/ai-deep-researcher/escalation',
  RECOMMENDATION_SHARE: '/api/ai-deep-researcher/recommendation/share',
  RECOMMENDATION_DETAILS: (recId: string) => `/api/recommendations/${recId}`,
};

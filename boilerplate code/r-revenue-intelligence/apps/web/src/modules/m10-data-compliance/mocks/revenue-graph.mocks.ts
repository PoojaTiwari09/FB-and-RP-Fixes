/**
 * Revenue Graph Mock Data — RIP-F-015
 * 
 * This file provides comprehensive mock data that mirrors the full BRD scope:
 * - Multi-channel interactions (calls, emails, meetings, SMS, LinkedIn, calendar)
 * - Entity resolution with confidence levels
 * - CRM sync states for Salesforce, HubSpot, Dynamics 365
 * - Integration hub connectors
 * - Compliance & access control status
 * 
 * @see BRD Section 6.1 — Automated Data Capture
 * @see BRD Section 6.3 — Contextual Data Mapping
 */

// ─── Activity Timeline (BRD §6.4: RG-17) ────────────────────────────────────
export const MOCK_ACTIVITIES = [
  {
    activityId: 'act-001', sourceType: 'call', sourcePlatform: 'Zoom',
    occurredAt: '2026-05-19T14:30:00Z', duration: '32 min',
    accountName: 'ACME Corporation', dealName: 'ACME Enterprise Renewal Q2',
    contactName: 'John Smith', contactEmail: 'john.smith@acme.com',
    confidence: 'high', aiAssisted: false,
    explanation: 'Exact email match → Contact #c111 · Domain match → Account ACME',
    status: 'linked', hasTranscript: true,
  },
  {
    activityId: 'act-002', sourceType: 'email', sourcePlatform: 'Gmail',
    occurredAt: '2026-05-19T09:15:00Z', duration: null,
    accountName: 'Globex Corp', dealName: 'Globex Platform Expansion',
    contactName: 'Sarah Connor', contactEmail: 'sarah@globex.com',
    confidence: 'high', aiAssisted: false,
    explanation: 'Domain match: @globex.com → Account #2222 · Deal ownership match',
    status: 'linked', hasTranscript: false,
  },
  {
    activityId: 'act-003', sourceType: 'meeting', sourcePlatform: 'Google Meet',
    occurredAt: '2026-05-18T16:00:00Z', duration: '45 min',
    accountName: 'Initech Systems', dealName: 'Initech Pilot Program',
    contactName: 'Peter Gibbons', contactEmail: 'peter@initech.com',
    confidence: 'medium', aiAssisted: true,
    explanation: 'AI semantic match: transcript context 78% similar to deal description',
    status: 'linked', hasTranscript: true,
  },
  {
    activityId: 'act-004', sourceType: 'call', sourcePlatform: 'Microsoft Teams',
    occurredAt: '2026-05-18T11:45:00Z', duration: '18 min',
    accountName: 'ACME Corporation', dealName: 'ACME Add-on Modules 2025',
    contactName: 'Jane Doe', contactEmail: 'jane.doe@acme.com',
    confidence: 'high', aiAssisted: false,
    explanation: 'Active deal linkage: seller owns opportunity in Closed Won stage',
    status: 'linked', hasTranscript: true,
  },
  {
    activityId: 'act-005', sourceType: 'email', sourcePlatform: 'Outlook',
    occurredAt: '2026-05-17T08:20:00Z', duration: null,
    accountName: 'Globex Corp', dealName: null,
    contactName: 'Unknown Contact', contactEmail: 'info@globex.com',
    confidence: 'low', aiAssisted: true,
    explanation: 'Multiple candidates: AI ranked 3 deals, top score 0.62 < threshold 0.78',
    status: 'linked_low_confidence', hasTranscript: false,
  },
  {
    activityId: 'act-006', sourceType: 'sms', sourcePlatform: 'Twilio',
    occurredAt: '2026-05-17T15:30:00Z', duration: null,
    accountName: 'Stark Industries', dealName: 'Stark Q3 Expansion',
    contactName: 'Pepper Potts', contactEmail: 'pepper@stark.com',
    confidence: 'high', aiAssisted: false,
    explanation: 'Phone number match → Contact #c555 · Domain match → Account Stark',
    status: 'linked', hasTranscript: false,
  },
  {
    activityId: 'act-007', sourceType: 'linkedin', sourcePlatform: 'LinkedIn',
    occurredAt: '2026-05-16T10:00:00Z', duration: null,
    accountName: 'Wayne Enterprises', dealName: null,
    contactName: 'Bruce Wayne', contactEmail: 'bruce@wayne.com',
    confidence: 'medium', aiAssisted: true,
    explanation: 'LinkedIn profile match → Contact #c666 · No active deal found',
    status: 'linked_low_confidence', hasTranscript: false,
  },
  {
    activityId: 'act-008', sourceType: 'calendar', sourcePlatform: 'Google Calendar',
    occurredAt: '2026-05-20T09:00:00Z', duration: '60 min',
    accountName: 'ACME Corporation', dealName: 'ACME Enterprise Renewal Q2',
    contactName: 'John Smith', contactEmail: 'john.smith@acme.com',
    confidence: 'high', aiAssisted: false,
    explanation: 'Attendee email match → Contact #c111 · Calendar deal tag match',
    status: 'linked', hasTranscript: false,
  },
  {
    activityId: 'act-009', sourceType: 'crm_note', sourcePlatform: 'Salesforce',
    occurredAt: '2026-05-15T15:30:00Z', duration: null,
    accountName: null, dealName: null,
    contactName: null, contactEmail: 'random@gmail.com',
    confidence: null, aiAssisted: false,
    explanation: 'Free email domain (gmail.com) — no account match found',
    status: 'unresolved', hasTranscript: false,
  },
];

// ─── Integration Hub (BRD §6.6: RG-23) ──────────────────────────────────────
export const MOCK_INTEGRATIONS = [
  { id: 'int-01', name: 'Salesforce', category: 'CRM', status: 'connected', icon: '☁️', syncFrequency: 'Real-time', lastSync: '2026-05-19T14:00:00Z', recordsSynced: 4280 },
  { id: 'int-02', name: 'HubSpot', category: 'CRM', status: 'connected', icon: '🟠', syncFrequency: 'Every 5 min', lastSync: '2026-05-19T13:55:00Z', recordsSynced: 1890 },
  { id: 'int-03', name: 'Microsoft Dynamics', category: 'CRM', status: 'disconnected', icon: '🔷', syncFrequency: '—', lastSync: null, recordsSynced: 0 },
  { id: 'int-04', name: 'Zoom', category: 'Video Conferencing', status: 'connected', icon: '📹', syncFrequency: 'Real-time', lastSync: '2026-05-19T14:30:00Z', recordsSynced: 312 },
  { id: 'int-05', name: 'Microsoft Teams', category: 'Video Conferencing', status: 'connected', icon: '🟦', syncFrequency: 'Real-time', lastSync: '2026-05-19T11:45:00Z', recordsSynced: 198 },
  { id: 'int-06', name: 'Google Meet', category: 'Video Conferencing', status: 'connected', icon: '🟩', syncFrequency: 'Real-time', lastSync: '2026-05-18T16:00:00Z', recordsSynced: 87 },
  { id: 'int-07', name: 'Gmail', category: 'Email', status: 'connected', icon: '📧', syncFrequency: 'Every 2 min', lastSync: '2026-05-19T14:28:00Z', recordsSynced: 8920 },
  { id: 'int-08', name: 'Outlook', category: 'Email', status: 'connected', icon: '📨', syncFrequency: 'Every 2 min', lastSync: '2026-05-19T14:25:00Z', recordsSynced: 5430 },
  { id: 'int-09', name: 'Google Calendar', category: 'Calendar', status: 'connected', icon: '📅', syncFrequency: 'Every 5 min', lastSync: '2026-05-19T14:20:00Z', recordsSynced: 1240 },
  { id: 'int-10', name: 'Outreach', category: 'Sales Engagement', status: 'connected', icon: '📤', syncFrequency: 'Every 10 min', lastSync: '2026-05-19T14:10:00Z', recordsSynced: 3100 },
  { id: 'int-11', name: 'Salesloft', category: 'Sales Engagement', status: 'disconnected', icon: '📞', syncFrequency: '—', lastSync: null, recordsSynced: 0 },
  { id: 'int-12', name: '6sense', category: 'Intent Data', status: 'connected', icon: '🎯', syncFrequency: 'Daily', lastSync: '2026-05-19T02:00:00Z', recordsSynced: 567 },
  { id: 'int-13', name: 'LinkedIn Sales Nav', category: 'Social', status: 'connected', icon: '💼', syncFrequency: 'Every 15 min', lastSync: '2026-05-19T14:15:00Z', recordsSynced: 234 },
  { id: 'int-14', name: 'Highspot', category: 'Content', status: 'connected', icon: '📊', syncFrequency: 'Daily', lastSync: '2026-05-19T02:00:00Z', recordsSynced: 89 },
  { id: 'int-15', name: 'Snowflake', category: 'Data Cloud', status: 'connected', icon: '❄️', syncFrequency: 'Daily 02:00 UTC', lastSync: '2026-05-19T02:00:00Z', recordsSynced: 45200 },
  { id: 'int-16', name: 'Twilio', category: 'Telephony', status: 'connected', icon: '📱', syncFrequency: 'Real-time', lastSync: '2026-05-19T14:00:00Z', recordsSynced: 420 },
];

// ─── Capture Stats (BRD §6.1) ────────────────────────────────────────────────
export const MOCK_CAPTURE_STATS = {
  totalInteractions: 26457,
  last24h: 342,
  last7d: 2180,
  captureRate: 99.7,
  channelBreakdown: [
    { channel: 'Calls', count: 8420, icon: '📞', color: '#818cf8', pct: 31.8 },
    { channel: 'Emails', count: 9830, icon: '✉️', color: '#38bdf8', pct: 37.2 },
    { channel: 'Meetings', count: 4210, icon: '📅', color: '#10b981', pct: 15.9 },
    { channel: 'Calendar', count: 2100, icon: '🗓️', color: '#f59e0b', pct: 7.9 },
    { channel: 'SMS', count: 987, icon: '💬', color: '#ec4899', pct: 3.7 },
    { channel: 'LinkedIn', count: 560, icon: '💼', color: '#0ea5e9', pct: 2.1 },
    { channel: 'External', count: 350, icon: '📤', color: '#a78bfa', pct: 1.3 },
  ],
  mappingAccuracy: 96.2,
  autoLinked: 95.1,
  aiAssisted: 4.9,
  avgLinkingTime: '< 3 min',
};

// ─── Compliance Status (BRD §6.7) ────────────────────────────────────────────
export const MOCK_COMPLIANCE = {
  standards: [
    { name: 'SOC 2 Type II', status: 'compliant', lastAudit: '2026-04-15', icon: '🛡️' },
    { name: 'HIPAA', status: 'compliant', lastAudit: '2026-03-20', icon: '🏥' },
    { name: 'PCI DSS', status: 'compliant', lastAudit: '2026-04-01', icon: '💳' },
    { name: 'GDPR/DFF', status: 'compliant', lastAudit: '2026-04-10', icon: '🇪🇺' },
    { name: 'STAR Level 1', status: 'compliant', lastAudit: '2026-03-01', icon: '⭐' },
  ],
  encryption: { inTransit: 'TLS 1.3', atRest: 'AES-256', credentialStore: 'AWS Secrets Manager' },
  rbac: { totalRoles: 5, activeUsers: 142, policiesConfigured: 12 },
  retentionPolicy: '24 months',
};

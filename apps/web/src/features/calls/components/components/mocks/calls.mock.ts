// ============================================================
// Mock Data — matches actual API response shapes exactly.
// Used ONLY as fallback when real API is unavailable.
// ============================================================

import type {
  CallsListResponse,
  AccountsResponse,
  ParticipantsResponse,
  CallMetadata,
  BriefsListResponse,
  BriefDetail,
  BriefTemplatesResponse,
  BriefPeriodsResponse,
  TranscriptResponse,
  TranscriptSummary,
  TalkRatio,
  AudioMeta,
  TopicsResponse,
  NextStepsResponse,
  GenerateBriefResponse,
  ShareLinkResponse,
  FormattedSummaryResponse,
  NoteResponse,
  CallShareResponse,
} from '../types/calls.types';

// ─── Calls List ───────────────────────────────────────────────

export const MOCK_CALLS_LIST: CallsListResponse & { calls: (import('../types/calls.types').CallListItem & { audioUrl?: string })[] } = {
  totalCount: 10,
  page: 1,
  size: 20,
  calls: [
    {
      callId: 'call_a1b2c3d4e5f6',
      callTitle: 'Q3 Budget Review',
      dealType: 'New Business',
      account: 'Acme Corp',
      owner: { ownerId: 'usr_001', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
      dateTime: '2026-05-03T16:00:00-05:00',
      duration: '24:12',
      keyInsight: 'Customer asked about pricing tiers and ROI breakdown',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_b2c3d4e5f6g7',
      callTitle: 'Contract Terms Discussion',
      dealType: 'Renewal',
      account: 'Globex Inc',
      owner: { ownerId: 'usr_001', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
      dateTime: '2026-05-01T21:15:00-05:00',
      duration: '12:05',
      keyInsight: 'Follow-up required on data migration SLA details',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_c3d4e5f6g7h8',
      callTitle: 'Product Demo — Enterprise Tier',
      dealType: 'New Business',
      account: 'Initech Solutions',
      owner: { ownerId: 'usr_002', ownerName: 'Maria Santos', avatarInitials: 'MS' },
      dateTime: '2026-04-29T14:30:00-05:00',
      duration: '38:47',
      keyInsight: 'Strong interest in custom API integrations',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_d4e5f6g7h8i9',
      callTitle: 'Onboarding Kickoff',
      dealType: 'Expansion',
      account: 'Umbrella Corp',
      owner: { ownerId: 'usr_003', ownerName: 'James Nguyen', avatarInitials: 'JN' },
      dateTime: '2026-04-28T10:00:00-05:00',
      duration: '55:20',
      keyInsight: 'Customer requested dedicated CSM assignment',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_e5f6g7h8i9j0',
      callTitle: 'Security Compliance Review',
      dealType: 'Renewal',
      account: 'Cyberdyne Systems',
      owner: { ownerId: 'usr_004', ownerName: 'Priya Mehta', avatarInitials: 'PM' },
      dateTime: '2026-04-27T09:00:00-05:00',
      duration: '18:33',
      keyInsight: 'SOC 2 report needed before contract renewal',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_f6g7h8i9j0k1',
      callTitle: 'Initial Discovery Call',
      dealType: 'New Business',
      account: 'Hooli Inc',
      owner: { ownerId: 'usr_002', ownerName: 'Maria Santos', avatarInitials: 'MS' },
      dateTime: '2026-04-25T15:45:00-05:00',
      duration: '1:48',
      keyInsight: 'Prospect exploring multiple vendors',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    },
    {
      callId: 'call_g7h8i9j0k1l2',
      callTitle: 'Technical Integration Workshop',
      dealType: 'New Business',
      account: 'Pied Piper',
      owner: { ownerId: 'usr_005', ownerName: 'Daniel Park', avatarInitials: 'DP' },
      dateTime: '2026-04-24T11:00:00-05:00',
      duration: '1:12:05',
      keyInsight: 'API rate limits and webhook reliability discussed',
      status: 'processing',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    },
    {
      callId: 'call_h8i9j0k1l2m3',
      callTitle: 'Pricing Negotiation Final Round',
      dealType: 'Renewal',
      account: 'Dunder Mifflin',
      owner: { ownerId: 'usr_001', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
      dateTime: '2026-04-22T16:00:00-05:00',
      duration: '8:45',
      keyInsight: '15% discount approved by VP',
      status: 'failed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_i9j0k1l2m3n4',
      callTitle: 'Executive Stakeholder Alignment',
      dealType: 'Expansion',
      account: 'Massive Dynamic',
      owner: { ownerId: 'usr_003', ownerName: 'James Nguyen', avatarInitials: 'JN' },
      dateTime: '2026-04-21T13:30:00-05:00',
      duration: '45:00',
      keyInsight: 'Board approval required before sign-off',
      status: 'completed',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
      callId: 'call_j0k1l2m3n4o5',
      callTitle: 'Support Escalation Follow-up',
      dealType: 'Renewal',
      account: 'Acme Corp',
      owner: { ownerId: 'usr_004', ownerName: 'Priya Mehta', avatarInitials: 'PM' },
      dateTime: '2026-04-20T10:15:00-05:00',
      duration: '0:52',
      keyInsight: 'Call rescheduled due to technical difficulties on customer end',
      status: 'skipped',
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    },
  ],
};

// ─── Accounts ─────────────────────────────────────────────────

export const MOCK_ACCOUNTS: AccountsResponse = {
  accounts: [
    { accountId: 'acc_001', accountName: 'Acme Corp' },
    { accountId: 'acc_002', accountName: 'Globex Inc' },
    { accountId: 'acc_003', accountName: 'Initech Solutions' },
    { accountId: 'acc_004', accountName: 'Umbrella Corp' },
    { accountId: 'acc_005', accountName: 'Cyberdyne Systems' },
    { accountId: 'acc_006', accountName: 'Hooli Inc' },
    { accountId: 'acc_007', accountName: 'Pied Piper' },
    { accountId: 'acc_008', accountName: 'Dunder Mifflin' },
    { accountId: 'acc_009', accountName: 'Massive Dynamic' },
    { accountId: 'acc_010', accountName: 'Stark Industries' },
    { accountId: 'acc_011', accountName: 'Wayne Enterprises' },
    { accountId: 'acc_012', accountName: 'Soylent Corp' },
    { accountId: 'acc_013', accountName: 'Vandelay Industries' },
    { accountId: 'acc_014', accountName: 'Bluth Company' },
    { accountId: 'acc_015', accountName: 'Sterling Cooper' },
  ],
};

// ─── Participants ─────────────────────────────────────────────

export const MOCK_PARTICIPANTS: ParticipantsResponse = {
  participants: [
    { participantId: 'ptc_001', name: 'John Smith' },
    { participantId: 'ptc_002', name: 'Sarah Chen' },
    { participantId: 'ptc_003', name: 'Michael Torres' },
    { participantId: 'ptc_004', name: 'Linda Park' },
    { participantId: 'ptc_005', name: 'Robert Kim' },
    { participantId: 'ptc_006', name: 'Angela Wu' },
    { participantId: 'ptc_007', name: 'Kevin Patel' },
    { participantId: 'ptc_008', name: 'Sophia Lee' },
    { participantId: 'ptc_009', name: 'Marcus Johnson' },
    { participantId: 'ptc_010', name: 'Natalie Brooks' },
  ],
};

// ─── Call Metadata ────────────────────────────────────────────

export const MOCK_CALL_METADATA: CallMetadata & { audioUrl?: string } = {
  callId: 'call_a1b2c3d4e5f6',
  callTitle: 'Q3 Budget Review',
  account: 'Acme Corp',
  type: 'outbound',
  dealType: 'New Business',
  date: 'May 3, 2026',
  time: '4:00 PM EST',
  duration: '24:12',
  source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
  participants: [{ name: 'John Smith' }, { name: 'Sarah Chen' }],
  owner: { ownerId: 'usr_001', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
};


export const MOCK_CALL_METADATA_MAP: Record<string, CallMetadata & { audioUrl?: string }> = {
  'call_a1b2c3d4e5f6': {
    callId: 'call_a1b2c3d4e5f6',
    callTitle: 'Q3 Budget Review',
    account: 'Acme Corp',
    type: 'outbound',
    dealType: 'New Business',
    date: 'May 3, 2026',
    time: '4:00 PM EST',
    duration: '24:12',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'John Smith' }, { name: 'Sarah Chen' }],
    owner: { ownerId: 'usr', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
  },
  'call_b2c3d4e5f6g7': {
    callId: 'call_b2c3d4e5f6g7',
    callTitle: 'Contract Terms Discussion',
    account: 'Globex Inc',
    type: 'outbound',
    dealType: 'Renewal',
    date: 'May 1, 2026',
    time: '9:15 PM EST',
    duration: '12:05',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Sarah Chen' }, { name: 'Marcus Johnson' }],
    owner: { ownerId: 'usr', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
  },
  'call_c3d4e5f6g7h8': {
    callId: 'call_c3d4e5f6g7h8',
    callTitle: 'Product Demo — Enterprise Tier',
    account: 'Initech Solutions',
    type: 'outbound',
    dealType: 'New Business',
    date: 'Apr 29, 2026',
    time: '2:30 PM EST',
    duration: '38:47',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Michael Torres' }, { name: 'Linda Park' }],
    owner: { ownerId: 'usr', ownerName: 'Maria Santos', avatarInitials: 'MS' },
  },
  'call_d4e5f6g7h8i9': {
    callId: 'call_d4e5f6g7h8i9',
    callTitle: 'Onboarding Kickoff',
    account: 'Umbrella Corp',
    type: 'outbound',
    dealType: 'Expansion',
    date: 'Apr 28, 2026',
    time: '10:00 AM EST',
    duration: '55:20',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Linda Park' }, { name: 'Robert Kim' }],
    owner: { ownerId: 'usr', ownerName: 'James Nguyen', avatarInitials: 'JN' },
  },
  'call_e5f6g7h8i9j0': {
    callId: 'call_e5f6g7h8i9j0',
    callTitle: 'Security Compliance Review',
    account: 'Cyberdyne Systems',
    type: 'outbound',
    dealType: 'Renewal',
    date: 'Apr 27, 2026',
    time: '9:00 AM EST',
    duration: '18:33',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Robert Kim' }, { name: 'Angela Wu' }],
    owner: { ownerId: 'usr', ownerName: 'Priya Mehta', avatarInitials: 'PM' },
  },
  'call_f6g7h8i9j0k1': {
    callId: 'call_f6g7h8i9j0k1',
    callTitle: 'Initial Discovery Call',
    account: 'Hooli Inc',
    type: 'outbound',
    dealType: 'New Business',
    date: 'Apr 25, 2026',
    time: '3:45 PM EST',
    duration: '1:48',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    participants: [{ name: 'Angela Wu' }, { name: 'Kevin Patel' }],
    owner: { ownerId: 'usr', ownerName: 'Maria Santos', avatarInitials: 'MS' },
  },
  'call_g7h8i9j0k1l2': {
    callId: 'call_g7h8i9j0k1l2',
    callTitle: 'Technical Integration Workshop',
    account: 'Pied Piper',
    type: 'outbound',
    dealType: 'New Business',
    date: 'Apr 24, 2026',
    time: '11:00 AM EST',
    duration: '1:12:05',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    participants: [{ name: 'Kevin Patel' }, { name: 'Sophia Lee' }],
    owner: { ownerId: 'usr', ownerName: 'Daniel Park', avatarInitials: 'DP' },
  },
  'call_h8i9j0k1l2m3': {
    callId: 'call_h8i9j0k1l2m3',
    callTitle: 'Pricing Negotiation Final Round',
    account: 'Dunder Mifflin',
    type: 'outbound',
    dealType: 'Renewal',
    date: 'Apr 22, 2026',
    time: '4:00 PM EST',
    duration: '8:45',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Sophia Lee' }, { name: 'Marcus Johnson' }],
    owner: { ownerId: 'usr', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
  },
  'call_i9j0k1l2m3n4': {
    callId: 'call_i9j0k1l2m3n4',
    callTitle: 'Executive Stakeholder Alignment',
    account: 'Massive Dynamic',
    type: 'outbound',
    dealType: 'Expansion',
    date: 'Apr 21, 2026',
    time: '1:30 PM EST',
    duration: '45:00',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    participants: [{ name: 'Marcus Johnson' }, { name: 'Natalie Brooks' }],
    owner: { ownerId: 'usr', ownerName: 'James Nguyen', avatarInitials: 'JN' },
  },
  'call_j0k1l2m3n4o5': {
    callId: 'call_j0k1l2m3n4o5',
    callTitle: 'Support Escalation Follow-up',
    account: 'Acme Corp',
    type: 'outbound',
    dealType: 'Renewal',
    date: 'Apr 20, 2026',
    time: '10:15 AM EST',
    duration: '0:52',
    source: 'Zoom',
    audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    participants: [{ name: 'Natalie Brooks' }, { name: 'John Smith' }],
    owner: { ownerId: 'usr', ownerName: 'Priya Mehta', avatarInitials: 'PM' },
  },
};

export const MOCK_BRIEF_DETAIL_MAP: Record<string, BriefDetail> = {
  'call_a1b2c3d4e5f6': {
    briefId: 'brief_call_a1b2c3d4e5f6',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on budget planning and their evaluation of our enterprise plan. The theme was budget discussions.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about budget discussions' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Acme Corp', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_b2c3d4e5f6g7': {
    briefId: 'brief_call_b2c3d4e5f6g7',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on discussing the upcoming contract renewal and SLA terms. The theme was renewal calls.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about renewal calls' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Globex Inc', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_c3d4e5f6g7h8': {
    briefId: 'brief_call_c3d4e5f6g7h8',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on demonstrating the enterprise tier to upsell from the business plan. The theme was upsell discussions.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about upsell discussions' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Initech Solutions', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_d4e5f6g7h8i9': {
    briefId: 'brief_call_d4e5f6g7h8i9',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on kicking off the implementation and onboarding for a new customer. The theme was onboarding calls.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about onboarding calls' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Umbrella Corp', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_e5f6g7h8i9j0': {
    briefId: 'brief_call_e5f6g7h8i9j0',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on reviewing security compliance and addressing unexpected compliance fees. The theme was pricing concerns.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about pricing concerns' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Cyberdyne Systems', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_f6g7h8i9j0k1': {
    briefId: 'brief_call_f6g7h8i9j0k1',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on discovering new pain points and proposing our analytics module. The theme was cross-sell opportunities.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about cross-sell opportunities' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Hooli Inc', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_g7h8i9j0k1l2': {
    briefId: 'brief_call_g7h8i9j0k1l2',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on planning the technical integration phase with their engineering team. The theme was implementation planning.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about implementation planning' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Pied Piper', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_h8i9j0k1l2m3': {
    briefId: 'brief_call_h8i9j0k1l2m3',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on finalizing the enterprise agreement and discount structure. The theme was enterprise negotiations.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about enterprise negotiations' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Dunder Mifflin', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_i9j0k1l2m3n4': {
    briefId: 'brief_call_i9j0k1l2m3n4',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on aligning with the board on the strategic value of the platform. The theme was executive stakeholder review.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about executive stakeholder review' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Massive Dynamic', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
  'call_j0k1l2m3n4o5': {
    briefId: 'brief_call_j0k1l2m3n4o5',
    briefTemplate: 'Executive Summary',
    period: 'Last 30 days',
    generatedAt: '2026-05-19T14:45:00Z',
    generatedFrom: 'Executive Summary',
    overview: {
      text: "This call focused on addressing the recent critical bugs and support delays. The theme was support escalation.",
    },
    keyDiscussionPoints: [
      { timestamp: '1:45', description: 'Discussed main objectives' },
      { timestamp: '5:20', description: 'Addressed concerns about support escalation' },
    ],
    customerNeeds: [
      { title: 'Reliability', description: 'Need a reliable solution' },
      { title: 'ROI', description: 'Need clear return on investment' },
    ],
    risks: [
      { title: 'Timeline', description: 'Potential delays', severity: 'medium' },
      { title: 'Budget', description: 'Strict constraints', severity: 'high' },
    ],
    commitments: [
      { description: 'Send follow up email', assigneeType: 'rep', dueDate: '2026-05-22' },
    ],
    stakeholders: [
      { name: 'John Doe', title: 'Director', company: 'Acme Corp', avatarInitials: 'JD' },
    ],
    activityContext: [
      { date: '2026-05-18', type: 'email', description: 'Sent agenda' },
    ],
  },
};

export const MOCK_TRANSCRIPT_MAP: Record<string, TranscriptResponse> = {
  'call_a1b2c3d4e5f6': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Alex', speakerType: 'rep', text: `Hi John, thanks for taking the time today.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'John', speakerType: 'customer', text: `Ready to dive into the Q3 numbers.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Alex', speakerType: 'rep', text: `Great! I wanted to walk you through our enterprise plan.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'John', speakerType: 'customer', text: `The pricing tiers are interesting. How does it compare?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Sarah', speakerType: 'customer', text: `Is there a hard cap on the budget?`, confidence: 'low' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Alex', speakerType: 'rep', text: `No, we can be flexible on the terms.`, confidence: 'high' },
    ],
  },
  'call_b2c3d4e5f6g7': {
    totalCount: 5,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Alex', speakerType: 'rep', text: `Welcome. I see your contract is up next month.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Tom', speakerType: 'customer', text: `Yes, we want to renew, but the SLA terms are strict.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Alex', speakerType: 'rep', text: `We can adjust the SLA if you sign a 2-year deal.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Tom', speakerType: 'customer', text: `Let me run that by our legal department.`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Tom', speakerType: 'customer', text: `I think 99.9% uptime is required.`, confidence: 'low' },
    ],
  },
  'call_c3d4e5f6g7h8': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Maria', speakerType: 'rep', text: `Thanks for joining. Today I will show you the Enterprise features.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Bill', speakerType: 'customer', text: `We are mainly interested in the advanced security controls.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Maria', speakerType: 'rep', text: `Sure. Here is the SSO and role-based access panel.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Michael', speakerType: 'customer', text: `Can we integrate this with Okta?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Maria', speakerType: 'rep', text: `Yes, Okta integration is fully supported out of the box.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Michael', speakerType: 'customer', text: `What about custom SAML configurations?`, confidence: 'low' },
    ],
  },
  'call_d4e5f6g7h8i9': {
    totalCount: 5,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'James', speakerType: 'rep', text: `Welcome to the platform! Lets review the onboarding timeline.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Alice', speakerType: 'customer', text: `We have 50 users that need training by next week.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'James', speakerType: 'rep', text: `We can schedule two live training sessions.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Alice', speakerType: 'customer', text: `Will you provide recorded sessions as well?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'James', speakerType: 'rep', text: `I might need to check if the recordings expire.`, confidence: 'low' },
    ],
  },
  'call_e5f6g7h8i9j0': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Priya', speakerType: 'rep', text: `I understand you had questions about the compliance add-on pricing.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Miles', speakerType: 'customer', text: `Yes, $5k for the SOC2 report seems high.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Priya', speakerType: 'rep', text: `That covers the annual audit costs we incur.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Miles', speakerType: 'customer', text: `If we pay upfront, can we waive that fee?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Priya', speakerType: 'rep', text: `I can take that back to our finance team for approval.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Priya', speakerType: 'rep', text: `Though I am not certain they will approve a full waiver.`, confidence: 'low' },
    ],
  },
  'call_f6g7h8i9j0k1': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Maria', speakerType: 'rep', text: `Tell me about the challenges you are facing with reporting.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Gavin', speakerType: 'customer', text: `We spend 10 hours a week manually compiling data.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Maria', speakerType: 'rep', text: `Our analytics module automates all of that.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Gavin', speakerType: 'customer', text: `Does it integrate with our internal data warehouse?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Maria', speakerType: 'rep', text: `Yes, via our secure API.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Gavin', speakerType: 'customer', text: `I wonder how long the data sync takes.`, confidence: 'low' },
    ],
  },
  'call_g7h8i9j0k1l2': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Daniel', speakerType: 'rep', text: `Let's go over the API architecture.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'Richard', speakerType: 'customer', text: `We need real-time webhooks for the user events.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Daniel', speakerType: 'rep', text: `We support Webhooks with a 99.9% delivery rate.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'Richard', speakerType: 'customer', text: `What is the rate limit on the endpoints?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Daniel', speakerType: 'rep', text: `It's 1000 requests per minute on the enterprise tier.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Daniel', speakerType: 'rep', text: `But we might be able to increase that if needed.`, confidence: 'low' },
    ],
  },
  'call_h8i9j0k1l2m3': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Alex', speakerType: 'rep', text: `We can offer a 15% discount for a 3-year commitment.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'David', speakerType: 'customer', text: `Our CFO is asking for 20%.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Alex', speakerType: 'rep', text: `If we do 20%, we have to remove the premium support.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'David', speakerType: 'customer', text: `We definitely need the premium support.`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Alex', speakerType: 'rep', text: `Let's meet in the middle at 17.5% with support included.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'David', speakerType: 'customer', text: `I think that could work, let me check.`, confidence: 'low' },
    ],
  },
  'call_i9j0k1l2m3n4': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'James', speakerType: 'rep', text: `The goal today is to align on the strategic impact.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'William', speakerType: 'customer', text: `The board needs to see the long-term ROI.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'James', speakerType: 'rep', text: `We project a 300% ROI over the first 24 months.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'William', speakerType: 'customer', text: `That sounds promising. Do you have case studies?`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'James', speakerType: 'rep', text: `Yes, I will send them over immediately after this call.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'William', speakerType: 'customer', text: `Are they in the same industry as us?`, confidence: 'low' },
    ],
  },
  'call_j0k1l2m3n4o5': {
    totalCount: 6,
    transcript: [
      { entryId: 'te_0', timestamp: '0:00', speakerName: 'Priya', speakerType: 'rep', text: `I wanted to apologize for the delay in the ticket resolution.`, confidence: 'high' },
      { entryId: 'te_1', timestamp: '0:01', speakerName: 'John', speakerType: 'customer', text: `It took 3 days to fix a critical bug.`, confidence: 'high' },
      { entryId: 'te_2', timestamp: '0:02', speakerName: 'Priya', speakerType: 'rep', text: `We have assigned a dedicated escalation engineer to your account.`, confidence: 'high' },
      { entryId: 'te_3', timestamp: '0:03', speakerName: 'John', speakerType: 'customer', text: `That helps. We can't afford another outage.`, confidence: 'high' },
      { entryId: 'te_4', timestamp: '0:04', speakerName: 'Priya', speakerType: 'rep', text: `We are implementing new monitoring to catch this earlier.`, confidence: 'high' },
      { entryId: 'te_5', timestamp: '0:05', speakerName: 'Priya', speakerType: 'rep', text: `The root cause might have been a database lock.`, confidence: 'low' },
    ],
  },
};

export const MOCK_TRANSCRIPT_SUMMARY_MAP: Record<string, TranscriptSummary> = {
  'call_a1b2c3d4e5f6': {
    summary: 'Summary for Q3 Budget Review: The main theme of the discussion was budget discussions.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_b2c3d4e5f6g7': {
    summary: 'Summary for Contract Terms Discussion: The main theme of the discussion was renewal calls.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_c3d4e5f6g7h8': {
    summary: 'Summary for Product Demo — Enterprise Tier: The main theme of the discussion was upsell discussions.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_d4e5f6g7h8i9': {
    summary: 'Summary for Onboarding Kickoff: The main theme of the discussion was onboarding calls.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_e5f6g7h8i9j0': {
    summary: 'Summary for Security Compliance Review: The main theme of the discussion was pricing concerns.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_f6g7h8i9j0k1': {
    summary: 'Summary for Initial Discovery Call: The main theme of the discussion was cross-sell opportunities.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_g7h8i9j0k1l2': {
    summary: 'Summary for Technical Integration Workshop: The main theme of the discussion was implementation planning.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_h8i9j0k1l2m3': {
    summary: 'Summary for Pricing Negotiation Final Round: The main theme of the discussion was enterprise negotiations.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_i9j0k1l2m3n4': {
    summary: 'Summary for Executive Stakeholder Alignment: The main theme of the discussion was executive stakeholder review.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
  'call_j0k1l2m3n4o5': {
    summary: 'Summary for Support Escalation Follow-up: The main theme of the discussion was support escalation.',
    generatedAt: '2026-05-03T18:00:00Z',
  },
};

export const MOCK_TALK_RATIO_MAP: Record<string, TalkRatio> = {
  'call_a1b2c3d4e5f6': {
    rep: { percentage: 42 },
    customer: { percentage: 58 },
  },
  'call_b2c3d4e5f6g7': {
    rep: { percentage: 55 },
    customer: { percentage: 45 },
  },
  'call_c3d4e5f6g7h8': {
    rep: { percentage: 60 },
    customer: { percentage: 40 },
  },
  'call_d4e5f6g7h8i9': {
    rep: { percentage: 35 },
    customer: { percentage: 65 },
  },
  'call_e5f6g7h8i9j0': {
    rep: { percentage: 48 },
    customer: { percentage: 52 },
  },
  'call_f6g7h8i9j0k1': {
    rep: { percentage: 30 },
    customer: { percentage: 70 },
  },
  'call_g7h8i9j0k1l2': {
    rep: { percentage: 65 },
    customer: { percentage: 35 },
  },
  'call_h8i9j0k1l2m3': {
    rep: { percentage: 50 },
    customer: { percentage: 50 },
  },
  'call_i9j0k1l2m3n4': {
    rep: { percentage: 40 },
    customer: { percentage: 60 },
  },
  'call_j0k1l2m3n4o5': {
    rep: { percentage: 70 },
    customer: { percentage: 30 },
  },
};

export const MOCK_TOPICS_MAP: Record<string, TopicsResponse> = {
  'call_a1b2c3d4e5f6': {
    topics: [
      { topicId: 'tp_0', label: 'Pricing', timestamp: '1:05', description: 'Discussed Pricing', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Integration', timestamp: '1:15', description: 'Discussed Integration', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Question', timestamp: '1:25', description: 'Discussed Question', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_b2c3d4e5f6g7': {
    topics: [
      { topicId: 'tp_0', label: 'Renewal', timestamp: '1:05', description: 'Discussed Renewal', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'SLA', timestamp: '1:15', description: 'Discussed SLA', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Legal', timestamp: '1:25', description: 'Discussed Legal', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_c3d4e5f6g7h8': {
    topics: [
      { topicId: 'tp_0', label: 'Demo', timestamp: '1:05', description: 'Discussed Demo', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Enterprise', timestamp: '1:15', description: 'Discussed Enterprise', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Security', timestamp: '1:25', description: 'Discussed Security', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_d4e5f6g7h8i9': {
    topics: [
      { topicId: 'tp_0', label: 'Onboarding', timestamp: '1:05', description: 'Discussed Onboarding', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Timeline', timestamp: '1:15', description: 'Discussed Timeline', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Training', timestamp: '1:25', description: 'Discussed Training', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_e5f6g7h8i9j0': {
    topics: [
      { topicId: 'tp_0', label: 'Compliance', timestamp: '1:05', description: 'Discussed Compliance', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Pricing', timestamp: '1:15', description: 'Discussed Pricing', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'SOC2', timestamp: '1:25', description: 'Discussed SOC2', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_f6g7h8i9j0k1': {
    topics: [
      { topicId: 'tp_0', label: 'Discovery', timestamp: '1:05', description: 'Discussed Discovery', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Analytics', timestamp: '1:15', description: 'Discussed Analytics', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Pain Points', timestamp: '1:25', description: 'Discussed Pain Points', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_g7h8i9j0k1l2': {
    topics: [
      { topicId: 'tp_0', label: 'API', timestamp: '1:05', description: 'Discussed API', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Webhooks', timestamp: '1:15', description: 'Discussed Webhooks', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Architecture', timestamp: '1:25', description: 'Discussed Architecture', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_h8i9j0k1l2m3': {
    topics: [
      { topicId: 'tp_0', label: 'Negotiation', timestamp: '1:05', description: 'Discussed Negotiation', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Discount', timestamp: '1:15', description: 'Discussed Discount', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Sign-off', timestamp: '1:25', description: 'Discussed Sign-off', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_i9j0k1l2m3n4': {
    topics: [
      { topicId: 'tp_0', label: 'Strategy', timestamp: '1:05', description: 'Discussed Strategy', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Board', timestamp: '1:15', description: 'Discussed Board', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Value', timestamp: '1:25', description: 'Discussed Value', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
  'call_j0k1l2m3n4o5': {
    topics: [
      { topicId: 'tp_0', label: 'Escalation', timestamp: '1:05', description: 'Discussed Escalation', color: ['#22c55e', '#3b82f6', '#f59e0b'][0 % 3] },
      { topicId: 'tp_1', label: 'Bugs', timestamp: '1:15', description: 'Discussed Bugs', color: ['#22c55e', '#3b82f6', '#f59e0b'][1 % 3] },
      { topicId: 'tp_2', label: 'Support', timestamp: '1:25', description: 'Discussed Support', color: ['#22c55e', '#3b82f6', '#f59e0b'][2 % 3] },
    ],
  },
};

export const MOCK_NEXT_STEPS_MAP: Record<string, NextStepsResponse> = {
  'call_a1b2c3d4e5f6': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for budget discussions', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_b2c3d4e5f6g7': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for renewal calls', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_c3d4e5f6g7h8': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for upsell discussions', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_d4e5f6g7h8i9': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for onboarding calls', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_e5f6g7h8i9j0': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for pricing concerns', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_f6g7h8i9j0k1': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for cross-sell opportunities', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_g7h8i9j0k1l2': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for implementation planning', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_h8i9j0k1l2m3': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for enterprise negotiations', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_i9j0k1l2m3n4': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for executive stakeholder review', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
  'call_j0k1l2m3n4o5': {
    nextSteps: [
      { stepId: 'ns_1', description: 'Schedule follow up for support escalation', completed: false },
      { stepId: 'ns_2', description: 'Send proposal document', completed: false },
    ],
  },
};

// ─── Briefs List ──────────────────────────────────────────────

export const MOCK_BRIEFS_LIST: BriefsListResponse = {
  briefs: [
    {
      briefId: 'brief_x1y2z3a4b5',
      briefTemplate: 'Executive Summary',
      period: 'Last 30 days',
      generatedAt: '2026-05-19T14:45:00Z',
      generatedFrom: 'Executive Summary',
    },
    {
      briefId: 'brief_m2n3o4p5q6',
      briefTemplate: 'Sales Playbook',
      period: 'Last 7 days',
      generatedAt: '2026-05-12T09:30:00Z',
      generatedFrom: 'Sales Playbook',
    },
    {
      briefId: 'brief_r3s4t5u6v7',
      briefTemplate: 'Customer Success',
      period: 'Last 90 days',
      generatedAt: '2026-05-05T11:00:00Z',
      generatedFrom: 'Customer Success',
    },
  ],
};

// ─── Brief Templates ──────────────────────────────────────────

export const MOCK_BRIEF_TEMPLATES: BriefTemplatesResponse = {
  templates: [
    { templateId: 'tmpl_001', templateName: 'Executive Summary' },
    { templateId: 'tmpl_002', templateName: 'Sales Playbook' },
    { templateId: 'tmpl_003', templateName: 'Customer Success' },
    { templateId: 'tmpl_004', templateName: 'Technical Review' },
    { templateId: 'tmpl_005', templateName: 'Deal Risk Assessment' },
    { templateId: 'tmpl_006', templateName: 'Competitive Analysis' },
    { templateId: 'tmpl_007', templateName: 'Onboarding Checklist' },
  ],
};

// ─── Brief Periods ────────────────────────────────────────────

export const MOCK_BRIEF_PERIODS: BriefPeriodsResponse = {
  periods: [
    { periodId: 'period_7d', periodLabel: 'Last 7 days' },
    { periodId: 'period_30d', periodLabel: 'Last 30 days' },
    { periodId: 'period_90d', periodLabel: 'Last 90 days' },
    { periodId: 'period_6m', periodLabel: 'Last 6 months' },
    { periodId: 'period_1y', periodLabel: 'Last 1 year' },
    { periodId: 'period_all', periodLabel: 'All time' },
  ],
};

// ─── Generate Brief ───────────────────────────────────────────

export const MOCK_GENERATE_BRIEF: GenerateBriefResponse = {
  briefId: 'brief_w9x8y7z6a5',
  briefTemplate: 'Executive Summary',
  period: 'Last 30 days',
  generatedAt: '2026-05-27T08:15:00Z',
  status: 'processing',
};

// ─── Share Link ───────────────────────────────────────────────

export const MOCK_SHARE_LINK: ShareLinkResponse = {
  shareableLink: 'https://app.callintel.io/shared/brief/tkn_8f3d2a1e9c4b7d6f0e5a2c8b1d4f7e3a',
  expiresAt: '2026-06-27T08:15:00Z',
};

// ─── Formatted Summary ────────────────────────────────────────

export const MOCK_FORMATTED_SUMMARY: FormattedSummaryResponse = {
  formattedText: `CALL BRIEF — Mock Data
Account: Acme Corp | Date: May 3, 2026
OVERVIEW: This is a generated fallback summary.`,
};


export const MOCK_AUDIO = undefined as any;

// ─── Regenerate Brief ─────────────────────────────────────────
// Mock for: POST /api/v1/conversation-intelligence/calls/:callId/briefs/:briefId/regenerate

export const MOCK_REGENERATE_BRIEF: GenerateBriefResponse = {
  briefId: 'brief_x1y2z3a4b5',
  briefTemplate: 'Executive Summary',
  period: 'Last 30 days',
  generatedAt: '2026-05-28T12:00:00Z',
  status: 'completed',
};

// ─── Note Response ────────────────────────────────────────────
// Mock for: POST /api/v1/conversation-intelligence/calls/:callId/notes

export const MOCK_NOTE_RESPONSE: NoteResponse = {
  noteId: 'note_a1b2c3d4e5',
  callId: 'call_a1b2c3d4e5f6',
  note: 'Customer requested pricing clarification and asked about volume discounts',
  userId: 'usr_001',
  timestamp: '2026-05-28T12:00:00Z',
  createdAt: '2026-05-28T12:00:00Z',
};

// ─── Call Share Response ──────────────────────────────────────
// Mock for: POST /api/v1/conversation-intelligence/calls/:callId/share

export const MOCK_CALL_SHARE_RESPONSE: CallShareResponse = {
  shareableLink: 'https://app.callintel.io/shared/call/call_a1b2c3d4e5f6?token=tkn_9f8e7d6c5b4a',
  expiresAt: '2026-06-28T12:00:00Z',
};

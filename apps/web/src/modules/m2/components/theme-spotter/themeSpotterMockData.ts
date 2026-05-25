import { Theme, ThemeAlert } from './themeSpotterTypes';

export const MOCK_THEMES: Theme[] = [
  {
    id: 'theme-1', analysisId: 'ana-1',
    name: 'Pricing & Cost Concerns',
    summary: 'Customers frequently raise questions about pricing tiers, discounts, and budget constraints during sales conversations.',
    callCount: 18, accountCount: 12, associatedRevenue: 245000,
    confidenceScore: 0.87, status: 'ACCEPTED', trend: 'RISING',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    quotes: [
      { id: 'q1', themeId: 'theme-1', snippet: 'The pricing feels quite steep compared to what we expected for this tier.', speakerSide: 'customer', confidenceScore: 0.91, createdAt: new Date().toISOString() },
      { id: 'q2', themeId: 'theme-1', snippet: 'Our budget approval for Q3 is still pending — can we discuss a discount?', speakerSide: 'customer', confidenceScore: 0.85, createdAt: new Date().toISOString() },
    ]
  },
  {
    id: 'theme-2', analysisId: 'ana-1',
    name: 'Competitor Comparisons',
    summary: 'Prospects consistently compare the platform to Salesforce and HubSpot, asking for differentiation rationale.',
    callCount: 14, accountCount: 9, associatedRevenue: 178000,
    confidenceScore: 0.82, status: 'ACCEPTED', trend: 'STABLE',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    quotes: [
      { id: 'q3', themeId: 'theme-2', snippet: 'We are also evaluating Salesforce — how do you differentiate on AI features?', speakerSide: 'customer', confidenceScore: 0.88, createdAt: new Date().toISOString() },
    ]
  },
  {
    id: 'theme-3', analysisId: 'ana-1',
    name: 'Integration & API Needs',
    summary: 'Teams express strong need for CRM integration, API access, and data export capabilities before committing.',
    callCount: 11, accountCount: 8, associatedRevenue: 132000,
    confidenceScore: 0.78, status: 'PENDING_REVIEW', trend: 'RISING',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    quotes: [
      { id: 'q4', themeId: 'theme-3', snippet: 'Our CRM integration is critical — if the API does not support it we cannot proceed.', speakerSide: 'customer', confidenceScore: 0.81, createdAt: new Date().toISOString() },
    ]
  },
  {
    id: 'theme-4', analysisId: 'ana-1',
    name: 'Procurement & Timeline Delays',
    summary: 'Deal closures are delayed by procurement cycles, legal reviews, and Q3 budget freezes.',
    callCount: 9, accountCount: 7, associatedRevenue: 94000,
    confidenceScore: 0.74, status: 'ACCEPTED', trend: 'STABLE',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    quotes: [
      { id: 'q5', themeId: 'theme-4', snippet: 'Legal review will take another 3 weeks — procurement is involved now.', speakerSide: 'customer', confidenceScore: 0.77, createdAt: new Date().toISOString() },
    ]
  },
  {
    id: 'theme-5', analysisId: 'ana-1',
    name: 'Onboarding & Training Requests',
    summary: 'New customers frequently request dedicated onboarding sessions and ongoing training support.',
    callCount: 7, accountCount: 5, associatedRevenue: 61000,
    confidenceScore: 0.69, status: 'ARCHIVED', trend: 'DECLINING',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
    quotes: []
  },
];

export const MOCK_ALERTS: ThemeAlert[] = [
  {
    id: 'alert-1', themeId: 'theme-1',
    conditionType: 'COUNT_THRESHOLD', thresholdValue: 10,
    timeWindowDays: 7, isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alert-2', themeId: 'theme-2',
    conditionType: 'TREND_CHANGE', thresholdValue: 5,
    timeWindowDays: 14, isActive: false,
    createdAt: new Date().toISOString(),
  },
];

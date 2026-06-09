import { apiCall } from './apiClient';
import {
  summaryMock, riskMatrixMock, compareperiodsMock,
  atRiskDealsMock, aiInsightsMock, drilldownMock,
} from '../mocks';
import type {
  SummaryResponse, RiskMatrixResponse, ComparePeriodsResponse,
  AtRiskDealsResponse, AiInsightsResponse, DrilldownResponse,
} from '../types';

const BASE = '/api/manager/deal-drivers';

type Params = { period?: string; repIds?: string[]; teamId?: string };

export const getSummary = (p: Params) =>
  apiCall<SummaryResponse>(`${BASE}/summary`, summaryMock, { method: 'GET', params: p });

export const getRiskMatrix = (p: Params) =>
  apiCall<RiskMatrixResponse>(`${BASE}/risk-matrix`, riskMatrixMock, { params: p });

export const getComparePeriods = (p: { periodA: string; periodB: string; repIds?: string[]; teamId?: string }) =>
  apiCall<ComparePeriodsResponse>(`${BASE}/compare-periods`, compareperiodsMock, { params: p });

export const getAtRiskDeals = (p: Params & { sortBy?: string; page?: number; size?: number }) =>
  apiCall<AtRiskDealsResponse>(`${BASE}/at-risk-deals`, atRiskDealsMock, { params: p });

export const getAiInsights = (p: Params) =>
  apiCall<AiInsightsResponse>(`${BASE}/ai-insights`, aiInsightsMock, { params: p });

export const getDrilldown = (p: { repId: string; warningType: string; period: string; search?: string; sortBy?: string }) =>
  apiCall<DrilldownResponse>(`${BASE}/risk-matrix/drilldown`, drilldownMock, { params: p });

export const exportDrilldown = (p: { repId: string; warningType: string; period: string }) =>
  apiCall<{ downloadUrl: string }>(
    `${BASE}/risk-matrix/drilldown/export`,
    { downloadUrl: '#mock-csv' },
    { method: 'POST', body: JSON.stringify(p) }
  );

export const exportRiskMatrix = (p: Params) =>
  apiCall<{ downloadUrl: string }>(
    `${BASE}/risk-matrix/export`,
    { downloadUrl: '#mock-matrix-csv' },
    { method: 'POST', body: JSON.stringify(p) }
  );

export const scheduleOneOnOne = (body: { repId: string; suggestedDate: string; note?: string }) =>
  apiCall<{ confirmationMessage: string; calendarEventId: string }>(
    `${BASE}/risk-matrix/schedule-1on1`,
    { confirmationMessage: '1:1 scheduled successfully (mock)', calendarEventId: 'evt_mock_123' },
    { method: 'POST', body: JSON.stringify(body) }
  );


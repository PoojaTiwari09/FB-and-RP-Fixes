import { apiClient } from '@/lib/api';
import { ActivityMetrics, BenchmarkData, CallDrilldown, DashboardStats, InteractionAnalytics, RepStats, ReviewItem, TeamAnalytics, TopicInsights } from '@/types/analytics.types';

export const analyticsService = {
  async getDashboard() {
    const { data } = await apiClient.get<DashboardStats>('/analytics/dashboard');
    return data;
  },
  async getReps() {
    const { data } = await apiClient.get<RepStats[] | { reps?: RepStats[] }>('/analytics/reps');
    return Array.isArray(data) ? data : data.reps ?? [];
  },
  async getTeam() {
    const { data } = await apiClient.get<TeamAnalytics>('/analytics/team');
    return data;
  },
  async getCallDrilldown(sessionId: string) {
    const { data } = await apiClient.get<CallDrilldown>(`/analytics/call-drilldown/${sessionId}`);
    return data;
  },
  async getRepComparison(repId: string) {
    const { data } = await apiClient.get<any>(`/analytics/compare/${repId}`);
    return data;
  },
  async getBenchmarks() {
    const { data } = await apiClient.get<BenchmarkData>('/analytics/benchmarks');
    return data;
  },
  async getManagerReview() {
    const { data } = await apiClient.get<ReviewItem[] | { reviews?: ReviewItem[] }>('/analytics/manager-review');
    return Array.isArray(data) ? data : data.reviews ?? [];
  },
  async approveReview(id: string, note: string) {
    const { data } = await apiClient.post(`/analytics/manager-review/${id}/approve`, { note });
    return data;
  },
  async rejectReview(id: string, note: string) {
    const { data } = await apiClient.post(`/analytics/manager-review/${id}/reject`, { note });
    return data;
  },
  async getActivityMetrics() {
    const { data } = await apiClient.get<ActivityMetrics>('/analytics/activity');
    return data;
  },
  async getInteractionAnalytics() {
    const { data } = await apiClient.get<InteractionAnalytics>('/analytics/interactions');
    return data;
  },
  async getTopicInsights() {
    const { data } = await apiClient.get<TopicInsights>('/analytics/topics');
    return data;
  },
  async getMyAnalytics() {
    const { data } = await apiClient.get<unknown>('/analytics/my');
    return data;
  },
  async exportReport(type: string, params: Record<string, string>) {
    const endpoint = (type === 'Training' || type === 'Completion') ? '/analytics/export-training' : '/analytics/export';
    const { data } = await apiClient.get<string>(endpoint, { params: { ...params, type, format: 'csv' } });
    return data;
  },
};

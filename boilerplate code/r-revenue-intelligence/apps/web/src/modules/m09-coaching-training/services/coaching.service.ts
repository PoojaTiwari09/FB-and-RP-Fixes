import { apiClient } from '@/lib/api';
import { Recommendation } from '@/types/coaching.types';

export const coachingService = {
  async getRecommendations() {
    const { data } = await apiClient.get<Recommendation[] | { recommendations?: Recommendation[] }>('/coaching/recommendations');
    return Array.isArray(data) ? data : data.recommendations ?? [];
  },
  async pushRecommendation(payload: { repId: string; focusArea: string; text: string }) {
    const { data } = await apiClient.post<any>('/coaching/recommendations', payload);
    return data;
  },
};

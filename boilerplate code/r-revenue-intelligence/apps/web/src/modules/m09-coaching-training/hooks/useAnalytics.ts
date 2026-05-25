import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export function useMyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'my'],
    queryFn: () => analyticsService.getMyAnalytics(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

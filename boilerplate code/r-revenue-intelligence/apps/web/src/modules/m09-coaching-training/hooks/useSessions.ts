import { useQuery } from '@tanstack/react-query';
import { sessionsService } from '@/services/sessions.service';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions', 'my'],
    queryFn: () => sessionsService.getMySessions(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

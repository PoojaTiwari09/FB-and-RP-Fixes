import { useQuery } from '@tanstack/react-query';
import { assignmentsService } from '@/services/assignments.service';

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentsService.getMyAssignments(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

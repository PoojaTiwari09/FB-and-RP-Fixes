import { cn } from '@/lib/utils';

export function normalizeStatus(status?: string, overdue?: boolean) {
  if (overdue) return 'overdue';
  return (status || 'not_started').toLowerCase().replace(/\s+/g, '_');
}

export function StatusBadge({ status, overdue }: { status?: string; overdue?: boolean }) {
  const normalized = normalizeStatus(status, overdue);
  const classes = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
    not_started: 'bg-gray-100 text-gray-600',
  }[normalized] ?? 'bg-gray-100 text-gray-600';
  return <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', classes)}>{normalized.replace(/_/g, ' ')}</span>;
}

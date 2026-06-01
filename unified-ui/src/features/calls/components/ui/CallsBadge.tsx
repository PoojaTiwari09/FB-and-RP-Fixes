'use client';
import clsx from 'clsx';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

type BadgeVariant =
  | 'discovery'
  | 'demo'
  | 'negotiation'
  | 'closing'
  | 'follow-up'
  | 'check-in'
  | 'high'
  | 'medium'
  | 'low'
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'overdue'
  | 'flag'
  | 'tag'
  | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  discovery: 'bg-gray-100 text-gray-700',
  demo: 'bg-gray-100 text-gray-700',
  negotiation: 'bg-gray-100 text-gray-700',
  closing: 'bg-gray-100 text-gray-700',
  'follow-up': 'bg-gray-100 text-gray-700',
  'check-in': 'bg-gray-100 text-gray-700',
  high: 'bg-red-50 text-red-700 border border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  low: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  flag: 'bg-yellow-100 text-yellow-800',
  tag: 'bg-indigo-50 text-indigo-700',
  default: 'bg-gray-100 text-gray-700',
};

function getVariant(value: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Discovery: 'discovery',
    Demo: 'demo',
    Negotiation: 'negotiation',
    Closing: 'closing',
    'Follow-Up': 'follow-up',
    'Check-In': 'check-in',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    Pending: 'pending',
    'In Progress': 'in-progress',
    Completed: 'completed',
    Overdue: 'overdue',
  };
  return map[value] ?? 'default';
}

interface CallsBadgeProps {
  label: string;
  variant?: BadgeVariant | 'auto';
  className?: string;
}

export default function CallsBadge({
  label,
  variant = 'auto',
  className,
}: CallsBadgeProps) {
  const resolved = variant === 'auto' ? getVariant(label) : variant;

  let icon = null;
  if (resolved === 'high') icon = <ArrowUp size={12} className="mr-1" />;
  if (resolved === 'medium') icon = <ArrowRight size={12} className="mr-1" />;
  if (resolved === 'low') icon = <ArrowDown size={12} className="mr-1" />;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
        variantClasses[resolved],
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

import type { UserRole } from '@shared/types/shared.types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  sales_rep: 'Sales Rep',
  sales_manager: 'Sales Manager',
};

const ROLE_STYLES: Record<UserRole, string> = {
  sales_rep: 'bg-blue-50 text-blue-700 border-blue-200',
  sales_manager: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[role]} ${className}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

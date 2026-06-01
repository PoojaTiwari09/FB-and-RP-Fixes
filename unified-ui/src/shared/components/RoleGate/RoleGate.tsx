'use client';

import { useRole } from '@shared/hooks/useRole';
import type { UserRole } from '@shared/types/shared.types';

interface RoleGateProps {
  allow: UserRole | UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  const { role } = useRole();
  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!allowed.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}

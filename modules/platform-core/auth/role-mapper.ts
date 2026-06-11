import type { UserRole } from '@rri/database';

export type FrontendRole = 'sales_rep' | 'sales_manager';

const FRONTEND_TO_BACKEND: Record<FrontendRole, UserRole> = {
  sales_rep: 'SALES_REP',
  sales_manager: 'MANAGER',
};

const BACKEND_TO_FRONTEND: Partial<Record<UserRole, FrontendRole>> = {
  SALES_REP: 'sales_rep',
  MANAGER: 'sales_manager',
};

export function toBackendRole(input: string): UserRole {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'sales_rep' || normalized === 'salesrep' || normalized === 'rep') {
    return 'SALES_REP';
  }
  if (
    normalized === 'sales_manager' ||
    normalized === 'salesmanager' ||
    normalized === 'manager'
  ) {
    return 'MANAGER';
  }
  const upper = input.trim().toUpperCase();
  if (['ADMIN', 'MANAGER', 'SALES_REP', 'ANALYST', 'EXECUTIVE'].includes(upper)) {
    return upper as UserRole;
  }
  return 'SALES_REP';
}

export function toFrontendRole(role: UserRole): FrontendRole {
  return BACKEND_TO_FRONTEND[role] ?? 'sales_rep';
}

export function isFrontendRole(value: string): value is FrontendRole {
  return value === 'sales_rep' || value === 'sales_manager';
}

export function frontendRoleFromInput(input: string): FrontendRole {
  if (isFrontendRole(input)) return input;
  return toFrontendRole(toBackendRole(input));
}

export { FRONTEND_TO_BACKEND, BACKEND_TO_FRONTEND };

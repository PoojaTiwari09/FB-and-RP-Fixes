'use client';

import { useRoleContext } from '@shared/context/RoleContext';

export function useRole() {
  return useRoleContext();
}

'use client';

import { createContext, useContext } from 'react';
import type { RoleContextValue, UserSession } from '@shared/types/shared.types';

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  session,
  children,
}: {
  session: UserSession;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider
      value={{
        session,
        role: session.role,
        isManager: session.role === 'sales_manager',
        isRep: session.role === 'sales_rep',
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRoleContext must be used inside <RoleProvider>');
  return ctx;
}

'use client';

import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function TopHeader({ onMenu }: { onMenu?: () => void }) {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <Button variant="outline" size="icon" className="md:hidden" onClick={onMenu}><Menu className="h-5 w-5" /></Button>
      <div>
        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Revenue Intelligence'}</p>
        <p className="text-xs text-gray-500">{user?.email || 'Coaching workspace'}</p>
      </div>
      <Button variant="outline" className="gap-2 rounded-xl text-gray-500" onClick={logout}><LogOut className="h-4 w-4" />Logout</Button>
    </header>
  );
}

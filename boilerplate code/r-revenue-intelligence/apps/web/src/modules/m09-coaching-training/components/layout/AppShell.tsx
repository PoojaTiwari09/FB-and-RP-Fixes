'use client';

import { useState } from 'react';
import { TopHeader } from './TopHeader';

export function AppShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <div className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-40 w-64 md:sticky md:block`}>{sidebar}</div>
      {open ? <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setOpen(false)} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, BookOpen, History, LayoutDashboard, Lightbulb, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'My Dashboard', href: '/rep/dashboard', icon: LayoutDashboard },
  { label: 'Assignments', href: '/rep/assignments', icon: BookOpen },
  { label: 'Practice', href: '/rep/practice', icon: Mic },
  { label: 'My Analytics', href: '/rep/analytics', icon: BarChart2 },
  { label: 'Recommendations', href: '/rep/recommendations', icon: Lightbulb },
  { label: 'Session History', href: '/rep/history', icon: History },
];

export function RepSidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-full w-64 border-r border-gray-200 bg-white p-4">
      <h1 className="px-3 py-4 text-lg font-bold text-gray-900">Revenue Intelligence</h1>
      <nav className="mt-4 space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/rep/practice' && pathname.startsWith(href));
          return <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 text-sm', active ? 'rounded-xl bg-indigo-50 font-semibold text-indigo-600' : 'rounded-xl text-gray-500 transition hover:bg-gray-100')}><Icon className="h-4 w-4" />{label}</Link>;
        })}
      </nav>
    </aside>
  );
}

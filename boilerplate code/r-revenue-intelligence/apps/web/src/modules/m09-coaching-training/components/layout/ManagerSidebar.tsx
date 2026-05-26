'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardCheck, FileText, LayoutDashboard, ListTodo, PhoneCall, Target, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Team Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
  { label: 'Rep Performance', href: '/manager/reps', icon: Users },
  { label: 'Team Analytics', href: '/manager/team', icon: TrendingUp },
  { label: 'Call Drilldown', href: '/manager/calls', icon: PhoneCall },
  { label: 'Benchmarks', href: '/manager/benchmarks', icon: Target },
  { label: 'Scenarios', href: '/manager/scenarios', icon: BookOpen },
  { label: 'Assignments', href: '/manager/assignments', icon: ListTodo },
  { label: 'Reviews', href: '/manager/reviews', icon: ClipboardCheck },
  { label: 'Reports', href: '/manager/reports', icon: FileText },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-full w-64 border-r border-gray-200 bg-white p-4">
      <h1 className="px-3 py-4 text-lg font-bold text-gray-900">Revenue Intelligence</h1>
      <nav className="mt-4 space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/manager/calls' && pathname.startsWith(href));
          return <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 text-sm', active ? 'rounded-xl bg-indigo-50 font-semibold text-indigo-600' : 'rounded-xl text-gray-500 transition hover:bg-gray-100')}><Icon className="h-4 w-4" />{label}</Link>;
        })}
      </nav>
    </aside>
  );
}

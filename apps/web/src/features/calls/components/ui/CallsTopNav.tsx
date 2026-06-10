'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Bell, Search, ChevronDown } from 'lucide-react';

const topTabs = [
  { label: 'Calls', href: '/calls/reviews' },
  { label: 'History & Analytics', href: '/calls/analytics' },
];

export default function CallsTopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Top tab row */}
      <div className="flex px-6 bg-white">
        {topTabs.map(({ label, href }) => {
          const active = pathname && (
            href === '/calls/analytics'
              ? pathname.startsWith('/calls/analytics')
              : pathname.startsWith('/calls') &&
                !pathname.startsWith('/calls/analytics')
          );
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'border-[#133088] text-[#133088]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

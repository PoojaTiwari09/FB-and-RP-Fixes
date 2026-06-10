'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Phone, FileText } from 'lucide-react';

interface SubTab {
  label: string;
  href: string;
  count?: number;
  icon?: 'phone' | 'file';
}

interface CallsSubTabsProps {
  tabs: SubTab[];
}

export default function CallsSubTabs({ tabs }: CallsSubTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6 pt-2">
      {tabs.map(({ label, href, count, icon }) => {
        const active = pathname && (
          href === '/calls/reviews/list'
            ? pathname === '/calls/reviews/list'
            : href === '/calls/reviews'
            ? pathname === '/calls/reviews' ||
              (pathname.startsWith('/calls/reviews/') &&
                !pathname.startsWith('/calls/reviews/list'))
            : pathname === href
        );

        const Icon = icon === 'phone' ? Phone : icon === 'file' ? FileText : null;

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors rounded-t-sm',
              active
                ? 'border-[#2563eb] text-[#2563eb] bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {Icon && <Icon size={14} />}
            {label}
            {count !== undefined && (
              <span
                className={clsx(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold',
                  active ? 'bg-[#2563eb] text-white' : 'bg-gray-200 text-gray-600'
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

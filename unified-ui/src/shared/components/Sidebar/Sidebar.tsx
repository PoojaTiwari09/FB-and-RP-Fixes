'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Phone,
  List,
  Sparkles,
  Target,
  GraduationCap,
  Bot,
  Tag,
  Hash,
  Grid3X3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Languages,
  FileText,
  DollarSign,
  Building2,
  TrendingUp,
  AlertTriangle,
  Database,
  User,
} from 'lucide-react';
import { useRole } from '@shared/hooks/useRole';

interface SubMenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: SubMenuItem[];
}

const repNavItems: NavItem[] = [
  { label: 'Engage', icon: <LayoutGrid size={18} />, href: '/engage' },
  {
    label: 'Calls',
    icon: <Phone size={18} />,
    subItems: [
      { label: 'Calls List', icon: <List size={16} />, href: '/calls/list' },
      { label: 'Smart Call', icon: <Phone size={16} />, href: '/smart-call' },
      { label: 'AI Call Reviewer', icon: <Sparkles size={16} />, href: '/calls/ai-reviewer' },
      { label: 'AI Theme Spotter', icon: <Target size={16} />, href: '/calls/theme-spotter' },
    ],
  },
  {
    label: 'Coaching',
    icon: <GraduationCap size={18} />,
    subItems: [
      { label: 'AI Trainer', icon: <Bot size={16} />, href: '/training' },
    ],
  },
  { label: 'Deal Boards', icon: <Grid3X3 size={18} />, href: '/deal-boards' },
  { label: 'Topics', icon: <Tag size={18} />, href: '/topics' },
  { label: 'Trackers', icon: <Hash size={18} />, href: '/trackers' },
  { label: 'Forecast Boards', icon: <Grid3X3 size={18} />, href: '/forecast-boards' },
];

const managerNavItems: NavItem[] = [
  { label: 'Engage', icon: <LayoutGrid size={18} />, href: '/engage' },
  {
    label: 'Calls',
    icon: <Phone size={18} />,
    subItems: [
      { label: 'Search', icon: <Search size={16} />, href: '/calls/search' },
      { label: 'Calls List', icon: <List size={16} />, href: '/calls/list' },
      { label: 'AI Call Reviewer', icon: <Sparkles size={16} />, href: '/calls/reviews/list' },
      { label: 'AI Theme Spotter', icon: <Target size={16} />, href: '/calls/theme-spotter' },
      { label: 'AI Translator', icon: <Languages size={16} />, href: '/calls/translator' },
      { label: 'AI Transcriber', icon: <FileText size={16} />, href: '/calls/transcriber' },
    ],
  },
  {
    label: 'Coaching',
    icon: <GraduationCap size={18} />,
    subItems: [
      { label: 'AI Trainer Review', icon: <Bot size={16} />, href: '/training/manage' },
    ],
  },
  {
    label: 'Revenue',
    icon: <DollarSign size={18} />,
    subItems: [
      { label: 'Accounts', icon: <Building2 size={16} />, href: '/revenue/accounts' },
      { label: 'Coaching Insights', icon: <TrendingUp size={16} />, href: '/revenue/coaching-insights' },
    ],
  },
  {
    label: 'Deal Drivers',
    icon: <AlertTriangle size={18} />,
    subItems: [
      { label: 'Deal Drivers', icon: <AlertTriangle size={16} />, href: '/deal-drivers' },
      { label: 'Deal Boards', icon: <Grid3X3 size={16} />, href: '/deal-boards' },
    ],
  },
  { label: 'AI Deep Researcher', icon: <Search size={18} />, href: '/ai-deep-researcher' },
  { label: 'AI Revenue Predictor', icon: <TrendingUp size={18} />, href: '/ai-revenue-predictor' },
  { label: 'Forecast Boards', icon: <Grid3X3 size={18} />, href: '/forecast-boards' },
  { label: 'Data Cloud', icon: <Database size={18} />, href: '/data-cloud' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isManager } = useRole();
  const navItems = isManager ? managerNavItems : repNavItems;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Calls: false,
    Coaching: true,
    Revenue: false,
    'Deal Drivers': false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const toggleMenu = (label: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem('sidebar-collapsed', 'false');
    }
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`sticky top-0 flex h-full flex-col bg-white border-r border-gray-200 transition-all duration-300 shrink-0 self-start overflow-y-auto ${
        isCollapsed ? 'w-[64px]' : 'w-[240px]'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between py-4 border-b border-gray-100 ${
          isCollapsed ? 'px-0 justify-center' : 'px-5'
        }`}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span
              className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide"
              style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}
            >
              Relanto
            </span>
          </div>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="flex-shrink-0 w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
            style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}
            title="Expand Sidebar"
          >
            R
          </button>
        )}
        {!isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className="p-1 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const hasSub = !!item.subItems;
          const isMenuExpanded = expandedMenus[item.label];
          const isParentActive = item.href
            ? isItemActive(item.href)
            : item.subItems?.some((sub) => isItemActive(sub.href));

          const linkClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            !hasSub && isParentActive
              ? 'bg-[#f4f6fb] text-blue-800'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`;

          const iconWrapperClass = `shrink-0 flex items-center justify-center relative ${
            !hasSub && isParentActive ? 'text-blue-800' : 'text-gray-500'
          }`;

          const activeBorder = !hasSub && isParentActive && (
            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-blue-800 rounded-r-md" />
          );

          const ParentWrapper = item.href && !hasSub ? Link : 'button';
          const parentProps =
            item.href && !hasSub
              ? { href: item.href }
              : { onClick: () => toggleMenu(item.label), className: 'w-full text-left' };

          return (
            <div key={item.label} className="flex flex-col">
              <ParentWrapper
                {...(parentProps as any)}
                className={`${linkClass} relative ${!item.href || hasSub ? 'cursor-pointer w-full' : ''}`}
              >
                <div className={iconWrapperClass}>
                  {activeBorder}
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                )}

                {!isCollapsed && hasSub && (
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${
                      isMenuExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                )}
              </ParentWrapper>

              {hasSub && !isCollapsed && isMenuExpanded && (
                <div className="flex flex-col gap-1 mt-1 ml-4 pl-3 border-l border-gray-100">
                  {item.subItems!.map((sub) => {
                    const isSubActive = isItemActive(sub.href);
                    return (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                          isSubActive
                            ? 'bg-[#f4f6fb] text-blue-800'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {isSubActive && (
                          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-800 rounded-r-md" />
                        )}
                        <div
                          className={`shrink-0 ${isSubActive ? 'text-blue-800' : 'text-gray-400'}`}
                        >
                          {sub.icon}
                        </div>
                        <span className="whitespace-nowrap">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Role Switcher in Sidebar Footer */}
      <div className="mt-auto border-t border-gray-100 p-3 bg-gray-50/50">
        {isCollapsed ? (
          <button
            onClick={() => {
              const nextRole = isManager ? 'sales_rep' : 'sales_manager';
              document.cookie = `user_role=${nextRole}; path=/`;
              window.location.reload();
            }}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition-all duration-200 shadow-sm cursor-pointer"
            title={`Switch to ${isManager ? 'Sales Rep' : 'Sales Manager'}`}
          >
            {isManager ? <User size={18} className="text-blue-600" /> : <GraduationCap size={18} className="text-indigo-600" />}
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Role Switcher
            </label>
            <select
              value={isManager ? 'sales_manager' : 'sales_rep'}
              onChange={(e) => {
                document.cookie = `user_role=${e.target.value}; path=/`;
                window.location.reload();
              }}
              className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer transition-all"
            >
              <option value="sales_rep">Sales Rep</option>
              <option value="sales_manager">Sales Manager</option>
            </select>
          </div>
        )}
      </div>
    </aside>
  );
}

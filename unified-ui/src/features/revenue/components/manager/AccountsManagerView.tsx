'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, Edit2, MoreVertical, Plus } from 'lucide-react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import AlertBanner from './accounts/AlertBanner';
import KpiSummaryBar from './accounts/KpiSummaryBar';
import ViewingFilter from './accounts/ViewingFilter';
import PeriodFilter from './accounts/PeriodFilter';
import AccountsTable from './accounts/AccountsTable';
import AccountDrawer from './accounts/AccountDrawer';
import {
  useAlertBanner,
  useAccountsSummary,
  useViewers,
  useAccountsList,
} from '@revenue/hooks/useAccountsData';
import type { AccountRow, AccountListParams } from '@revenue/types/accounts.types';

export default function AccountsManagerView() {
  // Filter state
  const [selectedViewers, setSelectedViewers] = useState<string[]>([]);
  const [period, setPeriod] = useState('Last quarter');
  const [noActivity, setNoActivity] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('accountName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Drawer state
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);

  // Build list params
  const listParams: AccountListParams = {
    viewing: selectedViewers.length > 0 ? selectedViewers : undefined,
    period,
    noActivity: noActivity || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
    page,
    size: 25,
  };

  // Data hooks
  const alert     = useAlertBanner();
  const summary   = useAccountsSummary(selectedViewers, period);
  const viewers   = useViewers();
  const accounts  = useAccountsList(listParams);

  const handleSort = useCallback(
    (col: string) => {
      if (col === sortBy) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(col);
        setSortOrder('asc');
      }
      setPage(1);
    },
    [sortBy],
  );

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleViewAtRisk = useCallback(() => {
    setNoActivity(true);
    setPage(1);
  }, []);

  const handleFilterNoActivity = useCallback(() => {
    setNoActivity(true);
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Accounts"
        subtitle="Account health, engagement signals, and renewal risk across your team's book."
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium">
              USD <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium">
              <Edit2 className="w-4 h-4 text-gray-500" /> Edit
            </button>
            <button className="flex items-center justify-center w-8 h-8 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center px-6 py-3 border-b border-gray-200 bg-white gap-4">
        <ViewingFilter
          viewers={viewers.data}
          selectedIds={selectedViewers}
          onChange={(ids) => { setSelectedViewers(ids); setPage(1); }}
        />
        <PeriodFilter
          value={period}
          onChange={(p) => { setPeriod(p); setPage(1); }}
        />
        <button className="flex items-center gap-1.5 px-3 py-1 text-sm border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 font-medium ml-2">
          <Plus className="w-3.5 h-3.5" /> Add filter
        </button>
      </div>

      {/* Alert Banner */}
      {!alertDismissed && !alert.isLoading && alert.data && (
        <AlertBanner
          data={alert.data}
          onViewAtRisk={handleViewAtRisk}
          onFilterNoActivity={handleFilterNoActivity}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      {/* KPI Summary Cards */}
      <KpiSummaryBar
        cards={summary.data ?? []}
        isLoading={summary.isLoading}
      />

      {/* No-activity filter active badge */}
      {noActivity && (
        <div className="mx-6 mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            Filter: No Activity
            <button
              onClick={() => { setNoActivity(false); setPage(1); }}
              className="hover:text-amber-900 font-bold leading-none"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Accounts Table */}
      <AccountsTable
        data={accounts.data}
        isLoading={accounts.isLoading}
        error={accounts.error}
        isMockFallback={accounts.isMockFallback}
        onRowClick={setSelectedAccount}
        onSearch={handleSearch}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onPageChange={setPage}
        onRetry={accounts.retry}
      />

      {/* Account Detail Drawer */}
      <AccountDrawer
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
}

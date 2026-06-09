'use client';

import { useState, useMemo } from 'react';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import { Download, ArrowUpDown } from 'lucide-react';
import { useDeals } from './hooks/useDeals';
import type { Deal, DealDetail, DealFilterState, DealTaskPayload, DealCategory, DealStage } from './types/deal.types';
import { MOCK_DEAL_DETAILS } from './mocks/deals.mock';
import {
  createDealTask,
  exportDealsCsv,
  fetchDealDetail,
  postDealComment,
  updateDealEscalation,
} from './services/deal.service';
import PipelineSummaryCard from './components/PipelineSummaryCard';
import DealFilters from './components/DealFilters';
import DealTable from './components/DealTable';
import DealDetailsDrawer from './components/DealDetailsDrawer';
import CommentDealModal from './components/CommentDealModal';

type DealDetailTab = 'brief' | 'warnings' | 'playbook' | 'activity' | 'crm';
type DealGroupBy = 'none' | 'rep' | 'stage';
type SortDirection = 'none' | 'asc' | 'desc';

function getAmountValue(amount: string) {
  return Number(amount.replace(/[^\d]/g, '')) || 0;
}

export default function DealBoardsManagerView() {
  const { deals, setDeals, pipelineSummary, loading } = useDeals();
  const [dealDetails, setDealDetails] = useState<DealDetail[]>(MOCK_DEAL_DETAILS);

  const [filters, setFilters] = useState<DealFilterState>({
    rep: 'all',
    stage: 'all',
    startDate: null,
    endDate: null,
    search: '',
    category: null,
  });

  const [groupBy, setGroupBy] = useState<DealGroupBy>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedDealDetail, setSelectedDealDetail] = useState<DealDetail | null>(null);
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DealDetailTab>('brief');
  const [escalatedDealIds, setEscalatedDealIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const computedPipelineSummary = useMemo(() => {
    const categoriesList: DealCategory[] = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
    
    return categoriesList.map((category) => {
      const categoryDeals = deals.filter((d) => d.category === category);
      const count = categoryDeals.length;
      
      let total = 0;
      categoryDeals.forEach((d) => {
        const clean = d.amount.replace(/,/g, '');
        let val = parseFloat(clean.replace(/[^\d.]/g, '')) || 0;
        if (clean.toLowerCase().includes('k')) {
          val *= 1000;
        } else if (clean.toLowerCase().includes('m')) {
          val *= 1000000;
        }
        total += val;
      });
      
      let amountStr = '$0';
      if (total >= 1000000) {
        amountStr = `$${(total / 1000000).toFixed(1)}M`;
      } else if (total >= 1000) {
        amountStr = `$${(total / 1000).toFixed(0)}K`;
      } else {
        amountStr = `$${total}`;
      }
      
      const mockSummary = pipelineSummary.find((s) => s.label === category);
      const change = mockSummary?.change ?? '$0 [0]';
      
      return {
        label: category,
        amount: amountStr,
        count,
        change,
      };
    });
  }, [deals, pipelineSummary]);

  const reps = useMemo(() => {
    const names = [...new Set(deals.map((d) => d.owner.name))];
    return names.sort();
  }, [deals]);

  const stages = useMemo(() => {
    const names = [...new Set(deals.map((d) => d.stage))];
    return names.sort();
  }, [deals]);

  const categories = useMemo(() => {
    const names = [...new Set(computedPipelineSummary.map((summary) => summary.label))];
    return names;
  }, [computedPipelineSummary]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (filters.category && deal.category !== filters.category) return false;
      if (filters.rep !== 'all' && deal.owner.name !== filters.rep) return false;
      if (filters.stage !== 'all' && deal.stage !== filters.stage) return false;
      if (filters.search && !deal.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [deals, filters]);

  const visibleDeals = useMemo(() => {
    if (sortDirection === 'none') return filteredDeals;

    return [...filteredDeals].sort((a, b) => {
      const amountA = getAmountValue(a.amount);
      const amountB = getAmountValue(b.amount);
      return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
    });
  }, [filteredDeals, sortDirection]);

  const handleCategoryClick = (label: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === label ? null : label,
    }));
  };

  const handleSelectDeal = async (deal: Deal) => {
    setSelectedDeal(deal);
    setSelectedDealDetail(null);
    setActiveDetailTab('brief');

    const localDetail = dealDetails.find((d) => d.dealId === deal.id);
    if (localDetail) {
      setSelectedDealDetail(localDetail);
    } else {
      const detail = await fetchDealDetail(deal.id);
      setDealDetails((prev) => [...prev, detail]);
      setSelectedDealDetail(detail);
    }
  };

  const handleUpdatePlaybook = (dealId: string, meddic: DealDetail['meddic']) => {
    const completedCount = meddic.filter((item) => item.status === 'Completed').length;
    const meddpiccPercent = Math.round((completedCount / meddic.length) * 100);

    setDealDetails((prev) =>
      prev.map((detail) =>
        detail.dealId === dealId
          ? { ...detail, playbookCompletion: meddpiccPercent, meddic }
          : detail
      )
    );

    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId ? { ...deal, meddpiccPercent } : deal
      )
    );

    setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, meddpiccPercent } : prev));
    setSelectedDealDetail((prev) =>
      prev && prev.dealId === dealId
        ? { ...prev, playbookCompletion: meddpiccPercent, meddic }
        : prev
    );
  };

  const handleUpdateCrm = (
    dealId: string,
    updates: { stage: DealStage; category: DealCategory; amount: string; nextStep: string }
  ) => {
    setDealDetails((prev) =>
      prev.map((detail) =>
        detail.dealId === dealId
          ? {
              ...detail,
              crm: {
                ...detail.crm,
                forecastCategory: updates.category,
                nextStep: updates.nextStep,
              },
            }
          : detail
      )
    );

    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage: updates.stage,
              category: updates.category,
              amount: updates.amount,
            }
          : deal
      )
    );

    setSelectedDeal((prev) =>
      prev && prev.id === dealId
        ? {
            ...prev,
            stage: updates.stage,
            category: updates.category,
            amount: updates.amount,
          }
        : prev
    );
    setSelectedDealDetail((prev) =>
      prev && prev.dealId === dealId
        ? {
            ...prev,
            crm: {
              ...prev.crm,
              forecastCategory: updates.category,
              nextStep: updates.nextStep,
            },
          }
        : prev
    );

    showToast(`CRM updated for ${selectedDeal?.name || 'deal'}.`);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleEscalation = async (deal: Deal) => {
    const isEscalated = escalatedDealIds.includes(deal.id);
    const nextEscalated = !isEscalated;

    try {
      await updateDealEscalation(deal.id, nextEscalated);
      setEscalatedDealIds((prev) =>
        nextEscalated ? [...prev, deal.id] : prev.filter((dealId) => dealId !== deal.id)
      );
      showToast(
        isEscalated
          ? `Escalation removed for ${deal.name}.`
          : `Deal escalated to high risk. ${deal.owner.name} will be notified.`
      );
    } catch (error) {
      console.error('Failed to update deal escalation:', error);
      showToast('Could not update escalation because the backend request failed.');
    }
  };

  const handleExportCsv = async () => {
    const csv = await exportDealsCsv(visibleDeals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deal-board.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateTask = async (payload: DealTaskPayload) => {
    try {
      await createDealTask(payload);
      showToast('Task created successfully.');
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('Could not create task because the backend request failed.');
    }
  };

  const handlePostComment = async (comment: string) => {
    if (!commentDeal) return;

    try {
      await postDealComment(commentDeal.id, { comment });
      setCommentDeal(null);
      showToast('Comment posted successfully.');
    } catch (error) {
      console.error('Failed to post comment:', error);
      showToast('Could not post comment because the backend request failed.');
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#FAFBFC]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">Deal Boards</h1>
              <span className="text-sm text-gray-400">Team Board — ENT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RoleBadge role="sales_manager" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-4">
        {/* Board Title Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Team Board — Enterprise</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupBy((prev) => (prev === 'rep' ? 'none' : 'rep'))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                groupBy === 'rep'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Group by Rep
            </button>
            <button
              type="button"
              onClick={() => setGroupBy((prev) => (prev === 'stage' ? 'none' : 'stage'))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                groupBy === 'stage'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Group by Stage
            </button>
            <button
              type="button"
              onClick={() =>
                setSortDirection((prev) =>
                  prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none'
                )
              }
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                sortDirection !== 'none'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown size={14} />
              {sortDirection === 'asc' ? 'Sort Low' : sortDirection === 'desc' ? 'Sort High' : 'Sort'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-md text-xs font-medium hover:bg-[#152a45] transition-colors"
              onClick={handleExportCsv}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Pipeline Summary Cards */}
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {pipelineSummary.map((summary) => (
            <PipelineSummaryCard
              key={summary.label}
              label={summary.label}
              amount={summary.amount}
              count={summary.count}
              change={summary.change}
              isActive={filters.category === summary.label}
              onClick={() => handleCategoryClick(summary.label)}
            />
          ))}
        </div>

        {/* Filters */}
        <DealFilters
          filters={filters}
          onChange={setFilters}
          reps={reps}
          stages={stages}
          categories={categories}
        />

        {/* Deal Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <DealTable
            deals={visibleDeals}
            groupBy={groupBy}
            dealDetails={dealDetails}
            escalatedDealIds={escalatedDealIds}
            onSelectDeal={handleSelectDeal}
            onCommentDeal={setCommentDeal}
            onToggleEscalation={handleToggleEscalation}
          />
        )}
      </div>

      {toastMessage && (
        <div className="fixed right-6 top-24 z-50 rounded-lg bg-[#153E91] px-6 py-4 text-sm font-semibold text-white shadow-xl">
          {toastMessage}
        </div>
      )}

      {selectedDeal && selectedDealDetail && (
        <DealDetailsDrawer
          deal={selectedDeal}
          detail={selectedDealDetail}
          activeTab={activeDetailTab}
          onTabChange={setActiveDetailTab}
          onCreateTask={handleCreateTask}
          onClose={() => setSelectedDeal(null)}
          onUpdatePlaybook={handleUpdatePlaybook}
          onUpdateCrm={handleUpdateCrm}
        />
      )}

      {commentDeal && (
        <CommentDealModal
          deal={commentDeal}
          onClose={() => setCommentDeal(null)}
          onPost={handlePostComment}
        />
      )}
    </div>
  );
}

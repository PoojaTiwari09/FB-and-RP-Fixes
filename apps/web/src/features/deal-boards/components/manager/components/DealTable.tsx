import { Fragment, useState } from 'react';
import { AlertTriangle, Eye, Flag, MessageSquare, MoreVertical } from 'lucide-react';
import type { Deal, DealDetail } from '../types/deal.types';
import ActivityChart, { ActivityOverTimeChart } from './ActivityChart';

interface DealTableProps {
  deals: Deal[];
  groupBy?: 'none' | 'rep' | 'stage';
  dealDetails: DealDetail[];
  escalatedDealIds: string[];
  onSelectDeal: (deal: Deal) => void;
  onCommentDeal: (deal: Deal) => void;
  onToggleEscalation: (deal: Deal) => void;
}

function DealRow({
  deal,
  detail,
  isEscalated,
  onSelectDeal,
  onCommentDeal,
  onToggleEscalation,
}: {
  deal: Deal;
  detail?: DealDetail;
  isEscalated: boolean;
  onSelectDeal: (deal: Deal) => void;
  onCommentDeal: (deal: Deal) => void;
  onToggleEscalation: (deal: Deal) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const primaryWarning = detail?.activeWarnings[0] ?? 'AI warning requires review';

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelectDeal(deal)}
    >
      <td className="px-4 py-3">
        <button
          type="button"
          className="text-sm font-medium text-[#2563EB] hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onSelectDeal(deal);
          }}
        >
          {deal.name}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: deal.owner.color }}
          >
            {deal.owner.initials}
          </div>
          <span className="text-sm text-gray-700">{deal.owner.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{deal.stage}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 font-medium">
          {deal.amount}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-medium ${deal.aiScore >= 80 ? 'text-[#16A34A]' : deal.aiScore >= 60 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
          {deal.aiScore}%
        </span>
      </td>
      <td className="px-4 py-3">
        {deal.warnings > 0 && (
          <div className="group relative inline-flex items-center gap-1">
            <AlertTriangle size={14} className="text-[#F59E0B]" />
            <span className="text-sm text-gray-700">{deal.warnings}</span>
            <div className="pointer-events-none absolute left-0 top-7 z-30 hidden w-72 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg group-hover:block">
              <p className="text-xs font-medium text-gray-800">{primaryWarning}</p>
              <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">
                Warning
              </span>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${deal.meddpiccPercent >= 80 ? 'bg-[#16A34A]' : deal.meddpiccPercent >= 50 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'}`}
              style={{ width: `${deal.meddpiccPercent}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{deal.meddpiccPercent}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{deal.contacts} contacts</span>
      </td>
      <td className="px-4 py-3 relative group" onClick={(event) => event.stopPropagation()}>
        <ActivityChart data={deal.activityData} color="#3B82F6" />
        {detail && (
          <div className="pointer-events-none absolute right-4 bottom-8 z-50 hidden w-[420px] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl group-hover:block transition-all duration-200">
            <ActivityOverTimeChart detail={detail} />
          </div>
        )}
      </td>
      <td className="relative px-2 py-3">
        <button
          type="button"
          className="p-1 hover:bg-gray-100 rounded"
          onClick={(event) => {
            event.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          aria-label={`More options for ${deal.name}`}
          aria-expanded={isMenuOpen}
        >
          <MoreVertical size={16} className="text-gray-400" />
        </button>
        {isMenuOpen && (
          <div
            className="absolute right-3 top-10 z-20 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsMenuOpen(false);
                onSelectDeal(deal);
              }}
            >
              <Eye size={16} />
              View Deal
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsMenuOpen(false);
                onCommentDeal(deal);
              }}
            >
              <MessageSquare size={16} />
              Comment on Deal
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setIsMenuOpen(false);
                onToggleEscalation(deal);
              }}
            >
              <Flag size={16} />
              {isEscalated ? 'Remove Escalation' : 'Escalate'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function DealTable({
  deals,
  groupBy = 'none',
  dealDetails,
  escalatedDealIds,
  onSelectDeal,
  onCommentDeal,
  onToggleEscalation,
}: DealTableProps) {
  const getDealDetail = (dealId: string) =>
    dealDetails.find((detail) => detail.dealId === dealId);

  if (groupBy !== 'none') {
    const grouped = deals.reduce<Record<string, Deal[]>>((acc, deal) => {
      const key = groupBy === 'rep' ? deal.owner.name : deal.stage;
      if (!acc[key]) acc[key] = [];
      acc[key].push(deal);
      return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort();

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Deal Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">AI Score</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Warnings</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">MEDDPICC %</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contacts</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((groupName) => (
              <Fragment key={groupName}>
                <tr key={groupName} className="bg-gray-50">
                  <td colSpan={10} className="px-4 py-2 text-sm font-semibold text-gray-700">
                    {groupName} ({grouped[groupName].length} deals)
                  </td>
                </tr>
                {grouped[groupName].map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    detail={getDealDetail(deal.id)}
                    isEscalated={escalatedDealIds.includes(deal.id)}
                    onSelectDeal={onSelectDeal}
                    onCommentDeal={onCommentDeal}
                    onToggleEscalation={onToggleEscalation}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Deal Name</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">AI Score</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Warnings</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">MEDDPICC %</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contacts</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {deals.map((deal) => (
            <DealRow
              key={deal.id}
              deal={deal}
              detail={getDealDetail(deal.id)}
              isEscalated={escalatedDealIds.includes(deal.id)}
              onSelectDeal={onSelectDeal}
              onCommentDeal={onCommentDeal}
              onToggleEscalation={onToggleEscalation}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

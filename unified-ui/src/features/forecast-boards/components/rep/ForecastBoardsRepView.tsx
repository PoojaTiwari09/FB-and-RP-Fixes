import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function ForecastBoardsRepView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Forecast Boards"
        subtitle="Your personal pipeline forecast — track deals by stage and close probability."
        badge={<RoleBadge role="sales_rep" />}
      />
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StageCard stage="Commit" amount="$84,000" deals={3} />
        <StageCard stage="Best Case" amount="$142,000" deals={6} />
        <StageCard stage="Pipeline" amount="$310,000" deals={14} />
      </div>
    </div>
  );
}

function StageCard({ stage, amount, deals }: { stage: string; amount: string; deals: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stage}</span>
      <span className="text-2xl font-bold text-gray-900">{amount}</span>
      <span className="text-xs text-gray-400">{deals} deals</span>
    </div>
  );
}

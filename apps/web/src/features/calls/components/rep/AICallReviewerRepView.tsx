import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AICallReviewerRepView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Call Reviewer"
        subtitle="AI-scored feedback on your calls — improve talk-track and objection handling."
        badge={<RoleBadge role="sales_rep" />}
      />
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard label="Talk Ratio" value="42%" hint="Ideal: 40–50%" />
        <ScoreCard label="Patience Score" value="78" hint="Top 30%" />
        <ScoreCard label="Filler Words" value="Low" hint="Great!" />
      </div>
    </div>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">{hint}</span>
    </div>
  );
}

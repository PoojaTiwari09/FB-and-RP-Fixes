import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AIRevenuePredictorManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Revenue Predictor"
        subtitle="ML-powered forecast — predict team attainment and surface pipeline gaps early."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Predicted Q2 Attainment" value="87%" />
          <StatCard label="Pipeline Coverage" value="3.2x" />
          <StatCard label="Forecast Confidence" value="High" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Revenue Prediction Trend</p>
          <p className="text-sm text-gray-400">Connect analytics provider to render forecast chart.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

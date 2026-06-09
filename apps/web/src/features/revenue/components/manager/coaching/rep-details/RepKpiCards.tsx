import type { RepKpisData, RepKpiMetric, KpiStatus } from '@revenue/types/coaching-rep.types';

interface RepKpiCardsProps {
  kpis: RepKpisData;
}

const getStatusColor = (status: KpiStatus) => {
  switch (status) {
    case 'critical': return 'text-red-600';
    case 'warning': return 'text-amber-500';
    case 'optimal': return 'text-emerald-600';
    default: return 'text-slate-900';
  }
};

const KpiCard = ({ title, metric }: { title: string; metric: RepKpiMetric }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-center flex-1 shadow-sm">
    <div className={`text-3xl font-semibold mb-2 ${getStatusColor(metric.status)}`}>
      {metric.value}
    </div>
    <div className="text-sm font-medium text-slate-900 mb-1">{title}</div>
    <div className="text-xs text-slate-500">{metric.optimalText}</div>
  </div>
);

export default function RepKpiCards({ kpis }: RepKpiCardsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <KpiCard title="Talk ratio" metric={kpis.talkRatio} />
      <KpiCard title="Question rate" metric={kpis.questionRate} />
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-center flex-1 shadow-sm">
        <div className="text-3xl font-semibold mb-2 text-slate-900">4.1</div>
        <div className="text-sm font-medium text-slate-900 mb-1">Interactivity</div>
        <div className="text-xs text-slate-500">Scale 1-10</div>
      </div>
      <KpiCard title="Longest monologue" metric={kpis.monologue} />
    </div>
  );
}

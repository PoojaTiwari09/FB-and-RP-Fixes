interface SmartCallStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function SmartCallStatCard({ label, value, sub }: SmartCallStatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

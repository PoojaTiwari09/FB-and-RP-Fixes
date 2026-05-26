import { LucideIcon } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, trend }: { icon: LucideIcon; label: string; value: string | number; trend?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600"><Icon className="h-5 w-5" /></div>
        {trend ? <span className="text-xs font-semibold text-green-600">{trend}</span> : null}
      </div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

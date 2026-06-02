import type { CoachingHistoryItem } from '@revenue/types/coaching-rep.types';

interface CoachingHistoryListProps {
  history: CoachingHistoryItem[];
}

export default function CoachingHistoryList({ history }: CoachingHistoryListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-base font-semibold text-slate-900 mb-6">Coaching History</h2>
      
      <div className="relative border-l border-slate-200 ml-5 space-y-6">
        {history.map((item) => (
          <div key={item.id} className="relative pl-6">
            <div className="absolute -left-3.5 top-0 w-7 h-7 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
              {item.managerInitials}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 mb-0.5">{item.dateStr}</div>
              <p className="text-sm text-slate-800 font-medium">{item.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

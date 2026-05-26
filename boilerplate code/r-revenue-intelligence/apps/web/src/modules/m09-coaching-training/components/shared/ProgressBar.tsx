export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-500"><span>Progress</span><span>{safeValue}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

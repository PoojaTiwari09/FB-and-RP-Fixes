export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-3 w-2/3 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

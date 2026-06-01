export default function TrainingResultsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="skeleton h-7 w-80 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>

        {/* Score card skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-8">
            <div className="skeleton w-40 h-40 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="flex gap-2 mt-2">
                <div className="skeleton h-6 w-28 rounded-full" />
                <div className="skeleton h-6 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex border-b border-gray-200 mb-6">
          <div className="skeleton h-4 w-32 mx-5 my-3" />
          <div className="skeleton h-4 w-28 mx-5 my-3" />
        </div>

        {/* Accordion skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

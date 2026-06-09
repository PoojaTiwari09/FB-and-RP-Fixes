export default function TrainingDashboardLoading() {
  return (
    <>
      <div className="px-8 py-8 max-w-6xl w-full mx-auto">
          {/* Title skeleton */}
          <div className="mb-6">
            <div className="skeleton h-7 w-64 mb-2" />
            <div className="skeleton h-4 w-28" />
          </div>

          {/* Filter tabs skeleton */}
          <div className="flex items-center gap-2 mb-5">
            <div className="skeleton h-9 w-16 rounded-lg" />
            <div className="skeleton h-9 w-24 rounded-lg" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>

          {/* Table skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 py-3 px-5">
              <div className="w-[40%]"><div className="skeleton h-3 w-24" /></div>
              <div className="w-[20%]"><div className="skeleton h-3 w-16" /></div>
              <div className="w-[20%]"><div className="skeleton h-3 w-12" /></div>
              <div className="w-[20%]"><div className="skeleton h-3 w-12" /></div>
            </div>

            {/* 5 skeleton rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center border-b border-gray-100 last:border-b-0 py-4 px-5"
              >
                <div className="w-[40%]">
                  <div className="skeleton h-4 w-48 mb-2" />
                  <div className="skeleton h-2 w-32" />
                </div>
                <div className="w-[20%]">
                  <div className="skeleton h-4 w-24" />
                </div>
                <div className="w-[20%]">
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
                <div className="w-[20%]">
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
    </>
  );
}

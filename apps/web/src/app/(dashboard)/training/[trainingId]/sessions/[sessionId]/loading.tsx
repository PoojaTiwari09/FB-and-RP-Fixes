export default function TrainingSessionLoading() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-12" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-9 w-32 rounded-lg" />
          <div className="skeleton h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex-1 flex">
        {/* Left */}
        <div className="w-[60%] p-4 space-y-4">
          <div className="skeleton h-64 w-full rounded-xl" />
          <div className="skeleton h-48 w-full rounded-xl" />
          <div className="skeleton h-11 w-full rounded-lg" />
        </div>
        {/* Right */}
        <div className="w-[40%] border-l border-gray-200 p-5 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-24 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

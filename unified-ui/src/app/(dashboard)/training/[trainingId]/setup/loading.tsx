export default function TrainingSetupLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="skeleton h-4 w-36 mb-4" />
            <div className="skeleton h-7 w-64 mb-2" />
            <div className="skeleton h-4 w-80" />
          </div>

          {/* Persona card skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="skeleton h-5 w-32 mb-5" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="skeleton h-3 w-10 mb-2" />
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
              <div>
                <div className="skeleton h-3 w-10 mb-2" />
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="mb-4">
              <div className="skeleton h-3 w-16 mb-2" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
            <div className="mb-4">
              <div className="skeleton h-3 w-36 mb-2" />
              <div className="skeleton h-20 w-full rounded-lg" />
            </div>
            <div>
              <div className="skeleton h-3 w-36 mb-2" />
              <div className="skeleton h-20 w-full rounded-lg" />
            </div>
          </div>

          {/* Playbook skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="skeleton h-5 w-36 mb-2" />
            <div className="skeleton h-4 w-80 mb-5" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

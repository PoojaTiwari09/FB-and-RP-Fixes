"use client";

export default function LoadingState() {
  return (
    <div className="space-y-4">
      {/* Skeleton for task cards */}
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="rounded-lg p-4 animate-pulse"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Checkbox skeleton */}
            <div
              className="w-4 h-4 rounded bg-gray-200"
            />

            {/* Icon skeleton */}
            <div
              className="w-4 h-4 rounded bg-gray-200"
            />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded bg-gray-200"
                style={{
                  width: '40%',
                }}
              />
              <div
                className="h-3 rounded bg-gray-150"
                style={{
                  width: '60%',
                }}
              />
              <div
                className="h-3 rounded bg-gray-150"
                style={{
                  width: '30%',
                }}
              />
            </div>

            {/* Button skeleton */}
            <div
              className="h-9 rounded bg-gray-200"
              style={{
                width: '100px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

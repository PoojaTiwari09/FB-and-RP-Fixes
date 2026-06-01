export default function LoadingScreen() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        {/* Animated radio-wave icon */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <span className="absolute w-16 h-16 rounded-full border-2 border-gray-200 animate-ping opacity-30" />
          <span className="absolute w-10 h-10 rounded-full border-2 border-gray-300 animate-ping opacity-40" style={{ animationDelay: '0.15s' }} />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="relative text-gray-400"
          >
            {/* Centre dot */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            {/* Inner arc */}
            <path
              d="M8.5 12a3.5 3.5 0 0 1 7 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Outer arc */}
            <path
              d="M5 12a7 7 0 0 1 14 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            Waiting for conversation to begin...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            AI will start providing suggestions once the call starts
          </p>
        </div>
      </div>
    </div>
  );
}

import { Sparkles } from 'lucide-react';

export default function FloatingActionButton() {
  return (
    <button
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl z-50"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
      aria-label="AI Assistant"
    >
      <Sparkles size={22} className="text-white" />
    </button>
  );
}

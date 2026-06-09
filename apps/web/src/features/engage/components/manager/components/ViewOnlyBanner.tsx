import { Eye } from 'lucide-react';
import { MOCK_TEAM_MEMBERS } from '../mocks/engage.mock';

interface ViewOnlyBannerProps {
  selectedUserId: string;
}

export default function ViewOnlyBanner({ selectedUserId }: ViewOnlyBannerProps) {
  const member = MOCK_TEAM_MEMBERS.find((m) => m.id === selectedUserId);
  const name = member ? member.name : selectedUserId;

  return (
    <div className="sticky top-0 z-20 bg-amber-50 border-b border-amber-200 shadow-sm transition-all duration-300">
      <div className="max-w-[1800px] mx-auto px-6 py-2.5 flex items-center gap-2.5">
        <Eye className="w-4 h-4 text-amber-700 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Viewing: <span className="underline font-semibold">{name}</span> (View Only)
        </p>
      </div>
    </div>
  );
}

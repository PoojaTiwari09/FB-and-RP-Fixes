import { AlertTriangle } from 'lucide-react';

interface SourceDeadlineBannerProps {
  banner?: { message: string; isDue: boolean } | null;
  period?: { endDate: string } | null;
}

export default function SourceDeadlineBanner({ banner, period }: SourceDeadlineBannerProps) {
  let displayMessage = '';
  let showBanner = false;

  if (period && period.endDate) {
    const end = new Date(period.endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const dueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dueDays >= 0) {
      displayMessage = `Your forecast is due in ${dueDays} day(s)`;
      showBanner = true;
    }
  } else if (banner && banner.isDue) {
    displayMessage = banner.message;
    showBanner = true;
  }

  if (!showBanner) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mx-6 my-3"
      style={{
        background: '#FEF3C7',
        borderLeft: '4px solid #F59E0B',
        color: '#92400E',
      }}
    >
      <AlertTriangle size={16} className="shrink-0" style={{ color: '#F59E0B' }} />
      {displayMessage}
    </div>
  );
}

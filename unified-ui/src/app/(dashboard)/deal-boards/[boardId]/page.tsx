import { Suspense } from 'react';
import DealBoardDetail from '@deal-boards/components/rep/DealBoardDetail';

export default function DealBoardDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
        Loading board...
      </div>
    }>
      <DealBoardDetail />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';

export default function Home() {
  const router = useRouter();

  const role = useSessionStore((s) => s.role);

  useEffect(() => {
    fetch(`http://localhost:3001/preferences/${role}/last-board`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.board_id) {
          router.replace(`/board/${data.board_id}`);
        } else {
          router.replace('/board/commercial');
        }
      })
      .catch(() => router.replace('/board/commercial'));
  }, [router, role]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
        <div style={{ fontSize: 14 }}>Redirecting to dashboard...</div>
      </div>
    </div>
  );
}

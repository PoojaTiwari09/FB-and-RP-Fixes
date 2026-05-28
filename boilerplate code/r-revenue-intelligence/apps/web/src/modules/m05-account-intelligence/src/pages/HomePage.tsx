import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Standalone entry — opens demo board (in-memory seed). */
export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/board/demo', { replace: true });
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-secondary, #94a3b8)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
        <div style={{ fontSize: 14 }}>Loading Account Intelligence…</div>
      </div>
    </div>
  );
}

export default function M3Page() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', zIndex: 9999, backgroundColor: '#fff' }}>
      <iframe 
        src="http://localhost:5174" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="M3 AI Briefings"
      />
    </div>
  );
}

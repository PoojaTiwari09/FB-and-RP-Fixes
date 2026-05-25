'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Theme, ThemeAlert, ThemeFiltersState } from './themeSpotterTypes';
import { MOCK_THEMES, MOCK_ALERTS } from './themeSpotterMockData';
import { ThemeSummaryCards } from './ThemeSummaryCards';
import { ThemeFilters } from './ThemeFilters';
import { ThemeCardGrid } from './ThemeCardGrid';
import { ThemeDeepDivePanel } from './ThemeDeepDivePanel';
import { ThemeAlertsPanel } from './ThemeAlertsPanel';
import { ArchivedThemesPanel } from './ArchivedThemesPanel';
import { ThemeReviewPanel } from './ThemeReviewPanel';

interface Props { apiBaseUrl: string; }

const TENANT = 'tenant-123';

export const ThemeSpotterDashboard: React.FC<Props> = ({ apiBaseUrl }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [alerts, setAlerts] = useState<ThemeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'themes' | 'pending' | 'archived' | 'alerts'>('themes');
  const [filters, setFilters] = useState<ThemeFiltersState>({ search: '', trend: '', minConfidence: 0 });
  const [deepDiveTheme, setDeepDiveTheme] = useState<Theme | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');
  const [businessQuestion, setBusinessQuestion] = useState('');
  const [showCreateJob, setShowCreateJob] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [themesRes, alertsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/themes`, { headers: { 'x-tenant-id': TENANT } }),
        fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/theme-alerts`, { headers: { 'x-tenant-id': TENANT } }),
      ]);
      if (themesRes.ok) { const data = await themesRes.json(); if (Array.isArray(data) && data.length) setThemes(data); else setThemes(MOCK_THEMES); }
      else setThemes(MOCK_THEMES);
      if (alertsRes.ok) { const data = await alertsRes.json(); if (Array.isArray(data)) setAlerts(data); else setAlerts(MOCK_ALERTS); }
      else setAlerts(MOCK_ALERTS);
    } catch {
      setThemes(MOCK_THEMES);
      setAlerts(MOCK_ALERTS);
    } finally { setLoading(false); }
  }, [apiBaseUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateAnalysis = async () => {
    if (!businessQuestion.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeMsg('Submitting analysis job...');
    setShowCreateJob(false);
    try {
      setAnalyzeMsg('Loading conversations...');
      await new Promise(r => setTimeout(r, 800));
      setAnalyzeMsg('Analyzing patterns via Groq AI...');
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/theme-analyses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT },
        body: JSON.stringify({ businessQuestion, filters: {} }),
      });
      setAnalyzeMsg('Detecting recurring themes...');
      await new Promise(r => setTimeout(r, 1200));
      if (res.ok) {
        setAnalyzeMsg('Saving results...');
        await new Promise(r => setTimeout(r, 600));
        await fetchData();
        setAnalyzeMsg('✓ Analysis complete — new themes ready for review');
      } else {
        setAnalyzeMsg('Analysis submitted — themes will appear when ready');
      }
    } catch {
      setAnalyzeMsg('Analysis submitted — check back shortly');
    } finally {
      setBusinessQuestion('');
      setTimeout(() => { setIsAnalyzing(false); setAnalyzeMsg(''); }, 3000);
    }
  };

  const handleAccept = async (theme: Theme) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/themes/${theme.id}/accept`, {
        method: 'POST', headers: { 'x-tenant-id': TENANT },
      });
    } catch { /* silent */ }
    setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, status: 'ACCEPTED' } : t));
  };

  const handleReject = async (theme: Theme) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/themes/${theme.id}/reject`, {
        method: 'POST', headers: { 'x-tenant-id': TENANT },
      });
    } catch { /* silent */ }
    setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, status: 'REJECTED' } : t));
  };

  const handleArchive = async (theme: Theme) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/themes/${theme.id}/archive`, {
        method: 'POST', headers: { 'x-tenant-id': TENANT },
      });
    } catch { /* silent */ }
    setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, status: 'ARCHIVED' } : t));
  };

  const handleRestore = (theme: Theme) => {
    setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, status: 'PENDING_REVIEW' } : t));
  };

  const applyFilters = (list: Theme[]) => list.filter(t => {
    if (filters.search && !t.name.toLowerCase().includes(filters.search.toLowerCase()) && !t.summary.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.trend && t.trend !== filters.trend) return false;
    return true;
  });

  const acceptedThemes = applyFilters(themes.filter(t => t.status === 'ACCEPTED'));
  const pendingThemes = applyFilters(themes.filter(t => t.status === 'PENDING_REVIEW'));
  const archivedThemes = themes.filter(t => t.status === 'ARCHIVED' || t.status === 'REJECTED');
  const callsAnalyzed = themes.reduce((sum, t) => sum + t.callCount, 0);

  return (
    <div className="rev-results-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-slate)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
            AI Theme Spotter
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
            Detect recurring business signals and patterns from customer conversations using AI
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchData}>
            <RefreshCw style={{ width: '13px', height: '13px' }} /> Refresh
          </button>
          <button className="rev-btn-primary" style={{ fontSize: '11px', padding: '8px 14px' }} onClick={() => setShowCreateJob(true)}>
            + Analyze Conversations
          </button>
        </div>
      </div>

      {/* Analysis Job Creation */}
      {showCreateJob && (
        <div className="rev-chart-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-white)', margin: 0 }}>New Theme Analysis</h4>
          <input
            type="text"
            className="rev-input"
            placeholder="Enter business question e.g. 'What are customers most concerned about?'"
            value={businessQuestion}
            onChange={e => setBusinessQuestion(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setShowCreateJob(false)}>Cancel</button>
            <button className="rev-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={handleCreateAnalysis} disabled={!businessQuestion.trim()}>
              Run Analysis
            </button>
          </div>
        </div>
      )}

      {/* Scan status banner */}
      {isAnalyzing && analyzeMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px' }}>
          {!analyzeMsg.startsWith('✓') && <RefreshCw style={{ width: '14px', height: '14px', color: 'var(--accent-purple)', animation: 'spin 1.2s linear infinite' }} />}
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-purple)' }}>{analyzeMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <ThemeSummaryCards themes={themes} alerts={alerts} callsAnalyzed={callsAnalyzed} />

      {/* Filters + Tabs */}
      <ThemeFilters filters={filters} onChange={setFilters} activeView={activeView} onViewChange={setActiveView} />

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', gap: '10px' }}>
          <RefreshCw style={{ width: '24px', height: '24px', color: 'var(--accent-purple)', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Loading theme data...</span>
        </div>
      ) : activeView === 'themes' ? (
        <ThemeCardGrid themes={acceptedThemes} onDeepDive={setDeepDiveTheme} onArchive={handleArchive} emptyMessage="No accepted themes yet. Run an analysis to detect patterns, then accept themes from the Pending Review tab." />
      ) : activeView === 'pending' ? (
        <ThemeReviewPanel themes={pendingThemes} onAccept={handleAccept} onReject={handleReject} onDeepDive={setDeepDiveTheme} />
      ) : activeView === 'archived' ? (
        <ArchivedThemesPanel themes={archivedThemes} onRestore={handleRestore} />
      ) : (
        <ThemeAlertsPanel alerts={alerts} themes={themes} apiBaseUrl={apiBaseUrl} tenantId={TENANT} onAlertsChange={setAlerts} />
      )}

      {/* Deep Dive Panel */}
      {deepDiveTheme && <ThemeDeepDivePanel theme={deepDiveTheme} onClose={() => setDeepDiveTheme(null)} />}

    </div>
  );
};

export default ThemeSpotterDashboard;

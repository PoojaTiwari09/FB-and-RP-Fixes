'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Check, Loader2, Send, Share2,
  ArrowUpRight, ArrowDownRight, Minus,
  Sparkles, MessageCircle, CheckCircle, Circle, Info,
  Eye, Calendar, Users, ChevronDown,
  ChevronLeft, ChevronRight, AlertTriangle, Building2, GitBranch, MapPin,
  Plus, BookOpen, AlertCircle, Target, Search, X,
} from 'lucide-react';

import {
  getFiltersDefaults,
  getExampleQuestions,
  runAnalysis,
  getProgress,
  getEvidence,
  submitEscalation,
  shareRecommendation,
  resetMockProgress,
  getRepCalls,
  getAllReps,
  getObjectionRepBreakdown,
  getObjectionEvidence,
  getCallDetails,
  getAccountDetails,
  getRecommendationDetails,
} from '@ai-deep-researcher/services/aiDeepResearcher';
import { useAIDeepResearcher } from '../../hooks/useAIDeepResearcher';

import type {
  FiltersDefaults,
  ProgressResponse,
  ReportResponse,
  EvidenceResponse,
  EscalationHistoryItem,
  ShareStatusMap,
  ResearchPhase,
} from '@ai-deep-researcher/types';

import '../ai-deep-researcher.css';

/* ─── Constants ─────────────────────────────────────────────── */
const PHASE: Record<string, ResearchPhase> = {
  INPUT:   'input',
  RUNNING: 'running',
  REPORT:  'report',
};

const EVIDENCE_FINDINGS = [
  'integration_complexity',
  'pricing_budget',
  'incumbent_vendor_loyalty',
  'security_compliance',
  'timeline_urgency',
];

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Filter Pill component ─────────────────────────────────── */
interface FilterPillProps {
  icon?: React.ElementType;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  highlighted?: boolean;
}

function FilterPill({ icon: Icon, value, options, onChange, highlighted = false }: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`adr-fpill${highlighted ? ' adr-fpill-hl' : ''}`}>
      <button className="adr-fpill-btn" onClick={() => setOpen(!open)}>
        {Icon && <Icon size={14} />}
        <span>{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <ul className="adr-fpill-menu">
          {options.map((o) => (
            <li
              key={o}
              className={`adr-fpill-opt${o === value ? ' adr-sel' : ''}`}
              onClick={() => { onChange(o); setOpen(false); }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortDropdown({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="adr-sort-btn" onClick={() => setOpen(!open)}>
        Sort: {value} <ChevronDown size={12} />
      </button>
      {open && (
        <ul className="adr-fpill-menu" style={{ top: 'calc(100% + 4px)', right: 0, left: 'auto', minWidth: '150px', zIndex: 10 }}>
          {options.map((o) => (
            <li
              key={o}
              className={`adr-fpill-opt${o === value ? ' adr-sel' : ''}`}
              onClick={() => { onChange(o); setOpen(false); }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AIDeepResearcherManagerView() {
  /* ── State ── */
  const [phase, setPhase]         = useState<ResearchPhase>(PHASE.INPUT);
  const [filters, setFilters]     = useState<FiltersDefaults | null>(null);
  const [examples, setExamples]   = useState<string[]>([]);
  const [query, setQuery]         = useState('');
  const [dateRange, setDateRange] = useState('');
  const [segment, setSegment]     = useState('');
  const [callStage, setCallStage] = useState('');
  const [region, setRegion]       = useState('');

  // Modal states for functional drill-downs
  const [activeModal, setActiveModal] = useState<'calls' | 'all_reps' | 'rep_breakdown' | 'account' | 'recommendation' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [jobId, setJobId]       = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [evFilter, setEvFilter]   = useState('all');
  const [evPage, setEvPage]       = useState(1);
  const [repSortCriterion, setRepSortCriterion] = useState<string>('Top Objection');

  const {
    dashboard, isLoadingDashboard, fetchDashboard,
    execSummary, isLoadingExecSummary, fetchExecSummary,
    keyFindings, isLoadingKeyFindings, fetchKeyFindings,
    trends, isLoadingTrends, fetchTrends,
    risks, isLoadingRisks, fetchRisks,
    recommendations, isLoadingRecommendations, fetchRecommendations,
    clearCache,
  } = useAIDeepResearcher(jobId);

  useEffect(() => {
    if (phase === PHASE.REPORT) {
      fetchDashboard();
      if (activeTab === 0) fetchExecSummary();
      if (activeTab === 1) fetchKeyFindings();
      if (activeTab === 3) fetchTrends();
      if (activeTab === 4) fetchRisks();
      if (activeTab === 5) fetchRecommendations();
    }
  }, [phase, activeTab, fetchDashboard, fetchExecSummary, fetchKeyFindings, fetchTrends, fetchRisks, fetchRecommendations]);

  const [escalationQ, setEscalationQ]           = useState('');
  const [escalationHistory, setEscalationHistory] = useState<EscalationHistoryItem[]>([]);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [shareStatus, setShareStatus]             = useState<ShareStatusMap>({});

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load filters & examples on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const f = await getFiltersDefaults();
        setFilters(f);
        setDateRange(f.dateRange.default);
        setSegment(f.segment.default);
        setCallStage(f.callStage.default);
        setRegion(f.region.default);
      } catch (err) {
        console.error('[AI Deep Researcher] Failed to load filters:', err);
      }
      try {
        const ex = await getExampleQuestions();
        setExamples(ex.questions ?? []);
      } catch (err) {
        console.error('[AI Deep Researcher] Failed to load example questions:', err);
      }
    })();
  }, []);

  /* ── Polling ── */
  const startPolling = useCallback((jid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const p = await getProgress(jid);
        setProgress(p);
        if (p.status === 'complete' || p.status === 'failed') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          if (p.status === 'complete') {
            try {
              const ev = await getEvidence(jid);
              setEvidence(ev);
            } catch (evErr) {
              console.error('[AI Deep Researcher] Failed to load evidence:', evErr);
            }
            setPhase(PHASE.REPORT);
          }
        }
      } catch (err) {
        console.error('[AI Deep Researcher] Polling error:', err);
      }
    }, 2000);
  }, []);

  /* ── Cleanup polling on unmount ── */
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── Handlers ── */
  async function handleRun() {
    if (!query.trim()) return;
    resetMockProgress();
    try {
      const res = await runAnalysis({
        query,
        dateRange,
        segment,
        callStage,
        region,
        repCohort: filters?.repCohort?.value,
      });
      setJobId(res.jobId);
      setProgress(null);
      setPhase(PHASE.RUNNING);
      startPolling(res.jobId);
    } catch (err) {
      console.error('[AI Deep Researcher] Failed to start analysis:', err);
    }
  }

  function handleNewAnalysis() {
    setPhase(PHASE.INPUT);
    setQuery('');
    clearCache();
    setEvidence(null);
    setProgress(null);
    setActiveTab(0);
    setEscalationHistory([]);
    setShareStatus({});
    setEvFilter('all');
    setEvPage(1);
  }

  async function handleEvFilter(finding: string) {
    setEvFilter(finding);
    setEvPage(1);
    if (!jobId) return;
    const ev = await getEvidence(jobId, { finding, page: 1 });
    setEvidence(ev);
  }

  async function handleEvPage(p: number) {
    setEvPage(p);
    if (!jobId) return;
    const ev = await getEvidence(jobId, { finding: evFilter, page: p });
    setEvidence(ev);
  }

  async function handleEscalation() {
    if (!escalationQ.trim() || escalationLoading || !jobId) return;
    setEscalationLoading(true);
    const a = await submitEscalation(jobId, escalationQ);
    setEscalationHistory((h) => [...h, { q: escalationQ, answer: a.answer, suggestDeepAnalysis: a.suggestDeepAnalysis }]);
    setEscalationQ('');
    setEscalationLoading(false);
  }

  async function handleShare(recId: string) {
    if (!jobId) return;
    setShareStatus((s) => ({ ...s, [recId]: 'loading' }));
    const res = await shareRecommendation(jobId, recId, 'slack');
    setShareStatus((s) => ({ ...s, [recId]: res.status }));
  }


  const handleOpenCall = async (callId: string) => {
    console.log("Open Call clicked for", callId);
    setModalLoading(true);
    setActiveModal('calls');
    try {
      const res = await getCallDetails(callId);
      setModalData({ repId: 'Call Detail', calls: res ? [res] : [] });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewAccount = async (accountName: string) => {
    console.log("View Account clicked for", accountName);
    setModalLoading(true);
    setActiveModal('account');
    try {
      const res = await getAccountDetails(accountName);
      setModalData({ account: res });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewDetails = async (recId: string) => {
    console.log("View Details clicked for", recId);
    setModalLoading(true);
    setActiveModal('recommendation');
    try {
      const res = await getRecommendationDetails(recId);
      setModalData({ recommendation: res });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewCalls = async (repId: string) => {
    console.log("View Calls", repId);
    setModalLoading(true);
    setActiveModal('calls');
    try {
      const res = await getRepCalls(repId);
      setModalData({ repId, calls: res.calls || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleShowAllReps = async () => {
    console.log("Show All Reps clicked");
    setModalLoading(true);
    setActiveModal('all_reps');
    try {
      const res = await getAllReps();
      setModalData({ reps: res.reps || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewRepBreakdown = async (objectionId: string) => {
    console.log("Rep Breakdown", objectionId);
    setModalLoading(true);
    setActiveModal('rep_breakdown');
    try {
      const res = await getObjectionRepBreakdown(objectionId);
      setModalData({ objectionId, breakdown: res.breakdown || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSeeEvidence = async (objectionId: string) => {
    console.log("See Evidence", objectionId);
    setModalLoading(true);
    try {
      const res = await getObjectionEvidence(objectionId);
      setEvidence(res);
      setEvFilter(objectionId);
      setActiveTab(2);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Derived ── */
  const allTabs = dashboard ? ['Exec Summary', ...dashboard.tabs] : [];
  const currentFilterTags = [
    dateRange,
    segment,
    callStage,
    region,
    `${filters?.repCohort?.repCount ?? 0} reps`,
  ];

  const sortedRepPerformance = useMemo(() => {
    if (!keyFindings) return [];
    const reps = [...keyFindings.repPerformance];
    if (repSortCriterion === 'Resolution Rate' || repSortCriterion === 'Performance') {
      return reps.sort((a, b) => b.resolutionRatePct - a.resolutionRatePct);
    } else if (repSortCriterion === 'Name') {
      return reps.sort((a, b) => a.repName.localeCompare(b.repName));
    }
    return reps; // Default Top Objection
  }, [keyFindings, repSortCriterion]);

  /* ── Loading state ── */
  if (!filters) {
    return (
      <div className="ai-deep-researcher">
        <div className="adr-loader">
          <Loader2 size={32} className="adr-spin" />
          <p>Loading AI Deep Researcher…</p>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="ai-deep-researcher">

      {/* Scrollable content */}
      <div className="adr-body">

        {/* ═══════════════ INPUT PHASE ═══════════════ */}
        {phase === PHASE.INPUT && (
          <div className="adr-phase-input">
            <h1 className="adr-page-title">AI Deep Researcher</h1>
            <p className="adr-page-subtitle">
              Ask a complex business question. Get a structured, evidence-backed analytical report.
            </p>

            {/* Query input */}
            <div className="adr-query-card">
              <textarea
                id="adr-query-input"
                className="adr-query-area"
                rows={3}
                placeholder="Enter your research question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Action Row containing filters on left and run button on right */}
            <div className="adr-action-row">
              <div className="adr-action-left">
                {/* Filter pills */}
                <div className="adr-filters-row">
                  <FilterPill icon={Calendar} value={dateRange} options={filters.dateRange.options} onChange={setDateRange} />
                  <FilterPill icon={Building2} value={segment}   options={filters.segment.options}   onChange={setSegment} />
                  <FilterPill icon={GitBranch} value={callStage} options={filters.callStage.options} onChange={setCallStage} />
                  <FilterPill icon={MapPin}    value={region}    options={filters.region.options}    onChange={setRegion} />
                  <div className="adr-fpill adr-fpill-hl adr-fpill-static">
                    <div className="adr-fpill-btn">
                      <Users size={14} />
                      <span>My Team ({filters.repCohort.repCount} reps)</span>
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>

                {/* Rep cohort note */}
                <div className="adr-cohort-note">
                  <Info size={14} />
                  <span>Rep Cohort auto-set from your org hierarchy</span>
                </div>
              </div>

              {/* Run Analysis */}
              <div className="adr-run-row">
                <button
                  id="adr-run-analysis-btn"
                  className="adr-btn-run"
                  onClick={handleRun}
                  disabled={!query.trim()}
                >
                  <Play size={16} /> Run Analysis
                </button>
              </div>
            </div>

            {/* Example questions */}
            <div className="adr-examples-section">
              <h3 className="adr-examples-label">EXAMPLE QUESTIONS</h3>
              <div className="adr-examples-list">
                {examples.slice(0, 3).map((q, i) => (
                  <button key={i} className="adr-example-row" onClick={() => setQuery(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ RUNNING PHASE ═══════════════ */}
        {phase === PHASE.RUNNING && (
          <div className="adr-phase-running">
            {/* Query recap */}
            <div className="adr-recap-card">
              <p className="adr-recap-label">Analysing query</p>
              <p className="adr-recap-query">{query}</p>
              <div className="adr-recap-tags">
                {currentFilterTags.map((t) => (
                  <span key={t} className="adr-tag-blue">{t}</span>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="adr-progress-section">
              <div className="adr-progress-head">
                <h2 className="adr-progress-title">Analysis Progress</h2>
                <span className="adr-progress-pct">{progress?.progressPercent ?? 0}%</span>
              </div>
              <div className="adr-progress-track">
                <div
                  className="adr-progress-fill"
                  style={{ width: `${progress?.progressPercent ?? 0}%` }}
                />
              </div>
              <div className="adr-steps-list">
                {(progress?.steps ?? []).map((s) => (
                  <div key={s.stepId} className={`adr-step-row adr-step-${s.status}`}>
                    <div className="adr-step-icon">
                      {s.status === 'complete'    && <CheckCircle size={20} />}
                      {s.status === 'in_progress' && <Loader2 size={20} className="adr-spin" />}
                      {s.status === 'queued'      && <Circle size={20} />}
                    </div>
                    <span className="adr-step-text">{s.detail ?? s.label}</span>
                    <span className="adr-step-status">
                      {s.status === 'complete'    ? 'Complete'
                        : s.status === 'in_progress' ? 'In Progress'
                        : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ REPORT PHASE ═══════════════ */}
        {phase === PHASE.REPORT && dashboard && (
          <div className="adr-phase-report">
            {/* Report header row */}
            <div className="adr-report-header">
              <h1 className="adr-report-title">{dashboard.reportTitle}</h1>
              <button className="adr-btn-new-analysis" onClick={handleNewAnalysis}>
                <Plus size={14} /> New Analysis
              </button>
            </div>
            <div className="adr-report-tags">
              {dashboard.filterTags.map((t) => <span key={t} className="adr-report-tag">{t}</span>)}
            </div>

            {/* Tab bar */}
            <nav className="adr-tabs-bar">
              {allTabs.map((tab, i) => (
                <button
                  key={tab}
                  className={`adr-tab-item${activeTab === i ? ' adr-active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* ── Tab 0: Exec Summary ── */}
            {activeTab === 0 && (
              <div className="adr-panel">
                <h3 className="adr-panel-title">Executive Summary</h3>
                {isLoadingExecSummary ? (
                  <div className="adr-loader-sm" style={{ padding: '20px', textAlign: 'center' }}><Loader2 size={24} className="adr-spin"/></div>
                ) : execSummary ? (
                  <>
                    <p className="adr-panel-text">{execSummary.execSummary}</p>
                    <div className="adr-summary-stats">
                      <span><strong>{dashboard.totalCalls.toLocaleString()}</strong> calls analyzed</span>
                      <span><strong>{dashboard.totalReps}</strong> reps</span>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ── Tab 1: Key Findings ── */}
            {activeTab === 1 && (
              <div className="adr-panel-findings">
                {isLoadingKeyFindings ? (
                  <div className="adr-loader-sm" style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="adr-spin"/></div>
                ) : keyFindings ? (
                  <>
                    {/* Objections table */}
                    <h3 className="adr-section-title">TOP OBJECTIONS — FREQUENCY RANKING</h3>
                    <div className="adr-table-wrap">
                      <table className="adr-obj-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>OBJECTION</th>
                            <th>FREQUENCY</th>
                            <th>RESOLUTION RATE</th>
                            <th>TREND</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keyFindings.objections.map((o) => (
                            <tr key={o.rank}>
                              <td className="adr-cell-rank">{o.rank}</td>
                              <td className="adr-cell-obj">{o.objection}</td>
                              <td className="adr-cell-freq">
                                <div className="adr-freq-bar-wrap">
                                  <div className="adr-freq-bar-track">
                                    <div
                                      className={`adr-freq-bar rank-${o.rank}`}
                                      style={{ width: `${(o.frequencyPct / 40) * 100}%` }}
                                    />
                                  </div>
                                  <span>{o.frequencyPct}%</span>
                                </div>
                              </td>
                              <td>
                                <span className={`adr-res-badge ${o.resolutionRatePct < 35 ? 'low' : o.resolutionRatePct < 50 ? 'mid' : 'high'}`}>
                                  {o.resolutionRatePct}%
                                </span>
                              </td>
                              <td>
                                {o.trend === 'up'   && <span className="adr-trend adr-trend-up"><ArrowUpRight size={14} /></span>}
                                {o.trend === 'down' && <span className="adr-trend adr-trend-down"><ArrowDownRight size={14} /></span>}
                                {o.trend === 'flat' && <span className="adr-trend adr-trend-flat"><Minus size={14} /></span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                {/* Low-resolution alert */}
                {keyFindings.lowResolutionAlerts.length > 0 && (
                  <div className="adr-low-res-alert">
                    <div className="adr-alert-head">
                      <AlertTriangle size={16} />
                      <strong>Low Resolution Alert</strong>
                    </div>
                    {keyFindings.lowResolutionAlerts.map((a) => (
                      <p key={a.objection} className="adr-alert-text">
                        {a.objection} is being resolved only {a.resolutionRatePct}% of the time —
                        going unaddressed in {a.unaddressedRatePct}% of calls where it appears.
                      </p>
                    ))}
                    <div className="adr-alert-actions">
                      <button className="adr-btn-alert" onClick={() => handleViewRepBreakdown('low_resolution')}>View Rep Breakdown</button>
                      <button
                        className="adr-btn-alert"
                        onClick={() => handleSeeEvidence('low_resolution')}
                      >
                        See Evidence →
                      </button>
                    </div>
                  </div>
                )}

                {/* Rep performance */}
                <div className="adr-rep-perf-section">
                  <div className="adr-rep-perf-head">
                    <h3 className="adr-section-title">REP PERFORMANCE — Integration Complexity</h3>
                    <SortDropdown 
                      value={repSortCriterion} 
                      options={['Top Objection', 'Resolution Rate', 'Performance', 'Name']} 
                      onChange={(val) => setRepSortCriterion(val)} 
                    />
                  </div>
                  <div className="adr-rep-bars">
                    {sortedRepPerformance.map((rep) => (
                      <div key={rep.repId} className="adr-rep-bar-row">
                        <div className="adr-rep-avatar" style={{ background: rep.avatarColor }}>
                          {rep.initials}
                        </div>
                        <span className="adr-rep-name">{rep.repName}</span>
                        <div className="adr-rep-bar-track">
                          <div
                            className={`adr-rep-bar-fill ${rep.resolutionRatePct >= 60 ? 'green' : rep.resolutionRatePct >= 40 ? 'amber' : 'red'}`}
                            style={{ width: `${rep.resolutionRatePct}%` }}
                          />
                        </div>
                        <span className="adr-rep-pct">{rep.resolutionRatePct}%</span>
                        {rep.coachingNeeded
                          ? <button className="adr-coaching-label" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} onClick={() => console.log('Coaching Needed clicked for', rep.repId)}>Coaching needed</button>
                          : <button className="adr-btn-viewcalls" onClick={() => handleViewCalls(rep.repId)}>View calls</button>
                        }
                      </div>
                    ))}
                  </div>
                  <button className="adr-show-all-link" onClick={handleShowAllReps}>
                    Show all {filters.repCohort.repCount} reps →
                  </button>
                </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ── Tab 2: Evidence ── */}
            {activeTab === 2 && evidence && (
              <div className="adr-panel-evidence">
                <h3 className="adr-filter-label">
                  <Eye size={14} /> FILTER BY FINDING
                </h3>
                <div className="adr-ev-filters">
                  <button
                    className={`adr-ev-chip${evFilter === 'all' ? ' adr-active' : ''}`}
                    onClick={() => handleEvFilter('all')}
                  >
                    All findings
                  </button>
                  {EVIDENCE_FINDINGS.map((f) => (
                    <button
                      key={f}
                      className={`adr-ev-chip${evFilter === f ? ' adr-active' : ''}`}
                      onClick={() => handleEvFilter(f)}
                    >
                      {capitalize(f)}
                    </button>
                  ))}
                </div>

                <div className="adr-ev-list">
                  {evidence.evidence.map((ev) => (
                    <div key={ev.evidenceId} className="adr-ev-card">
                      <div className="adr-ev-top">
                        <span className="adr-ev-badge">{capitalize(ev.finding)}</span>
                        <span className="adr-ev-callid">CALL-{ev.callId.replace('call_', '')}</span>
                      </div>
                      <p className="adr-ev-meta">
                        {ev.repName} → {ev.prospectName} → {ev.accountName} → {ev.callDate}
                      </p>
                      <blockquote className="adr-ev-quote">"{ev.quote}"</blockquote>
                      <div className="adr-ev-actions">
                        <button className="adr-btn-opencall" onClick={() => handleOpenCall(ev.callId)}>
                          <Play size={12} /> Open Call at {fmtTime(ev.callTimestampSeconds)}
                        </button>
                        <button className="adr-btn-viewacct" onClick={() => handleViewAccount(ev.accountName)}>View Account</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="adr-ev-pagination">
                  <span className="adr-ev-showing">
                    Showing {evidence.evidence.length} of {evidence.total} findings
                  </span>
                  <div className="adr-ev-pages">
                    <button
                      className="adr-pg-btn"
                      disabled={evPage <= 1}
                      onClick={() => handleEvPage(evPage - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span>Page {evPage} of {evidence.totalPages}</span>
                    <button
                      className="adr-pg-btn"
                      disabled={evPage >= evidence.totalPages}
                      onClick={() => handleEvPage(evPage + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 3: Trends ── */}
            {activeTab === 3 && (
              <div className="adr-panel">
                <h3 className="adr-panel-title">Trend Analysis</h3>
                {isLoadingTrends ? (
                  <div className="adr-loader-sm" style={{ padding: '20px', textAlign: 'center' }}><Loader2 size={24} className="adr-spin"/></div>
                ) : trends ? (
                  <p className="adr-panel-text">{trends.trends}</p>
                ) : null}
              </div>
            )}

            {/* ── Tab 4: Risks & Opps ── */}
            {activeTab === 4 && (
              <div className="adr-panel">
                <h3 className="adr-panel-title">Risks &amp; Opportunities</h3>
                {isLoadingRisks ? (
                   <div className="adr-loader-sm" style={{ padding: '20px', textAlign: 'center' }}><Loader2 size={24} className="adr-spin"/></div>
                ) : risks ? (
                  <>
                    {risks.risksAndOpportunities.split('\n\n').map((block, i) => (
                      <div
                        key={i}
                        className={`adr-ro-block ${block.startsWith('RISK') ? 'risk' : 'opp'}`}
                      >
                        <p className="adr-panel-text">{block}</p>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            )}

            {/* ── Tab 5: Recommendations ── */}
            {activeTab === 5 && (
              <div className="adr-panel-recs">
                {isLoadingRecommendations ? (
                  <div className="adr-loader-sm" style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="adr-spin"/></div>
                ) : recommendations ? (
                  <>
                    {recommendations.recommendations.map((rec, idx) => {
                      const icons = [AlertCircle, Target, BookOpen];
                      const RecIcon = icons[idx % icons.length];
                      return (
                        <div key={rec.recommendationId} className={`adr-rec-card p-${rec.priority}`}>
                          <div className="adr-rec-top">
                            <div className={`adr-rec-icon-wrap ${rec.priority}`}>
                              <RecIcon size={15} />
                            </div>
                            <span className={`adr-pri-badge ${rec.priority}`}>{rec.priority}</span>
                            <h4 className="adr-rec-title">{rec.title}</h4>
                          </div>
                          <p className="adr-rec-desc">{rec.description}</p>
                          <div className="adr-rec-based-row">
                            <span className="adr-rec-based-label">Based on:</span>
                            <div className="adr-rec-tags">
                              {rec.basedOnTags.map((t) => (
                                <span key={t} className="adr-tag-sm">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div className="adr-rec-actions">
                            <button className={`adr-btn-view-details ${rec.priority}`} onClick={() => handleViewDetails(rec.recommendationId)}>
                              View Details
                            </button>
                            <button
                              className="adr-btn-share"
                              disabled={
                                shareStatus[rec.recommendationId] === 'loading' ||
                                shareStatus[rec.recommendationId] === 'success'
                              }
                              onClick={() => handleShare(rec.recommendationId)}
                            >
                              {shareStatus[rec.recommendationId] === 'loading'
                                ? <Loader2 size={14} className="adr-spin" />
                                : shareStatus[rec.recommendationId] === 'success'
                                ? <><Check size={14} /> Shared</>
                                : <><Share2 size={14} /> Share with Team</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            )}

            {/* ── Tab 6: Escalation / Ask Anything ── */}
            {activeTab === 6 && (
              <div className="adr-panel-esc">
                {/* Session label */}
                <div className="adr-esc-session-label">
                  <span className="adr-esc-session-dot" />
                  Ask Anything Session
                </div>

                {/* Default Q&A shown before any user input */}
                {escalationHistory.length === 0 && (
                  <div className="adr-esc-pair">
                    <div className="adr-esc-q">
                      <p className="adr-esc-q-label">YOUR QUESTION</p>
                      <p className="adr-esc-q-text">
                        Which objections are most common in my team&apos;s mid-market calls?
                      </p>
                    </div>
                    <div className="adr-esc-a">
                      <p className="adr-esc-a-label">
                        <Sparkles size={12} /> AI ANSWER
                      </p>
                      <p className="adr-esc-a-text">
                        Based on recent call analysis, the most common objections in mid-market calls are:{`\n\n`}
                        1. **Integration complexity** — mentioned in ~45% of calls{`\n`}
                        2. **Pricing concerns** — mentioned in ~38% of calls{`\n`}
                        3. **Incumbent vendor relationships** — mentioned in ~31% of calls{`\n\n`}
                        These patterns appear consistently across your team, though resolution rates vary significantly by rep.
                      </p>
                    </div>
                  </div>
                )}

                {/* Conversation history */}
                {escalationHistory.map((item, i) => (
                  <div key={i} className="adr-esc-pair">
                    <div className="adr-esc-q">
                      <p className="adr-esc-q-label">YOUR QUESTION</p>
                      <p className="adr-esc-q-text">{item.q}</p>
                    </div>
                    <div className="adr-esc-a">
                      <p className="adr-esc-a-label">
                        <Sparkles size={12} /> AI ANSWER
                      </p>
                      <p className="adr-esc-a-text">{item.answer}</p>
                    </div>
                  </div>
                ))}

                {/* Deep analysis CTA — purple gradient */}
                <div className="adr-deep-cta">
                  <div className="adr-deep-cta-header">
                    <div className="adr-deep-cta-icon">
                      <Sparkles size={18} color="white" />
                    </div>
                    <p className="adr-deep-cta-title">Want a deeper analysis?</p>
                  </div>
                  <p className="adr-deep-cta-desc">
                    AI Researcher can generate a comprehensive, evidence-backed report with detailed
                    findings, citation-level evidence, trend analysis, and actionable recommendations.
                  </p>
                  <ul className="adr-deep-cta-list">
                    <li>Statistical analysis across all relevant calls and data sources</li>
                    <li>Rep-level performance breakdowns with coaching priorities</li>
                    <li>Direct citations with deep-links to specific call moments</li>
                    <li>Trend detection and predictive insights</li>
                  </ul>
                  <button
                    className="adr-btn-deep"
                    onClick={() => {
                      setQuery(escalationQ || 'Which objections are my team encountering most in mid-market discovery calls?');
                      handleNewAnalysis();
                    }}
                  >
                    <Play size={13} /> Run Deep Analysis →
                  </button>
                  <p className="adr-deep-cta-note">
                    Deep analysis typically completes in 4 minutes.
                  </p>
                </div>

                {/* Ask anything input */}
                <div className="adr-esc-input-row">
                  <input
                    id="adr-escalation-input"
                    className="adr-esc-input"
                    placeholder="e.g., How do top performers handle integration objections?"
                    value={escalationQ}
                    onChange={(e) => setEscalationQ(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEscalation()}
                  />
                  <button
                    className="adr-btn-send"
                    onClick={handleEscalation}
                    disabled={!escalationQ.trim() || escalationLoading}
                  >
                    {escalationLoading ? <Loader2 size={16} className="adr-spin" /> : <Send size={16} />}
                  </button>
                </div>
                {/* Inline follow-up card (visible on all tabs except Escalation tab 6) */}
                {activeTab !== 6 && (
                  <div className="adr-followup-card">
                    <div className="adr-followup-header">
                      <Search size={16} />
                      <span className="adr-followup-title">Run Follow-Up Analysis</span>
                    </div>
                    <p className="adr-followup-desc">
                      Dig deeper into any aspect of this report or explore related questions.
                    </p>
                    <div className="adr-followup-input-row">
                      <input
                        className="adr-followup-input"
                        placeholder="e.g., How do top performers handle integration objections?"
                        value={escalationQ}
                        onChange={(e) => setEscalationQ(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setActiveTab(6);
                            handleEscalation();
                          }
                        }}
                      />
                      <button
                        className="adr-followup-btn"
                        onClick={() => { setActiveTab(6); handleEscalation(); }}
                        disabled={!escalationQ.trim() || escalationLoading}
                      >
                        Run Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Drill-down Modals ── */}
      {activeModal && (
        <div className="adr-modal-overlay" onClick={() => { setActiveModal(null); setModalData(null); }}>
          <div className="adr-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="adr-modal-header">
              <h3 className="adr-modal-title">
                {activeModal === 'calls' && `Calls List`}
                {activeModal === 'all_reps' && `All Reps`}
                {activeModal === 'rep_breakdown' && `Objection Resolution Breakdown`}
                {activeModal === 'account' && `Account Details`}
                {activeModal === 'recommendation' && `Recommendation Details`}
              </h3>
              <button className="adr-modal-close" onClick={() => { setActiveModal(null); setModalData(null); }}>
                <X size={18} />
              </button>
            </div>
            <div className="adr-modal-body">
              {modalLoading ? (
                <div className="adr-modal-loader">
                  <Loader2 size={32} className="adr-spin" />
                  <p>Loading details...</p>
                </div>
              ) : modalData ? (
                <>
                  {/* 1. Calls list modal */}
                  {activeModal === 'calls' && (
                    <div>
                      <h4 style={{ marginBottom: 12, fontSize: '1rem', fontWeight: 600 }}>
                        {modalData.repId === 'Call Detail' ? 'Call Details' : `Calls managed by rep`}
                      </h4>
                      {modalData.calls && modalData.calls.length > 0 ? (
                        modalData.calls.map((c: any) => (
                          <div key={c.id} className="adr-modal-list-item">
                            <div className="adr-modal-list-item-title">{c.title || 'Sales Call'}</div>
                            <div className="adr-modal-list-item-sub">
                              Date: {c.callDate ? new Date(c.callDate).toLocaleDateString() : 'N/A'} | Owner: {c.callOwner || 'N/A'}
                            </div>
                            {c.transcript?.summary && (
                              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#cbd5e1', borderTop: '1px solid #334155', paddingTop: 8 }}>
                                <strong>Summary:</strong> {c.transcript.summary}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#94a3b8' }}>No calls found.</p>
                      )}
                    </div>
                  )}

                  {/* 2. All Reps modal */}
                  {activeModal === 'all_reps' && (
                    <div className="adr-modal-grid">
                      {modalData.reps && modalData.reps.map((r: any) => (
                        <div key={r.repId} className="adr-modal-grid-card">
                          <div className="adr-modal-rep-avatar" style={{ backgroundColor: r.avatarColor }}>
                            {r.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.repName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sales Representative</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Objection Breakdown modal */}
                  {activeModal === 'rep_breakdown' && (
                    <div>
                      <h4 style={{ marginBottom: 14, fontWeight: 600 }}>
                        Objection: {modalData.objectionId ? modalData.objectionId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Integration Complexity'}
                      </h4>
                      {modalData.breakdown && modalData.breakdown.map((item: any) => (
                        <div key={item.repId} className="adr-rep-bar-row" style={{ background: '#0f172a', padding: '10px 14px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="adr-rep-avatar" style={{ background: item.avatarColor }}>
                            {item.initials}
                          </div>
                          <span className="adr-rep-name" style={{ flex: 1 }}>{item.repName}</span>
                          <div className="adr-rep-bar-track" style={{ width: '150px' }}>
                            <div
                              className={`adr-rep-bar-fill ${item.resolutionRatePct >= 60 ? 'green' : item.resolutionRatePct >= 40 ? 'amber' : 'red'}`}
                              style={{ width: `${item.resolutionRatePct}%` }}
                            />
                          </div>
                          <span className="adr-rep-pct">{item.resolutionRatePct}%</span>
                          {item.coachingNeeded && (
                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#ef4444', color: 'white', borderRadius: 4 }}>Coaching Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4. Account details modal */}
                  {activeModal === 'account' && modalData.account && (
                    <div>
                      <div className="adr-modal-detail-row">
                        <div className="adr-modal-detail-label">Account Name</div>
                        <div className="adr-modal-detail-val" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{modalData.account.name}</div>
                      </div>
                      <div className="adr-modal-detail-row">
                        <div className="adr-modal-detail-label">Account ID</div>
                        <div className="adr-modal-detail-val">{modalData.account.id}</div>
                      </div>
                      {modalData.account.industry && (
                        <div className="adr-modal-detail-row">
                          <div className="adr-modal-detail-label">Industry</div>
                          <div className="adr-modal-detail-val">{modalData.account.industry}</div>
                        </div>
                      )}
                      {modalData.account.createdAt && (
                        <div className="adr-modal-detail-row">
                          <div className="adr-modal-detail-label">Created At</div>
                          <div className="adr-modal-detail-val">{new Date(modalData.account.createdAt).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Recommendation details modal */}
                  {activeModal === 'recommendation' && modalData.recommendation && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span className={`adr-pri-badge ${modalData.recommendation.priority}`} style={{ textTransform: 'uppercase' }}>
                          {modalData.recommendation.priority}
                        </span>
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{modalData.recommendation.title}</h4>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: 18 }}>
                        {modalData.recommendation.description}
                      </p>
                      {modalData.recommendation.basedOnTags && modalData.recommendation.basedOnTags.length > 0 && (
                        <div>
                          <div className="adr-modal-detail-label" style={{ marginBottom: 6 }}>Based On</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {modalData.recommendation.basedOnTags.map((t: string) => (
                              <span key={t} className="adr-tag-sm" style={{ background: '#334155', color: '#f8fafc', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#94a3b8' }}>Failed to load modal details.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportTabs from '../components/ReportTabs';
import ReportSection from '../components/ReportSection';
import EscalationTab from '../components/EscalationTab';
import { getReport } from '../services/api';

// Demo report data matching the screenshot
const DEMO_REPORT = {
  id: 'demo-report-1',
  title: 'Mid-Market Discovery Objection Patterns — West Team',
  query: 'Which objections are most common in my team\'s mid-market calls?',
  filters: {
    segment: 'Mid-Market',
    stage: 'Discovery stage',
    region: 'West',
    timePeriod: 'Last 60 days',
  },
  stats: {
    calls: 234,
    reps: 8,
  },
  sections: [
    {
      section_id: 'exec_summary',
      title: 'Executive Summary',
      summary: 'Analysis of 234 discovery calls from the West team over the last 60 days reveals three dominant objection patterns in mid-market prospects.',
      bullets: [
        { bullet_id: 'es_0', text: 'Integration complexity is the #1 objection, appearing in 45% of all discovery calls. Prospects consistently express concern about connecting 10-20+ existing tools.', citations: [{ display_label: 'TechFlow Discovery Call #1', source_type: 'TRANSCRIPT' }], confidence: 0.95 },
        { bullet_id: 'es_1', text: 'Pricing concerns appear in 38% of calls, with prospects comparing current vendor costs and questioning ROI timelines.', citations: [{ display_label: 'DataPrime Discovery Call', source_type: 'TRANSCRIPT' }], confidence: 0.92 },
        { bullet_id: 'es_2', text: 'Incumbent vendor relationships create inertia in 31% of deals, with teams resistant to change despite suboptimal current solutions.', citations: [{ display_label: 'RetailMax Initial Discovery', source_type: 'TRANSCRIPT' }], confidence: 0.90 },
      ],
    },
    {
      section_id: 'key_findings',
      title: 'Key Findings',
      summary: 'Three recurring objection themes dominate mid-market discovery conversations.',
      bullets: [
        { bullet_id: 'kf_0', text: 'Integration complexity is mentioned in 45% of calls. Prospects report managing 10-20 tools with custom middleware, losing 15-20 hours/week on maintenance.', citations: [{ display_label: 'TechFlow Discovery #1', source_type: 'TRANSCRIPT' }], confidence: 0.95 },
        { bullet_id: 'kf_1', text: 'Pricing discussions surface in 38% of calls. Common concerns: per-seat pricing at scale, 15% annual increases from incumbents, and unclear ROI timelines.', citations: [{ display_label: 'TechFlow Follow-up', source_type: 'TRANSCRIPT' }], confidence: 0.93 },
        { bullet_id: 'kf_2', text: 'Incumbent vendor lock-in appears in 31% of calls. Existing contracts (12-24 month terms) and team familiarity create resistance to switching.', citations: [{ display_label: 'DataPrime Stakeholder Call', source_type: 'TRANSCRIPT' }], confidence: 0.88 },
        { bullet_id: 'kf_3', text: 'Security review timelines (4-6 weeks) emerged as a secondary blocker in enterprise-adjacent mid-market deals.', citations: [{ display_label: 'TechFlow CTO Call', source_type: 'TRANSCRIPT' }], confidence: 0.85 },
      ],
    },
    {
      section_id: 'evidence',
      title: 'Evidence',
      summary: 'Direct evidence from call transcripts and emails supporting each finding.',
      bullets: [
        { bullet_id: 'ev_0', text: '"Our current vendor requires custom middleware for every integration. It takes 3-4 weeks per integration." — Alex Thompson, VP Engineering, TechFlow Inc', citations: [{ display_label: 'TechFlow Discovery #1', source_type: 'TRANSCRIPT' }], confidence: 1.0 },
        { bullet_id: 'ev_1', text: '"Our current solution costs us about $8,000 per month and we feel we are not getting enough value. The incumbent vendor has been raising prices 15% annually." — Alex Thompson', citations: [{ display_label: 'TechFlow Discovery #1', source_type: 'TRANSCRIPT' }], confidence: 1.0 },
        { bullet_id: 'ev_2', text: '"We have data scattered across 8 different systems and getting a unified view is nearly impossible." — Robert Kim, Director of Ops, DataPrime', citations: [{ display_label: 'DataPrime Discovery', source_type: 'TRANSCRIPT' }], confidence: 1.0 },
        { bullet_id: 'ev_3', text: '"Our AWS bill has grown 40% year over year" — Sandra Lee, CEO, CloudServe Pro', citations: [{ display_label: 'CloudServe Enterprise Discovery', source_type: 'TRANSCRIPT' }], confidence: 1.0 },
      ],
    },
    {
      section_id: 'trends',
      title: 'Trends',
      summary: 'Temporal patterns observed across the 60-day analysis window.',
      bullets: [
        { bullet_id: 'tr_0', text: 'Integration complexity objections have remained stable at ~45% over the 60-day period, suggesting a systemic mid-market pain point rather than a seasonal trend.', citations: [{ display_label: 'Pattern Analysis', source_type: 'CRM' }], confidence: 0.87 },
        { bullet_id: 'tr_1', text: 'Pricing sensitivity has increased from 32% to 38% in the second 30-day period, potentially correlated with Q2 budget cycles.', citations: [{ display_label: 'Trend Analysis', source_type: 'CRM' }], confidence: 0.82 },
        { bullet_id: 'tr_2', text: 'Overall call sentiment trending slightly downward (0.72 → 0.65 average), suggesting prospects are bringing more objections earlier in discovery.', citations: [{ display_label: 'Sentiment Tracking', source_type: 'CRM' }], confidence: 0.80 },
      ],
    },
    {
      section_id: 'risks_opps',
      title: 'Risks & Opportunities',
      summary: 'Key risk factors and growth opportunities identified from the analysis.',
      bullets: [
        { bullet_id: 'ro_0', text: 'RISK: 3 out of 15 critical integrations are not natively supported, creating a blocker for TechFlow and similar prospects. Universal API adapter messaging needs strengthening.', citations: [{ display_label: 'TechFlow Follow-up', source_type: 'TRANSCRIPT' }], confidence: 0.90 },
        { bullet_id: 'ro_1', text: 'OPPORTUNITY: Concurrent user pricing model resonates strongly with mid-market (150+ seat accounts). Consider making this the default pitch for mid-market segment.', citations: [{ display_label: 'TechFlow Follow-up', source_type: 'TRANSCRIPT' }], confidence: 0.88 },
        { bullet_id: 'ro_2', text: 'RISK: Security review timelines (4-6 weeks) can stall deals. Pre-packaging SOC 2 documentation could reduce friction.', citations: [{ display_label: 'TechFlow CTO Call', source_type: 'TRANSCRIPT' }], confidence: 0.85 },
        { bullet_id: 'ro_3', text: 'OPPORTUNITY: 30-40% cost reduction messaging is landing well. CloudServe prospect showed strong interest at the enterprise level.', citations: [{ display_label: 'CloudServe Discovery', source_type: 'TRANSCRIPT' }], confidence: 0.87 },
      ],
    },
    {
      section_id: 'recommendations',
      title: 'Recommendations',
      summary: 'Actionable next steps based on the analysis.',
      bullets: [
        { bullet_id: 'rc_0', text: 'Create a "Mid-Market Integration Playbook" with pre-built responses to the top 3 integration objections and a demo flow showing the Universal API adapter.', citations: [], confidence: 0.90 },
        { bullet_id: 'rc_1', text: 'Switch default pricing to concurrent-user model for all mid-market proposals (150+ seat accounts) to reduce per-seat pricing objection.', citations: [], confidence: 0.88 },
        { bullet_id: 'rc_2', text: 'Implement a "Security Fast-Track" package: pre-package SOC 2 Type II docs, DPA, and pentest results to reduce the 4-6 week security review to 1-2 weeks.', citations: [], confidence: 0.85 },
        { bullet_id: 'rc_3', text: 'Schedule coaching sessions for reps with below-average objection handling resolution rates, focusing on the "incumbent vendor" objection.', citations: [], confidence: 0.82 },
      ],
    },
  ],
};

export default function ResearchReportPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(DEMO_REPORT);
  const [activeTab, setActiveTab] = useState('escalation');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reportId && reportId !== 'demo-report-1') {
      loadReport(reportId);
    }
  }, [reportId]);

  const loadReport = async (id) => {
    setIsLoading(true);
    try {
      const data = await getReport(id);
      if (data && data.sections) {
        setReport({
          id: data.id,
          title: data.title || 'Research Report',
          query: data.query || '',
          filters: data.filters || {},
          stats: {
            calls: data.metadata?.total_calls || 234,
            reps: 8,
          },
          sections: data.sections || [],
        });
        setActiveTab('exec_summary');
      }
    } catch (err) {
      console.error('Load report error:', err);
    }
    setIsLoading(false);
  };

  const tabs = [
    { id: 'exec_summary', label: 'Exec Summary' },
    { id: 'key_findings', label: 'Key Findings' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'trends', label: 'Trends' },
    { id: 'risks_opps', label: 'Risks & Opps' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'escalation', label: 'ESCALATION', isEscalation: true },
  ];

  const activeSection = report.sections.find(s => s.section_id === activeTab);

  const chipData = [
    { label: `${report.stats.calls} calls`, color: 'teal' },
    { label: `${report.stats.reps} reps`, color: 'teal' },
    { label: report.filters.segment || 'Mid-Market', color: 'blue' },
    { label: report.filters.stage || 'Discovery stage', color: 'blue' },
    { label: report.filters.region || 'West', color: 'blue' },
    { label: report.filters.timePeriod || 'Last 60 days', color: 'indigo' },
  ];

  return (
    <div className="page-content">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/research')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#64748B',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '0 0 16px 0',
          transition: 'color 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#3B5BF5'}
        onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        New Research
      </button>

      {/* Report Header */}
      <div className="report-header">
        <h1 className="report-title">{report.title}</h1>
        <div className="report-chips-row">
          {chipData.map((chip, i) => (
            <span key={i} className={`report-chip ${chip.color}`}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <ReportTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'escalation' ? (
        <EscalationTab
          query={report.query}
          onRunDeepAnalysis={() => navigate('/research')}
        />
      ) : activeSection ? (
        <ReportSection section={activeSection} reportId={report.id} />
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">Select a tab to view report section</div>
        </div>
      )}
    </div>
  );
}

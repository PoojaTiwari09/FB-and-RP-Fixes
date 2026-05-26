import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterDropdowns from '../components/FilterDropdowns';
import ExampleQuestions from '../components/ExampleQuestions';
import ProgressIndicator from '../components/ProgressIndicator';
import { createResearchJob } from '../services/api';
import { useResearchJob } from '../contexts/ResearchJobContext';

export default function DeepResearchPage() {
  const navigate = useNavigate();
  const { isLoading, jobProgress, startPolling, cancelJob } = useResearchJob();

  const [query, setQuery] = useState('What patterns distinguish our won deals from lost deals this quarter?');
  const [filters, setFilters] = useState({
    timePeriod: 'Last 60 days',
    segment: 'Mid-Market',
    stage: 'Discovery',
    region: 'West',
    team: 'My Team (8 reps)',
  });

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleClick = useCallback((question) => {
    setQuery(question);
  }, []);

  const handleRunAnalysis = async () => {
    if (!query.trim()) return;

    try {
      const periodMap = {
        'Last 7 days': 7, 'Last 14 days': 14, 'Last 30 days': 30,
        'Last 60 days': 60, 'Last 90 days': 90,
      };

      const result = await createResearchJob({
        query: query.trim(),
        periodDays: periodMap[filters.timePeriod] || 60,
        filters: {
          segment: filters.segment,
          stage: filters.stage,
          region: filters.region,
          team: filters.team,
        },
      });

      // Hand off to global context — polling continues even if user leaves this page
      startPolling(result.job_id);

    } catch (err) {
      console.error('Run analysis error:', err);
      alert('Failed to start research: ' + err.message);
    }
  };

  // Auto-navigate to report when job completes while user is on this page
  React.useEffect(() => {
    if (jobProgress?.completed) {
      const reportId = jobProgress.reportId;
      if (reportId) {
        navigate(`/research/report/${reportId}`);
      } else {
        navigate('/research/report');
      }
    }
  }, [jobProgress?.completed, jobProgress?.reportId, navigate]);

  // Render query text with underlined keywords
  const renderQueryWithHighlights = (text) => {
    const keywords = ['patterns', 'distinguish', 'won deals', 'lost deals', 'quarter',
      'objections', 'mid-market', 'talk-track', 'adoption rate', 'discovery',
      'integration complexity', 'West team', 'reps'];
    let result = text;
    return result;
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="research-header">
        <h1>AI Deep Researcher</h1>
        <p className="subtitle">Ask a complex business question. Get a structured, evidence-backed analytical report.</p>
      </div>

      {/* Query Input */}
      <div className="query-input-container">
        <textarea
          id="research-query-input"
          className="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a complex business question..."
          rows={2}
        />
      </div>

      {/* Filter Bar */}
      <FilterDropdowns filters={filters} onChange={handleFilterChange} />

      {/* Rep Cohort Info */}
      <div className="rep-cohort-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Rep Cohort auto-set from your org hierarchy
      </div>

      {/* Run Analysis Button */}
      <div className="run-analysis-wrapper">
        <button
          id="btn-run-analysis"
          className={`btn-run-analysis ${isLoading ? 'loading' : ''}`}
          onClick={handleRunAnalysis}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          {isLoading ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      {/* Example Questions */}
      <ExampleQuestions onQuestionClick={handleExampleClick} />

      {/* Progress Overlay — only shown on THIS page while job is active & not completed */}
      {jobProgress && !jobProgress.completed && !jobProgress.failed && (
        <ProgressIndicator
          progress={jobProgress.pct}
          stage={jobProgress.stage}
          onCancel={cancelJob}
        />
      )}

      {/* Floating AI Button */}
      <button className="ai-fab" title="AI Assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    </div>
  );
}

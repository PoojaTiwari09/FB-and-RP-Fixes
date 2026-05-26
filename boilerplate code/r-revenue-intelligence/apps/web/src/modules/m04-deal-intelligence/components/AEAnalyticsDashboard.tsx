import React, { useEffect, useState } from 'react';
import { analyticsAPI, AEAnalytics } from '../api/analytics.api';
import { exportAPI } from '../api/export.api';

/**
 * Account Executive Analytics Dashboard Component
 * Displays personal deal analytics for AEs
 */
export const AEAnalyticsDashboard: React.FC<{ boardId?: string }> = ({ boardId }) => {
  const [analytics, setAnalytics] = useState<AEAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [boardId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getAEAnalytics(boardId);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (boardId) {
        await exportAPI.exportBoardToCSV(boardId);
      }
    } catch (err) {
      alert('Failed to export: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="analytics-empty">No analytics data available</div>;
  }

  return (
    <div className="ae-analytics-dashboard">
      <div className="analytics-header">
        <h2>My Deals Analytics</h2>
        <button onClick={handleExport} className="export-button">
          Export to CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="card-label">Total Pipeline</div>
          <div className="card-value">${(analytics.totalPipelineValue / 1000000).toFixed(2)}M</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Total Deals</div>
          <div className="card-value">{analytics.totalDealCount}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Avg AI Score</div>
          <div className="card-value">{analytics.averageAiScore.toFixed(1)}</div>
        </div>
        <div className="summary-card alert">
          <div className="card-label">At Risk</div>
          <div className="card-value">{analytics.atRiskDealCount}</div>
        </div>
      </div>

      {/* Tab Rollups */}
      <div className="tab-rollups">
        <h3>Pipeline by Stage</h3>
        <div className="rollup-grid">
          {analytics.tabRollups.map((rollup) => (
            <div key={rollup.tabName} className="rollup-card">
              <div className="rollup-name">{rollup.tabName}</div>
              <div className="rollup-value">${(rollup.totalValue / 1000).toFixed(0)}K</div>
              <div className="rollup-count">{rollup.dealCount} deals</div>
              <div className="rollup-avg">Avg: ${(rollup.averageDealSize / 1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary">
        <h3>This Week's Activity</h3>
        <div className="activity-stats">
          <div className="activity-stat">
            <span className="stat-icon">📞</span>
            <span className="stat-value">{analytics.activitySummary.callsThisWeek}</span>
            <span className="stat-label">Calls</span>
          </div>
          <div className="activity-stat">
            <span className="stat-icon">📧</span>
            <span className="stat-value">{analytics.activitySummary.emailsThisWeek}</span>
            <span className="stat-label">Emails</span>
          </div>
          <div className="activity-stat">
            <span className="stat-icon">🤝</span>
            <span className="stat-value">{analytics.activitySummary.meetingsThisWeek}</span>
            <span className="stat-label">Meetings</span>
          </div>
        </div>
      </div>

      {/* Next Steps Summary */}
      <div className="next-steps-summary">
        <h3>Next Steps</h3>
        <div className="next-steps-stats">
          <div className="next-step-stat">
            <div className="stat-value">{analytics.nextStepsSummary.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="next-step-stat success">
            <div className="stat-value">{analytics.nextStepsSummary.completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="next-step-stat warning">
            <div className="stat-value">{analytics.nextStepsSummary.overdueTasks}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* Top Warnings */}
      {analytics.topWarnings.length > 0 && (
        <div className="top-warnings">
          <h3>⚠️ Top Warnings</h3>
          <ul className="warnings-list">
            {analytics.topWarnings.map((warning, index) => (
              <li key={index} className="warning-item">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AEAnalyticsDashboard;

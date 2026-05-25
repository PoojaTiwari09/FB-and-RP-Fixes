import React, { useEffect, useState } from 'react';
import { analyticsAPI, ExecutiveAnalytics } from '../api/analytics.api';
import { exportAPI } from '../api/export.api';

/**
 * Executive Analytics Dashboard Component
 * Displays forecast and high-level metrics for CRO/VP Sales
 */
export const ExecutiveAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ExecutiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('PDF');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getExecutiveAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportForecast = async () => {
    try {
      await exportAPI.exportForecastSummary(exportFormat);
    } catch (err) {
      alert('Failed to export: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExportRiskDeals = async () => {
    try {
      await exportAPI.exportTopRiskDeals('CSV');
    } catch (err) {
      alert('Failed to export: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading executive analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="analytics-empty">No analytics data available</div>;
  }

  const { forecastMetrics, tabRollups, topRiskDeals, summaryMetrics } = analytics;
  const gapColor = forecastMetrics.gapToTarget >= 0 ? 'success' : 'danger';
  const riskColor = forecastMetrics.percentageAtRisk > 30 ? 'danger' : 
                    forecastMetrics.percentageAtRisk > 15 ? 'warning' : 'success';

  return (
    <div className="executive-analytics-dashboard">
      <div className="analytics-header">
        <h2>Executive Forecast Dashboard</h2>
        <div className="export-controls">
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value as 'CSV' | 'PDF')}
            className="format-selector"
          >
            <option value="CSV">CSV</option>
            <option value="PDF">PDF</option>
          </select>
          <button onClick={handleExportForecast} className="export-button">
            Export Forecast ({exportFormat})
          </button>
        </div>
      </div>

      {/* Forecast Metrics */}
      <div className="forecast-metrics">
        <h3>Forecast vs Target</h3>
        <div className="forecast-grid">
          <div className="forecast-card">
            <div className="card-label">Total Commit</div>
            <div className="card-value">${(forecastMetrics.totalCommit / 1000000).toFixed(2)}M</div>
          </div>
          <div className="forecast-card">
            <div className="card-label">Target</div>
            <div className="card-value">${(forecastMetrics.targetValue / 1000000).toFixed(2)}M</div>
          </div>
          <div className={`forecast-card ${gapColor}`}>
            <div className="card-label">Gap to Target</div>
            <div className="card-value">
              ${Math.abs(forecastMetrics.gapToTarget / 1000000).toFixed(2)}M
              <span className="percentage">({forecastMetrics.gapPercentage.toFixed(1)}%)</span>
            </div>
          </div>
          <div className={`forecast-card ${riskColor}`}>
            <div className="card-label">% At Risk</div>
            <div className="card-value">{forecastMetrics.percentageAtRisk.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Deal Count by Category */}
      <div className="category-breakdown">
        <h3>Deal Count by Category</h3>
        <div className="category-grid">
          <div className="category-card">
            <div className="category-name">Commit</div>
            <div className="category-count">{forecastMetrics.dealCountByCategory.commit}</div>
          </div>
          <div className="category-card">
            <div className="category-name">Best Case</div>
            <div className="category-count">{forecastMetrics.dealCountByCategory.bestCase}</div>
          </div>
          <div className="category-card">
            <div className="category-name">Pipeline</div>
            <div className="category-count">{forecastMetrics.dealCountByCategory.pipeline}</div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="summary-metrics">
        <h3>Summary Metrics</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="card-label">Total Deals</div>
            <div className="card-value">{summaryMetrics.totalDeals}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Avg AI Score</div>
            <div className="card-value">{summaryMetrics.averageAiScore.toFixed(1)}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Avg Deal Size</div>
            <div className="card-value">${(summaryMetrics.averageDealSize / 1000).toFixed(0)}K</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Win Rate</div>
            <div className="card-value">{summaryMetrics.winRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Top Risk Deals */}
      <div className="top-risk-deals">
        <div className="section-header">
          <h3>🚨 Top Risk Deals</h3>
          <button onClick={handleExportRiskDeals} className="export-link">
            Export All Risk Deals
          </button>
        </div>
        <div className="risk-deals-table">
          <table>
            <thead>
              <tr>
                <th>Deal Name</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>Risk Level</th>
                <th>Primary Risk</th>
              </tr>
            </thead>
            <tbody>
              {topRiskDeals.map((deal) => (
                <tr key={deal.dealId} className={`risk-${deal.riskLevel.toLowerCase()}`}>
                  <td className="deal-name">{deal.dealName}</td>
                  <td>{deal.ownerName}</td>
                  <td className="amount">${(deal.amount / 1000).toFixed(0)}K</td>
                  <td>
                    <span className={`risk-badge ${deal.riskLevel.toLowerCase()}`}>
                      {deal.riskLevel}
                    </span>
                  </td>
                  <td className="risk-reason">{deal.primaryRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tab Rollups */}
      <div className="tab-rollups">
        <h3>Pipeline Breakdown</h3>
        <div className="rollup-grid">
          {tabRollups.map((rollup) => (
            <div key={rollup.tabName} className="rollup-card">
              <div className="rollup-name">{rollup.tabName}</div>
              <div className="rollup-value">${(rollup.totalValue / 1000000).toFixed(2)}M</div>
              <div className="rollup-count">{rollup.dealCount} deals</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAnalyticsDashboard;

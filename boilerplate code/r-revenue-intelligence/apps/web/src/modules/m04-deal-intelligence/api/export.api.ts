/**
 * Export API Client
 * Provides methods to interact with export endpoints
 */

export type ExportFormat = 'CSV' | 'EXCEL' | 'PDF';

export type ExportType = 
  | 'DEALS'
  | 'BOARD'
  | 'ACTIVITIES'
  | 'TASKS'
  | 'PLAYBOOK'
  | 'TEAM_DIAGNOSTICS'
  | 'COACHING_ACTIVITY'
  | 'FORECAST_SUMMARY'
  | 'TOP_RISK_DEALS'
  | 'ANALYTICS_REPORT';

export interface ExportRequest {
  format: ExportFormat;
  type: ExportType;
  boardId?: string;
  dealId?: string;
  columns?: string[];
  startDate?: string;
  endDate?: string;
  stages?: string[];
  ownerIds?: string[];
  includeAiInsights?: boolean;
  includeHistoricalTrends?: boolean;
  activeTab?: string;
  template?: string;
}

export interface ExportResponse {
  id: string;
  format: ExportFormat;
  type: ExportType;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  recordCount: number;
  createdAt: string;
  expiresAt: string;
}

export class ExportAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create an export
   */
  async createExport(request: ExportRequest): Promise<ExportResponse> {
    const response = await fetch(`${this.baseUrl}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create export: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download an export file
   */
  downloadExport(exportId: string): void {
    window.location.href = `${this.baseUrl}/exports/download/${exportId}`;
  }

  /**
   * Create and download export in one step
   */
  async createAndDownload(request: ExportRequest): Promise<void> {
    const exportResponse = await this.createExport(request);
    this.downloadExport(exportResponse.id);
  }

  // ============= Convenience Methods =============

  /**
   * Export board to CSV
   */
  async exportBoardToCSV(boardId: string, activeTab?: string): Promise<void> {
    await this.createAndDownload({
      format: 'CSV',
      type: 'BOARD',
      boardId,
      activeTab,
    });
  }

  /**
   * Export board to PDF (Executive)
   */
  async exportBoardToPDF(boardId: string, activeTab?: string): Promise<void> {
    await this.createAndDownload({
      format: 'PDF',
      type: 'BOARD',
      boardId,
      activeTab,
    });
  }

  /**
   * Export forecast summary (Executive)
   */
  async exportForecastSummary(format: ExportFormat = 'PDF'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'FORECAST_SUMMARY',
    });
  }

  /**
   * Export team diagnostics (Manager)
   */
  async exportTeamDiagnostics(format: ExportFormat = 'CSV'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'TEAM_DIAGNOSTICS',
    });
  }

  /**
   * Export top risk deals (Executive)
   */
  async exportTopRiskDeals(format: ExportFormat = 'CSV'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'TOP_RISK_DEALS',
    });
  }

  /**
   * Export deal activities (AE)
   */
  async exportDealActivities(dealId: string, format: ExportFormat = 'CSV'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'ACTIVITIES',
      dealId,
    });
  }

  /**
   * Export playbook (AE)
   */
  async exportPlaybook(dealId: string, format: ExportFormat = 'CSV'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'PLAYBOOK',
      dealId,
    });
  }

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(format: ExportFormat = 'PDF'): Promise<void> {
    await this.createAndDownload({
      format,
      type: 'ANALYTICS_REPORT',
      includeAiInsights: true,
      includeHistoricalTrends: true,
    });
  }
}

// Export singleton instance
export const exportAPI = new ExportAPI();

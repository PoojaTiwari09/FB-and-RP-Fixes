import { Injectable } from '@nestjs/common';
import { m03DataStore } from './m03-data.store';

@Injectable()
export class ReportService {
  async getReport(reportId: string, orgId: string) {
    const report = m03DataStore.getReport(reportId, orgId);
    if (!report) return null;
    const citations = m03DataStore.getCitations(reportId);
    const feedback = m03DataStore.feedback.filter((f) => f.report_id === reportId);
    const thumbsUp = feedback.filter((f) => f.feedback_type === 'THUMBS_UP').length;
    const thumbsDown = feedback.filter((f) => f.feedback_type === 'THUMBS_DOWN').length;
    const flags = feedback.filter((f) => f.feedback_type === 'FLAG_INACCURACY').length;
    return {
      ...report,
      citations,
      feedback_summary: { thumbsUp, thumbsDown, flags },
    };
  }

  async getReportHistory(reportId: string, orgId: string) {
    const report = m03DataStore.getReport(reportId, orgId);
    if (!report) return { versions: [] };
    const versions = [...m03DataStore.reports.values()]
      .filter((v) => v.org_id === orgId && v.query === report.query)
      .sort((a, b) => (b.version || 0) - (a.version || 0));
    return {
      versions: versions.map((v) => ({
        reportId: v.id,
        version: v.version,
        createdAt: v.created_at,
        status: v.status,
        modelUsed: v.model_used,
        metadata: v.metadata,
      })),
    };
  }
}

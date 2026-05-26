/**
 * Report Service
 * Core Feature 28: Report Persistence & Versioning
 *
 * TC-DR-27: Save and retrieve reports.
 * TC-DR-28: Report versioning with parent linking.
 */
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';

@Injectable()
export class ReportService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get a report by ID with org isolation.
   * TC-DR-27: Full report retrieval with citations.
   * TC-DR-31: Org isolation enforced.
   */
  async getReport(reportId: string, orgId: string) {
    const client = this.supabase.getClient();
    if (!client) return null;

    try {
      // Fetch report
      const { data: report, error } = await client
        .from('research_reports')
        .select('*')
        .eq('id', reportId)
        .eq('org_id', orgId) // org isolation
        .single();

      if (error || !report) return null;

      // Fetch citations
      const { data: citations } = await client
        .from('citations')
        .select('*')
        .eq('report_id', reportId);

      // Fetch feedback counts
      const { data: feedback } = await client
        .from('feedback')
        .select('feedback_type')
        .eq('report_id', reportId);

      const thumbsUp = (feedback || []).filter(f => f.feedback_type === 'THUMBS_UP').length;
      const thumbsDown = (feedback || []).filter(f => f.feedback_type === 'THUMBS_DOWN').length;
      const flags = (feedback || []).filter(f => f.feedback_type === 'FLAG_INACCURACY').length;

      return {
        ...report,
        citations: citations || [],
        feedback_summary: { thumbsUp, thumbsDown, flags },
      };
    } catch (err) {
      console.error('Get report error:', err);
      return null;
    }
  }

  /**
   * Get report version history.
   * TC-DR-28: Shows all versions of a report (by query match).
   */
  async getReportHistory(reportId: string, orgId: string) {
    const client = this.supabase.getClient();
    if (!client) return { versions: [] };

    try {
      // Get the report's query to find related versions
      const { data: report } = await client
        .from('research_reports')
        .select('query, job_id')
        .eq('id', reportId)
        .eq('org_id', orgId)
        .single();

      if (!report) return { versions: [] };

      // Find all versions with same query
      const { data: versions } = await client
        .from('research_reports')
        .select('id, version, created_at, status, query, model_used, metadata')
        .eq('org_id', orgId)
        .eq('query', report.query)
        .order('version', { ascending: false });

      return {
        versions: (versions || []).map(v => ({
          reportId: v.id,
          version: v.version,
          createdAt: v.created_at,
          status: v.status,
          modelUsed: v.model_used,
          metadata: v.metadata,
        })),
      };
    } catch (err) {
      return { versions: [] };
    }
  }
}

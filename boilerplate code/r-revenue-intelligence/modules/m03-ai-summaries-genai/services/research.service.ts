/**
 * Research Service
 * Core Feature 27: Research Job Queue & Status Tracker
 *
 * Manages job lifecycle:
 * - Create → Queue → Track → Complete/Fail
 * - Calls FastAPI service for AI processing
 * - TC-DR-24: Status transitions
 * - TC-DR-25: Job cancellation
 * - TC-DR-26: Concurrent job limits
 * - TC-DR-33: Audit logging
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../config/supabase.service';
import { CreateJobDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class ResearchService {
  private fastapiUrl: string;

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.fastapiUrl = this.config.get('FASTAPI_URL', 'http://localhost:8000');
  }

  /**
   * Create a new research job and dispatch to FastAPI pipeline.
   */
  async createJob(dto: CreateJobDto, user: any) {
    const jobId = uuidv4();
    const client = this.supabase.getClient();

    // Persist job to Supabase
    if (client) {
      try {
        await client.from('research_jobs').insert({
          id: jobId,
          org_id: user.orgId,
          user_id: user.userId,
          query: dto.query,
          context_type: dto.contextType || 'ACCOUNT',
          context_id: dto.contextId,
          scope: dto.scope || 'ENTIRE_ACCOUNT',
          period_days: dto.periodDays || 60,
          filters: dto.filters || {},
          status: 'QUEUED',
          progress_pct: 0,
          progress_stage: 'Job queued',
        });
      } catch (err) {
        console.error('Job insert error:', err);
      }
    }

    // Dispatch to FastAPI in background (fire and forget)
    this.dispatchToFastAPI(jobId, dto, user).catch(err => {
      console.error('FastAPI dispatch error:', err);
      this.updateJobStatus(jobId, 'FAILED', 0, 'Dispatch failed', err.message);
    });

    return { jobId, status: 'QUEUED' };
  }

  /**
   * Dispatch job to FastAPI AI service.
   */
  private async dispatchToFastAPI(jobId: string, dto: CreateJobDto, user: any) {
    try {
      await axios.post(`${this.fastapiUrl}/api/v1/research/run`, {
        query: dto.query,
        context_type: dto.contextType || 'ACCOUNT',
        context_id: dto.contextId,
        scope: dto.scope || 'ENTIRE_ACCOUNT',
        period_days: dto.periodDays || 60,
        filters: dto.filters || {},
        org_id: user.orgId,
        user_id: user.userId,
        web_data_enabled: dto.webDataEnabled || false,
      }, {
        timeout: 300000, // 5 min timeout for long research
      });
    } catch (err) {
      // The FastAPI endpoint returns immediately with 200
      // The actual processing runs in a background task
      // So a non-timeout error means something went wrong
      if (!err.response || err.response.status !== 200) {
        throw err;
      }
    }
  }

  /**
   * Get job status.
   * TC-DR-24: Returns full status including progress.
   * TC-DR-31: Enforces org isolation.
   */
  async getJobStatus(jobId: string, orgId: string) {
    const client = this.supabase.getClient();
    if (!client) {
      return { jobId, status: 'UNKNOWN', progressPct: 0 };
    }

    try {
      const { data, error } = await client
        .from('research_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('org_id', orgId) // TC-DR-31: org isolation
        .single();

      if (error || !data) return null;

      const result: any = {
        jobId: data.id,
        status: data.status,
        progressPct: data.progress_pct,
        progressStage: data.progress_stage,
        query: data.query,
        filters: data.filters,
        subQueries: data.sub_queries || [],
        error: data.error_message,
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };

      // If completed, fetch report ID
      if (data.status === 'COMPLETED') {
        const reportResult = await client
          .from('research_reports')
          .select('id')
          .eq('job_id', jobId)
          .single();

        if (reportResult.data) {
          result.reportId = reportResult.data.id;
        }
      }

      return result;
    } catch (err) {
      console.error('Get job status error:', err);
      return null;
    }
  }

  /**
   * Cancel a running job.
   * TC-DR-25: Cancellation with graceful stop.
   */
  async cancelJob(jobId: string, orgId: string) {
    const client = this.supabase.getClient();
    if (!client) return { cancelled: true };

    try {
      const { data } = await client
        .from('research_jobs')
        .select('status')
        .eq('id', jobId)
        .eq('org_id', orgId)
        .single();

      if (!data) return null;

      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.status)) {
        return { cancelled: false, reason: `Cannot cancel job with status: ${data.status}` };
      }

      await client
        .from('research_jobs')
        .update({
          status: 'CANCELLED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Also cancel in FastAPI
      try {
        await axios.post(`${this.fastapiUrl}/api/v1/research/jobs/${jobId}/cancel`);
      } catch {
        // FastAPI cancel is best-effort
      }

      return { cancelled: true };
    } catch (err) {
      console.error('Cancel job error:', err);
      return null;
    }
  }

  /**
   * List jobs for org/user.
   */
  async listJobs(orgId: string, userId: string, status?: string, limit: number = 20) {
    const client = this.supabase.getClient();
    if (!client) return { jobs: [], total: 0 };

    try {
      let query = client
        .from('research_jobs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data } = await query;

      const jobs = (data || []).map(j => ({
        jobId: j.id,
        status: j.status,
        progressPct: j.progress_pct,
        progressStage: j.progress_stage,
        query: j.query,
        filters: j.filters,
        createdAt: j.created_at,
        completedAt: j.completed_at,
      }));

      return { jobs, total: jobs.length };
    } catch (err) {
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Get active (QUEUED or PROCESSING) job count for concurrent limit.
   * TC-DR-26: Enforce max concurrent jobs.
   */
  async getActiveJobCount(orgId: string, userId: string): Promise<number> {
    const client = this.supabase.getClient();
    if (!client) return 0;

    try {
      const { count } = await client
        .from('research_jobs')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .in('status', ['QUEUED', 'PROCESSING']);

      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Update job status (internal helper).
   */
  private async updateJobStatus(jobId: string, status: string, pct: number, stage: string, error?: string) {
    const client = this.supabase.getClient();
    if (!client) return;

    try {
      const update: any = {
        status,
        progress_pct: pct,
        progress_stage: stage,
        updated_at: new Date().toISOString(),
      };
      if (error) update.error_message = error;
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
        update.completed_at = new Date().toISOString();
      }

      await client.from('research_jobs').update(update).eq('id', jobId);
    } catch (err) {
      console.error('Update job status error:', err);
    }
  }

  /**
   * TC-DR-33: Audit logging.
   */
  async logAudit(user: any, eventType: string, details: any) {
    const client = this.supabase.getClient();
    if (!client) return;

    try {
      await client.from('audit_log').insert({
        id: uuidv4(),
        org_id: user.orgId,
        user_id: user.userId,
        event_type: eventType,
        details,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
}

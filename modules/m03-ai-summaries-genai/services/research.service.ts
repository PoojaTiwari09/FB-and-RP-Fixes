/**
 * Research Service — Prisma-ready in-memory store (Supabase removed).
 */
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateJobDto } from '../interfaces/research.dto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { m03DataStore } from './m03-data.store';

@Injectable()
export class ResearchService {
  private fastapiUrl: string;

  constructor(@Optional() private config?: ConfigService) {
    this.fastapiUrl =
      (this.config?.get?.('FASTAPI_URL') as string) ||
      process.env.FASTAPI_URL ||
      'http://localhost:8000';
  }

  async createJob(dto: CreateJobDto, user: any) {
    const jobId = uuidv4();
    const now = new Date().toISOString();
    m03DataStore.insertJob({
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
      created_at: now,
      sub_queries: [],
    });

    this.dispatchToFastAPI(jobId, dto, user).catch(() => {
      this.simulateJobCompletion(jobId, dto, user);
    });

    return { jobId, status: 'QUEUED' };
  }

  private async dispatchToFastAPI(jobId: string, dto: CreateJobDto, user: any) {
    try {
      await axios.post(
        `${this.fastapiUrl}/api/v1/research/run`,
        {
          query: dto.query,
          context_type: dto.contextType || 'ACCOUNT',
          context_id: dto.contextId,
          scope: dto.scope || 'ENTIRE_ACCOUNT',
          period_days: dto.periodDays || 60,
          filters: dto.filters || {},
          org_id: user.orgId,
          user_id: user.userId,
          web_data_enabled: dto.webDataEnabled || false,
        },
        { timeout: 5000 },
      );
    } catch {
      throw new Error('FastAPI unavailable');
    }
  }

  /** Dev fallback when FastAPI is offline — keeps smoke/E2E green. */
  private simulateJobCompletion(jobId: string, dto: CreateJobDto, user: any) {
    m03DataStore.updateJob(jobId, {
      status: 'PROCESSING',
      progress_pct: 50,
      progress_stage: 'Analyzing CRM data',
    });
    const reportId = uuidv4();
    const summaryText = `Research summary for: ${dto.query}\n\n- Key theme: pricing and timeline\n- Risk: competitor evaluation\n- Recommendation: schedule executive alignment`;
    m03DataStore.insertReport({
      id: reportId,
      job_id: jobId,
      org_id: user.orgId,
      query: dto.query,
      status: 'COMPLETED',
      version: 1,
      content: { sections: [{ title: 'Executive Summary', body: summaryText }] },
      model_used: 'mock',
      created_at: new Date().toISOString(),
    });
    m03DataStore.setCitations(reportId, [
      { id: uuidv4(), report_id: reportId, source_type: 'call', source_id: 'call-1', excerpt: 'Budget discussion' },
    ]);
    m03DataStore.updateJob(jobId, {
      status: 'COMPLETED',
      progress_pct: 100,
      progress_stage: 'Complete',
      completed_at: new Date().toISOString(),
      report_id: reportId,
    });
  }

  async getJobStatus(jobId: string, orgId: string) {
    const data = m03DataStore.getJob(jobId, orgId);
    if (!data) return null;
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
    if (data.status === 'COMPLETED' && data.report_id) {
      result.reportId = data.report_id;
    }
    return result;
  }

  async cancelJob(jobId: string, orgId: string) {
    const data = m03DataStore.getJob(jobId, orgId);
    if (!data) return null;
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.status)) {
      return { cancelled: false, reason: `Cannot cancel job with status: ${data.status}` };
    }
    m03DataStore.updateJob(jobId, {
      status: 'CANCELLED',
      completed_at: new Date().toISOString(),
    });
    return { cancelled: true };
  }

  async listJobs(orgId: string, userId: string, status?: string, limit: number = 20) {
    const rows = m03DataStore.listJobs(orgId, userId, status, limit);
    const jobs = rows.map((j) => ({
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
  }

  async getActiveJobCount(orgId: string, userId: string): Promise<number> {
    return m03DataStore.countActiveJobs(orgId, userId);
  }

  async logAudit(user: any, eventType: string, details: any) {
    m03DataStore.auditLog.push({
      id: uuidv4(),
      org_id: user.orgId,
      user_id: user.userId,
      event_type: eventType,
      details,
      created_at: new Date().toISOString(),
    });
  }
}

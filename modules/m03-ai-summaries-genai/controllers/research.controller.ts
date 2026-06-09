/**
 * Research Controller
 * Core Feature 27: Research Job Queue & Status Tracker
 *
 * Handles all research-related HTTP endpoints:
 * - Create job, get status, cancel, list jobs
 * - Get report, report history
 * - TC-DR-24: Job status transitions
 * - TC-DR-25: Job cancellation
 * - TC-DR-26: Concurrent job limits
 */
import {
  Controller, Post, Get, Body, Param, Query, UseGuards,
  Req, HttpCode, HttpStatus, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ResearchService } from '../services/research.service';
import { ReportService } from '../services/report.service';
import { CreateJobDto } from '../interfaces/research.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { FeaturePermissionGuard } from '../guards/feature-permission.guard';

@Controller('api/v1/ai-summaries-genai/research')
@UseGuards(AuthGuard)
export class ResearchController {

  constructor(
    private readonly researchService: ResearchService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * POST /api/v1/research/jobs — Create a new research job
   * TC-DR-24: Status transitions QUEUED → PROCESSING → COMPLETED
   * TC-DR-26: Enforces concurrent job limit
   * TC-DR-32: RBAC check (SALES_MANAGER+)
   */
  @Post('jobs')
  @UseGuards(RbacGuard, FeaturePermissionGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async createJob(@Body() dto: CreateJobDto, @Req() req) {
    const user = req.user;

    // TC-DR-26: Check concurrent job limit (max 3 active per user)
    const activeJobs = await this.researchService.getActiveJobCount(user.orgId, user.userId);
    if (activeJobs >= 3) {
      throw new BadRequestException(
        'Maximum concurrent research jobs reached (3). Please wait for existing jobs to complete.'
      );
    }

    // TC-DR-33: Audit log
    await this.researchService.logAudit(user, 'research.job.created', {
      query: dto.query,
      filters: dto.filters,
    });

    const job = await this.researchService.createJob(dto, user);
    return {
      jobId: job.jobId,
      status: 'QUEUED',
      estimatedDurationSeconds: 120,
      message: 'Research job created and queued for processing.',
    };
  }

  /**
   * GET /api/v1/research/jobs/:jobId — Get job status
   * TC-DR-24: Returns current status and progress
   */
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string, @Req() req) {
    const status = await this.researchService.getJobStatus(jobId, req.user.orgId);
    if (!status) {
      throw new NotFoundException('Research job not found');
    }
    return status;
  }

  /**
   * POST /api/v1/research/jobs/:jobId/cancel — Cancel a running job
   * TC-DR-25: Cancellation support
   */
  @Post('jobs/:jobId/cancel')
  @UseGuards(RbacGuard)
  async cancelJob(@Param('jobId') jobId: string, @Req() req) {
    const result = await this.researchService.cancelJob(jobId, req.user.orgId);
    if (!result) {
      throw new NotFoundException('Research job not found');
    }

    await this.researchService.logAudit(req.user, 'research.job.cancelled', { jobId });
    return { status: 'cancelled', jobId };
  }

  /**
   * GET /api/v1/research/jobs — List jobs for user/org
   */
  @Get('jobs')
  async listJobs(
    @Req() req,
    @Query('status') status?: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.researchService.listJobs(req.user.orgId, req.user.userId, status, limit);
  }

  /**
   * GET /api/v1/research/reports/:reportId — Get full report
   * TC-DR-27: Report retrieval
   * TC-DR-31: Org isolation check
   */
  @Get('reports/:reportId')
  async getReport(@Param('reportId') reportId: string, @Req() req) {
    const report = await this.reportService.getReport(reportId, req.user.orgId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  /**
   * GET /api/v1/research/reports/:reportId/history — Version history
   * TC-DR-28: Versioning support
   */
  @Get('reports/:reportId/history')
  async getReportHistory(@Param('reportId') reportId: string, @Req() req) {
    return this.reportService.getReportHistory(reportId, req.user.orgId);
  }
}

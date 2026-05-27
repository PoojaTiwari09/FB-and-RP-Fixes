import { Controller, Get, Post, SetMetadata } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ResearchService } from '../services/research.service';
import { BriefService } from '../services/brief.service';
import { QueryService } from '../services/query.service';
import { M03_DEV_ORG, M03_DEV_USER } from '../services/m03-data.store';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('api/v1/ai-summaries-genai/test')
export class M03TestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly research: ResearchService,
    private readonly briefs: BriefService,
    private readonly query: QueryService,
  ) {}

  @Public()
  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      /* DB optional in dev */
    }
    return {
      success: true,
      database: 'up',
      aiMode: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('smoke')
  async smoke() {
    const user = { orgId: M03_DEV_ORG, userId: M03_DEV_USER };
    const job = await this.research.createJob(
      { query: 'What are the top risks in Acme deal?', contextType: 'ACCOUNT' } as any,
      user,
    );
    await new Promise((r) => setTimeout(r, 800));
    const status = await this.research.getJobStatus(job.jobId, user.orgId);
    const brief = await this.briefs.generateBrief(user.orgId, 'deal', 'deal-1');
    const query = await this.query.processQuery({
      query: 'Summarize recent calls',
      contextType: 'ACCOUNT',
      orgId: user.orgId,
      userId: user.userId,
    });

    return {
      success: true,
      jobId: job.jobId,
      jobStatus: status?.status,
      reportId: status?.reportId,
      briefGenerated: Boolean(brief?.success),
      queryAnswerLength: (query?.answer || '').length,
    };
  }
}

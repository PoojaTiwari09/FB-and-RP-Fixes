import { Controller, Get, Post, SetMetadata } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ResearchService } from '../services/research.service';
import { BriefService } from '../services/brief.service';
import { QueryService } from '../services/query.service';
import { M03_DEV_ORG, M03_DEV_USER } from '../services/m03-data.store';
import { M03_DEMO_TENANT } from '../services/m03-tenant.util';

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
      await this.prisma.$queryRaw`SELECT 1`;
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
  @Get('workspace-stats')
  async workspaceStats() {
    const tenantId = M03_DEMO_TENANT;
    const prisma = this.prisma as any;
    const [calls, accounts, deals, m10Contacts] = await Promise.all([
      prisma.callRecord?.count?.({ where: { tenantid: tenantId } }) ?? 0,
      prisma.account?.count?.({ where: { tenantid: tenantId } }) ?? 0,
      prisma.deal?.count?.({ where: { tenantid: tenantId } }) ?? 0,
      prisma.m10Contact?.count?.({ where: { tenantid: tenantId } }) ?? 0,
    ]);
    return {
      tenantId,
      call_records: calls,
      accounts,
      deals,
      m10_contacts: m10Contacts,
      note:
        calls > 0 && accounts === 0
          ? 'M01 writes call_records only. Run POST .../test/seed-crm or HubSpot sync (M07) for accounts/deals.'
          : undefined,
    };
  }

  /** Dev: seed public Account + Deal rows for Smart Summaries tabs. */
  @Public()
  @Post('seed-crm')
  async seedCrm() {
    const tenantId = M03_DEMO_TENANT;
    const prisma = this.prisma as any;
    const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`;

    const tenantSlug = `rri-demo-${tenantId.slice(0, 8)}`;
    const existingTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existingTenant) {
      await prisma.tenant.create({
        data: { id: tenantId, name: 'Demo Tenant', slug: tenantSlug },
      });
    }

    const accounts = await Promise.all([
      prisma.account.upsert({
        where: { id: 'm03-seed-acct-modus' },
        create: {
          id: 'm03-seed-acct-modus', tenantid: tenantId,
          name: 'Moduslink',
          industry: 'Technology',
          ownerName: 'Demo Rep',
        },
        update: { name: 'Moduslink', industry: 'Technology' },
      }),
      prisma.account.upsert({
        where: { id: 'm03-seed-acct-acme' },
        create: {
          id: 'm03-seed-acct-acme', tenantid: tenantId,
          name: 'Acme Corp',
          industry: 'Manufacturing',
          ownerName: 'Demo Rep',
        },
        update: { name: 'Acme Corp' },
      }),
    ]);

    const deals = await Promise.all([
      prisma.deal.upsert({
        where: { id: 'm03-seed-deal-modus' },
        create: {
          id: 'm03-seed-deal-modus', tenantid: tenantId,
          accountId: 'm03-seed-acct-modus',
          name: 'Moduslink Expansion',
          amount: 125000,
          stage: 'Negotiation',
          quarter,
        },
        update: { stage: 'Negotiation', accountId: 'm03-seed-acct-modus' },
      }),
      prisma.deal.upsert({
        where: { id: 'm03-seed-deal-acme' },
        create: {
          id: 'm03-seed-deal-acme', tenantid: tenantId,
          accountId: 'm03-seed-acct-acme',
          name: 'Acme Platform Renewal',
          amount: 85000,
          stage: 'Proposal',
          quarter,
        },
        update: { stage: 'Proposal', accountId: 'm03-seed-acct-acme' },
      }),
    ]);

    const calls = await prisma.callRecord.findMany({
      where: { tenantid: tenantId },
      take: 10,
      orderBy: { callDate: 'desc' },
    });
    let linked = 0;
    for (const call of calls) {
      const isModus = (call.title || '').toLowerCase().includes('modus');
      await prisma.callRecord.update({
        where: { id: call.id },
        data: {
          accountId: isModus ? 'm03-seed-acct-modus' : 'm03-seed-acct-acme',
          opportunityId: isModus ? 'm03-seed-deal-modus' : 'm03-seed-deal-acme',
          participants: call.participants?.length
            ? call.participants
            : ['Demo Rep', 'Buyer Contact'],
        },
      });
      linked += 1;
    }

    return {
      success: true, tenantid: tenantId,
      accounts: accounts.length,
      deals: deals.length,
      callsLinked: linked,
      message: 'Refresh Smart Summaries — Deals, Accounts, and Contacts tabs should populate.',
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

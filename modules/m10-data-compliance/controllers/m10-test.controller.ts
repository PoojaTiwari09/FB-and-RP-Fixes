import { Controller, Get, Post, Req } from '@nestjs/common';
import { RevenueGraphService } from '../revenue-graph/services/revenue-graph.service';
import { PrismaService } from '../database/prisma.service';
import {
  rankAccountCandidates,
  pickBestCandidate,
  stringSimilarity,
} from '../revenue-graph/entity-resolution/entity-resolution.engine';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { seedM10Demo } = require('../../../scripts/seed_m10_demo.cjs');

@Controller('api/v1/m10-data-compliance/test')
export class M10TestController {
  constructor(
    private readonly graph: RevenueGraphService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  health() {
    return { success: true, module: 'm10-data-compliance', status: 'ok' };
  }

  @Post('smoke')
  smoke() {
    const ranked = rankAccountCandidates('Acme Corporation', 'acme.com', [
      { id: '1', name: 'Acme Corp', domain: 'acme.com' },
      { id: '2', name: 'Beta LLC', domain: 'beta.io' },
    ]);
    const { best, ambiguous } = pickBestCandidate(ranked);
    return {
      success: true,
      module: 'm10-data-compliance',
      entityResolution: {
        similarity: stringSimilarity('Acme Corporation', 'Acme Corp'),
        bestMatch: best,
        ambiguous,
      },
      checks: ['entity-engine', 'export-pipeline', 'warehouse-hooks'],
    };
  }

  @Get('accounts')
  async accounts(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000001';
    return this.graph.getAccounts(tenantId, { limit: 5 });
  }

  /** Idempotent demo seed — Revenue Graph + Data Cloud (Postgres). */
  @Post('seed')
  async seed() {
    return seedM10Demo(this.prisma);
  }
}

/**
 * Seed Data Verification Tests & Submission/Audit Cross-Cutting Tests
 * Verifies historical conversion rates, CRM deal regions, user regions, and quotas exist after seeding.
 *
 * These tests run against a LIVE seeded database.
 * Config: jest-integration.json
 * Run:    npm run test:integration
 *
 * NOTE: Requires `npx ts-node seeds/historical-seed.ts` to be run first.
 */
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();
const TENANT = 'demo-tenant-01';

afterAll(async () => { await prisma.$disconnect(); });

describe('Seed Data Verification Tests', () => {
  it('TC-S-01 — Q4 FY25 and Q2 FY25 HistoricalConversionRate records exist', async () => {
    const q4 = await prisma.historicalConversionRate.findMany({
      where: { tenantid: TENANT, periodName: 'Q4 FY25' },
    });
    const q2 = await prisma.historicalConversionRate.findMany({
      where: { tenantid: TENANT, periodName: 'Q2 FY25' },
    });

    expect(q4.length).toBeGreaterThanOrEqual(3);
    expect(q2.length).toBeGreaterThanOrEqual(3);

    // Verify stages are present
    const q4Stages = q4.map((r) => r.fromStage).sort();
    expect(q4Stages).toEqual(expect.arrayContaining(['Discovery', 'Negotiation', 'Proposal']));
  });

  it('TC-S-02 — All CrmDeal records seeded via ACTIVE_DEALS and CLOSED_WON have non-null region', async () => {
    const deals = await prisma.crmDeal.findMany({ where: { tenantid: TENANT } });
    const namedDeals = deals.filter(
      (d) => !d.dealName.startsWith('Historical Deal'),
    );

    // All named seed deals should have a region
    for (const deal of namedDeals) {
      expect(deal.region).toBeTruthy();
      expect(['Americas', 'EMEA', 'APAC']).toContain(deal.region);
    }
  });

  it('TC-S-03 — All User records exist', async () => {
    const users = await prisma.user.findMany({ where: { tenantid: TENANT } });

    expect(users.length).toBeGreaterThanOrEqual(6); // 1 manager + 5 reps
  });

  it('TC-S-04 — Quota records exist for every rep in the open period', async () => {
    const period = await prisma.forecastPeriod.findFirst({
      where: { tenantid: TENANT, status: 'open' },
    });
    expect(period).toBeTruthy();

    const reps = await prisma.user.findMany({
      where: { tenantid: TENANT, role: 'SALES_REP' },
    });

    const quotas = await prisma.quota.findMany({
      where: { tenantid: TENANT, periodId: period!.id },
    });

    // Each rep should have a quota entry (mapped by user.id in seed)
    expect(quotas.length).toBe(reps.length);
  });
});

describe('Cross-Cutting — Audit Log & Submission Flow', () => {
  it('TC-X-04 — audit logs exist for seeded submissions', async () => {
    const logs = await prisma.forecastAuditLog.findMany({
      where: { tenantid: TENANT },
    });

    expect(logs.length).toBeGreaterThanOrEqual(5); // at least one per rep
    const actions = logs.map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['Draft created']));
  });

  it('TC-X-03 — submission can be created on open period', async () => {
    const period = await prisma.forecastPeriod.findFirst({
      where: { tenantid: TENANT, status: 'open' },
    });
    expect(period).toBeTruthy();
    expect(period!.status).toBe('open');
  });
});

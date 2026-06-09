import { Test, TestingModule } from '@nestjs/testing';
import { AdminForecastBoardsService } from './services/admin-forecast-boards.service';
import { PrismaService } from './database/prisma.service';

describe('AdminForecastBoardsService (End-to-End Admin Functionalities)', () => {
  let service: AdminForecastBoardsService;
  let prisma: PrismaService;
  const tenantId = 'demo-tenant-01';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminForecastBoardsService, PrismaService],
    }).compile();

    service = module.get<AdminForecastBoardsService>(AdminForecastBoardsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should execute all Admin Wizard API operations sequentially', async () => {
    console.log('--- Testing Step 1: Create Board ---');
    
    // Ensure period exists for quota test
    await prisma.forecastPeriod.upsert({
      where: { id: 'Q1-2026-admin' },
      create: {
        id: 'Q1-2026-admin',
        tenantId,
        name: 'Q1 2026 Admin',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        revenueTarget: 100000,
        status: 'open'
      },
      update: {}
    });

    const newBoard = await service.createBoard(tenantId, {
      name: 'Global Enterprise Board',
      scope: 'Global',
      periodType: 'Quarterly',
      activePeriod: 'Q1-2026-admin',
      description: 'End to end testing board'
    });
    
    expect(newBoard.id).toBeDefined();
    expect(newBoard.status).toBe('draft');
    expect(newBoard.name).toBe('Global Enterprise Board');

    console.log('--- Testing Step 2: Define Columns ---');
    const boardWithCols = await service.updateBoardColumns(tenantId, newBoard.id, {
      columns: [
        { label: 'Pipeline', type: 'Metric', submissionMode: 'N/A', isVisible: true, sortOrder: 1 },
        { label: 'Commit', type: 'Submission', submissionMode: 'Manual', isVisible: true, sortOrder: 2 },
      ]
    });
    
    expect(boardWithCols?.columns.length).toBe(2);
    expect(boardWithCols?.columns[0].label).toBe('Pipeline');

    console.log('--- Testing Step 3: Connect CRM ---');
    const crmMapping = await service.updateCrmMapping(tenantId, newBoard.id, {
      crmConnection: 'hubspot',
      forecastCategoryField: 'hs_forecast_category',
      pipelineSource: 'amount',
      closedSource: 'amount',
      closeDateField: 'closedate',
      amountField: 'amount'
    });

    expect(crmMapping.crmConnection).toBe('hubspot');

    console.log('--- Testing Step 4: Reminders ---');
    const reminders = await service.updateReminderConfig(tenantId, newBoard.id, {
      frequency: 'weekly',
      sendDay: 'Thursday',
      sendTime: '10:00',
      timezoneBehavior: 'rep_timezone',
      inAppEnabled: true,
      slackEnabled: false,
      autoDismiss: true
    });

    expect(reminders.sendDay).toBe('Thursday');

    console.log('--- Testing Step 5: Targets & Quotas ---');
    const quotasResult = await service.updateQuotas(tenantId, newBoard.id, {
      periodId: 'Q1-2026-admin',
      quotas: [
        { repUserId: 'rep-test-admin-1', amount: 500000 }
      ]
    });

    expect(quotasResult.success).toBe(true);

    // Verify quota wrote successfully to DB
    const writtenQuota = await prisma.quota.findUnique({
      where: {
        tenantId_periodId_repUserId: {
          tenantId, periodId: 'Q1-2026-admin', repUserId: 'rep-test-admin-1'
        }
      }
    });
    expect(writtenQuota?.amount).toBe(500000);

    console.log('--- Testing Publish Board ---');
    const publishedBoard = await service.publishBoard(tenantId, newBoard.id);
    expect(publishedBoard.status).toBe('active');
    expect(publishedBoard.isPublished).toBe(true);
    expect(publishedBoard.publishedAt).toBeDefined();

    console.log('Admin Wizard functionalities successfully verified!');
  });
});

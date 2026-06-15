import { Test, TestingModule } from '@nestjs/testing';
import { ForecastBoardsService } from './services/forecast-boards.service';
import { PrismaService } from './database/prisma.service';

describe('ForecastBoardsService (End-to-End Rep/Manager Functionalities)', () => {
  let service: ForecastBoardsService;
  let prisma: PrismaService;
  const tenantId = 'demo-tenant-01';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForecastBoardsService, PrismaService],
    }).compile();

    service = module.get<ForecastBoardsService>(ForecastBoardsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should seed minimal test data and execute all Rep and Manager API operations', async () => {
    console.log('Seeding minimal test data...');

    const rep1 = await prisma.forecastUser.upsert({
      where: { id: 'rep-test-1' },
      create: { id: 'rep-test-1', tenantid: tenantId, email: 'rep1@test.com', password: 'test', name: 'Rep 1', role: 'sales_rep', region: 'NA' },
      update: {}
    });

    const manager = await prisma.forecastUser.upsert({
      where: { id: 'mgr-test-1' },
      create: { id: 'mgr-test-1', tenantid: tenantId, email: 'mgr1@test.com', password: 'test', name: 'Manager 1', role: 'manager', region: 'NA' },
      update: {}
    });

    await prisma.forecastUser.update({
      where: { id: rep1.id },
      data: { managerId: manager.id }
    });

    const period = await prisma.forecastPeriod.upsert({
      where: { id: 'Q1-2026' },
      create: {
        id: 'Q1-2026',
        tenantid: tenantId,
        name: 'Q1 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        revenueTarget: 100000,
        status: 'open'
      },
      update: {}
    });

    const board = await prisma.forecastBoard.upsert({
      where: { id: 'board-test-1' },
      create: {
        id: 'board-test-1',
        tenantid: tenantId,
        name: 'Test Board',
        activePeriod: 'Q1-2026',
        periodType: 'Quarterly',
        scope: 'Global',
        status: 'active'
      },
      update: {}
    });

    const column1 = await prisma.boardColumn.upsert({
      where: { id: 'col-test-commit' },
      create: {
        id: 'col-test-commit',
        tenantid: tenantId,
        boardId: board.id,
        label: 'Commit',
        type: 'Submission',
        submissionMode: 'Manual',
        sortOrder: 1
      },
      update: {}
    });

    console.log('--- Testing Rep Functionality ---');
    const repView = await service.getBoardView(tenantId, board.id, 'sales_rep', rep1.id);
    expect(repView.rows.length).toBe(1);
    expect(repView.rows[0].userId).toBe(rep1.id);

    const submission = await service.submitForecast(tenantId, board.id, {
      columnId: column1.id,
      repUserId: rep1.id,
      value: 50000,
      note: 'Initial commit'
    });
    expect(submission.commitForecast).toBe(50000);

    const history = await service.getRepHistory(tenantId, board.id, rep1.id, column1.id);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].value).toBe(50000);

    console.log('--- Testing Manager Functionality ---');
    const mgrView = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
    expect(mgrView.rows.length).toBeGreaterThan(0);
    expect(mgrView.rollup).toBeDefined();

    const annotation = await service.addManagerAnnotation(tenantId, board.id, submission.id, manager.id, 'Good job');
    expect(annotation.content).toBe('Good job');

    const drilldown = await service.getRepDrilldown(tenantId, board.id, rep1.id);
    expect(drilldown.rep.id).toBe(rep1.id);

    const exclude = await service.excludeMember(tenantId, board.id, rep1.id, manager.id);
    expect(exclude.isActive).toBe(true);

    const mgrViewExcluded = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
    const excludedRow = mgrViewExcluded.rows.find(r => r.userId === rep1.id);
    expect(excludedRow?.isExcluded).toBe(true);
  });
});

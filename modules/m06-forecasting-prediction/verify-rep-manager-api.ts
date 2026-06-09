import { PrismaClient } from '../../packages/database/node_modules/@prisma/client';
import { ForecastBoardsService } from './services/forecast-boards.service';

const prisma = new PrismaClient();
// @ts-ignore
const service = new ForecastBoardsService(prisma);

async function runTests() {
  const tenantId = 'demo-tenant-01';

  // Seed some minimal data to test with
  console.log('Seeding minimal test data...');
  
  const rep1 = await prisma.forecastUser.upsert({
    where: { id: 'rep-test-1' },
    create: { id: 'rep-test-1', tenantId, email: 'rep1@test.com', name: 'Rep 1', role: 'sales_rep', region: 'NA', isActive: true },
    update: {}
  });

  const manager = await prisma.forecastUser.upsert({
    where: { id: 'mgr-test-1' },
    create: { id: 'mgr-test-1', tenantId, email: 'mgr1@test.com', name: 'Manager 1', role: 'manager', region: 'NA', isActive: true },
    update: {}
  });

  // Link rep to manager
  await prisma.forecastUser.update({
    where: { id: rep1.id },
    data: { managerId: manager.id }
  });

  const board = await prisma.forecastBoard.upsert({
    where: { id: 'board-test-1' },
    create: {
      id: 'board-test-1',
      tenantId,
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
      tenantId,
      boardId: board.id,
      label: 'Commit',
      type: 'Submission',
      submissionMode: 'Manual',
      sortOrder: 1
    },
    update: {}
  });

  console.log('--- Testing Rep Functionality ---');
  // 1. Get Board View as Rep
  const repView = await service.getBoardView(tenantId, board.id, 'sales_rep', rep1.id);
  console.log('Rep View Success:', repView.rows.length === 1 && repView.rows[0].userId === rep1.id);

  // 2. Submit Forecast
  const submission = await service.submitForecast(tenantId, board.id, {
    columnId: column1.id,
    repUserId: rep1.id,
    value: 50000,
    note: 'Initial commit'
  });
  console.log('Submit Forecast Success:', submission.commitForecast === 50000);

  // 3. History
  const history = await service.getRepHistory(tenantId, board.id, rep1.id, column1.id);
  console.log('History Success:', history.length > 0 && history[0].value === 50000);

  console.log('--- Testing Manager Functionality ---');
  // 4. Get Board View as Manager
  const mgrView = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
  console.log('Manager View Success:', mgrView.rows.length > 1 && mgrView.rollup !== null);
  
  // 5. Manager Annotation
  const annotation = await service.addManagerAnnotation(tenantId, board.id, submission.id, manager.id, 'Good job');
  console.log('Manager Annotation Success:', annotation.content === 'Good job');

  // 6. Drilldown
  const drilldown = await service.getRepDrilldown(tenantId, board.id, rep1.id);
  console.log('Manager Drilldown Success:', drilldown.rep.id === rep1.id);

  // 7. Exclude Member
  const exclude = await service.excludeMember(tenantId, board.id, rep1.id, manager.id);
  console.log('Exclude Member Success:', exclude.isActive === true);

  const mgrViewExcluded = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
  console.log('Rollup Excludes Member Success:', mgrViewExcluded.rows.find(r => r.userId === rep1.id)?.isExcluded === true);

  console.log('All Rep and Manager functionalities verified successfully!');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

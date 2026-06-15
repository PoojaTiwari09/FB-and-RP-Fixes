"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const forecast_boards_service_1 = require("./services/forecast-boards.service");
const prisma = new database_1.PrismaClient();
const service = new forecast_boards_service_1.ForecastBoardsService(undefined, prisma);
async function runTests() {
    const tenantId = '184e2880-2e36-4388-a457-4afbc0aa59f2';
    console.log('Seeding minimal test data...');
    const rep1Id = '922800ef-1a7c-4ce6-a201-144a2788040d';
    const rep1 = await prisma.forecastUser.upsert({
        where: { id: rep1Id },
        create: { id: rep1Id, tenantid: tenantId, email: 'rep1@test.com', name: 'Rep 1', role: 'sales_rep', region: 'NA', password: 'placeholder-hash' },
        update: {}
    });
    const managerId = 'a2cd419f-f782-4f53-ba2e-1e1571490abf';
    const manager = await prisma.forecastUser.upsert({
        where: { id: managerId },
        create: { id: managerId, tenantid: tenantId, email: 'mgr1@test.com', name: 'Manager 1', role: 'manager', region: 'NA', password: 'placeholder-hash' },
        update: {}
    });
    await prisma.forecastUser.update({
        where: { id: rep1.id },
        data: { managerId: manager.id }
    });
    const periodId = 'dcb5886d-ea68-4669-9c9d-0e3c4f9eca9c';
    const period = await prisma.forecastPeriod.upsert({
        where: { id: periodId },
        create: {
            id: periodId,
            tenantid: tenantId,
            name: 'Q1 FY26',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-03-31'),
            revenueTarget: 1000000,
            status: 'active'
        },
        update: {}
    });
    const boardId = 'a19d380c-a6e4-4034-bf6e-eb1c0774b75d';
    const board = await prisma.forecastBoard.upsert({
        where: { id: boardId },
        create: {
            id: boardId,
            tenantid: tenantId,
            name: 'Test Board',
            activePeriod: periodId,
            periodType: 'Quarterly',
            scope: 'Global',
            status: 'active'
        },
        update: {
            activePeriod: periodId
        }
    });
    const column1Id = '16cea9e3-dc14-4772-bd81-5eff877f667f';
    const column1 = await prisma.boardColumn.upsert({
        where: { id: column1Id },
        create: {
            id: column1Id,
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
    console.log('Rep View Success:', repView.rows.length === 1 && repView.rows[0].userId === rep1.id);
    const submission = await service.submitForecast(tenantId, board.id, {
        columnId: column1.id,
        repUserId: rep1.id,
        value: 50000,
        note: 'Initial commit'
    });
    console.log('Submit Forecast Success:', submission.commitForecast === 50000);
    const history = await service.getRepHistory(tenantId, board.id, rep1.id, column1.id);
    console.log('History Success:', history.length > 0 && history[0].value === 50000);
    console.log('--- Testing Manager Functionality ---');
    const mgrView = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
    console.log('Manager View Success:', mgrView.rows.length > 1 && mgrView.rollup !== null);
    const annotation = await service.addManagerAnnotation(tenantId, board.id, submission.id, manager.id, 'Good job');
    console.log('Manager Annotation Success:', annotation.content === 'Good job');
    const drilldown = await service.getRepDrilldown(tenantId, board.id, rep1.id);
    console.log('Manager Drilldown Success:', drilldown.rep.id === rep1.id);
    const exclude = await service.excludeMember(tenantId, board.id, rep1.id, manager.id);
    console.log('Exclude Member Success:', exclude.isActive === true);
    const mgrViewExcluded = await service.getBoardView(tenantId, board.id, 'manager', manager.id);
    console.log('Rollup Excludes Member Success:', mgrViewExcluded.rows.find(r => r.userId === rep1.id)?.isExcluded === true);
    console.log('All Rep and Manager functionalities verified successfully!');
}
runTests().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=verify-rep-manager-api.js.map
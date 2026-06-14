"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const forecast_upgrade_service_1 = require("../services/forecast-upgrade.service");
const prisma = new database_1.PrismaClient();
const service = new forecast_upgrade_service_1.ForecastUpgradeService(prisma);
async function runE2E() {
    console.log('--- M06 E2E INTEGRATION VALIDATION ---');
    const TENANT_ID = '00000000-0000-0000-0000-000000000001';
    const MANAGER_ID = '00000000-0000-0000-0000-000000000002';
    const REP_ID = '00000000-0000-0000-0000-000000000003';
    const PERIOD_ID = '00000000-0000-0000-0000-0000000000b2';
    try {
        console.log('[1/7] Fetching Forecast Periods...');
        const periods = await service.getPeriods();
        if (!periods.find((p) => p.id === PERIOD_ID))
            throw new Error('Period not found');
        console.log('✅ Periods loaded successfully');
        console.log('[2/7] Fetching Rep Drilldown...');
        const period = await prisma.forecastPeriod.findUnique({ where: { id: PERIOD_ID } });
        console.log(`Period: ${period?.startDate.toISOString()} to ${period?.endDate.toISOString()}`);
        const dbDeals = await prisma.crmDeal.findMany({ where: { repUserId: REP_ID } });
        console.log(`DB Deals for REP_ID: ${dbDeals.length}. First close date: ${dbDeals[0]?.closeDate.toISOString()}`);
        const drilldown = await service.getRepDrilldown(REP_ID, PERIOD_ID);
        if (!drilldown || drilldown.length === 0)
            throw new Error('No deals found for Rep');
        const firstDealId = drilldown[0].deal_id;
        console.log(`✅ Drilldown loaded. Found ${drilldown.length} deals. Using deal ${firstDealId}`);
        console.log('[3/7] Rep creates and submits a Best Case & Commit...');
        await service.createOrUpdateSubmission(REP_ID, firstDealId, PERIOD_ID, 'commit', 55000);
        await service.createOrUpdateSubmission(REP_ID, firstDealId, PERIOD_ID, 'best_case', 60000);
        const submissions = await service.getSubmissions(PERIOD_ID, REP_ID);
        const subId = submissions.find((s) => s.deal_id === firstDealId)?.id;
        if (!subId)
            throw new Error('Submission ID not found after create');
        await service.submitForecast(subId, REP_ID, 'both');
        console.log('✅ Rep submitted Best Case and Commit successfully.');
        console.log('[4/7] Manager loading board to review...');
        const managerBoard = await service.getManagerBoard(MANAGER_ID, PERIOD_ID);
        if (!managerBoard || managerBoard.length === 0)
            throw new Error('Manager board returned no rows');
        console.log(`✅ Manager board loaded successfully. Found ${managerBoard.length} rows.`);
        console.log('[5/7] Manager overrides the deal...');
        await service.overrideSubmission(subId, MANAGER_ID, 'commit', 75000);
        const dealAfterOverride = await prisma.crmDeal.findUnique({ where: { id: firstDealId } });
        if (dealAfterOverride?.manualForecast !== 75000) {
            throw new Error(`Manual forecast not synced. Expected 75000, got ${dealAfterOverride?.manualForecast}`);
        }
        console.log('✅ Manager override successful. AI manual_forecast synced to CrmDeal.');
        console.log('[6/7] Checking Notifications for Rep...');
        const notifications = await service.getNotifications(REP_ID);
        if (notifications.length === 0)
            throw new Error('No notifications generated for Rep');
        const notifId = notifications[0].id;
        await service.markNotificationSeen(notifId);
        console.log('✅ Notifications generated and marked as seen.');
        console.log('[7/7] Testing Bulk Target Assignments...');
        await service.assignTargets(PERIOD_ID, MANAGER_ID, [
            { rep_id: REP_ID, target_value: 8000000 }
        ]);
        const targetCheck = await prisma.quota.findFirst({ where: { repUserId: REP_ID, periodId: PERIOD_ID } });
        if (targetCheck?.amount !== 8000000)
            throw new Error('Target assignment failed');
        console.log('✅ Targets assigned successfully.');
        console.log('\n🎉 ALL E2E VALIDATION TESTS PASSED 🎉');
    }
    catch (err) {
        console.error('❌ E2E VALIDATION FAILED:', err);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
runE2E();
//# sourceMappingURL=simulate-m06-e2e.js.map
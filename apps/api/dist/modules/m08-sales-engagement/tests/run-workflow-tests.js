"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../../../app.module");
const workflow_service_1 = require("../services/workflow.service");
const prisma_service_1 = require("../../../platform-core/database/prisma.service");
function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ ASSERTION FAILED: ${message}`);
    }
    console.log(`✅ PASS: ${message}`);
}
async function runWorkflowTests() {
    console.log('\n==========================================================');
    console.log('🚀 RUNNING WORKFLOW AUTOMATION (M8 SALES ENGAGEMENT) E2E');
    console.log('==========================================================\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const service = app.get(workflow_service_1.M08WorkflowService);
    const prisma = app.get(prisma_service_1.PrismaService);
    let passed = 0;
    let failed = 0;
    const tenantId = '00000000-0000-0000-0000-000000000000';
    const userId = '00000000-0000-0000-0000-000000000000';
    try {
        await prisma.workflowException.deleteMany({ where: { tenantId } });
        await prisma.approval.deleteMany({ where: { tenantId } });
        await prisma.workflowRun.deleteMany({ where: { tenantId } });
        await prisma.workflow.deleteMany({ where: { tenantId } });
        await prisma.integrationState.deleteMany({ where: { tenantId } });
        await service.updateIntegration(tenantId, 'salesforce', 'connected', { sandbox: true });
        console.log('\n--- Workflow Builder & Versioning ---');
        try {
            const wf = await service.createWorkflow(tenantId, {
                name: 'Enterprise Proposal Pipeline Orchestration',
                description: 'Auto-allocates reps, validates quote thresholds, and syncs values to Salesforce CRM.',
                triggerType: 'deal.stage.changed',
                triggerConditions: {
                    toStage: { operator: 'equals', value: 'proposal' },
                },
                definition: {
                    steps: [
                        {
                            type: 'branch',
                            conditions: { amount: { operator: 'greaterThan', value: '10000' } },
                            trueBranch: 'Assign Enterprise Team',
                            falseBranch: 'Fallback Small Business Routing',
                            fallbackAction: { type: 'email_compose', template: 'small_biz_outreach' },
                        },
                        {
                            type: 'assignment',
                            rule: 'territory',
                        },
                        {
                            type: 'approval_threshold',
                            threshold: 50000,
                        },
                        {
                            type: 'sync_crm',
                        }
                    ],
                },
                version: 1,
                isActive: true,
            }, userId);
            assert(wf !== null, 'Workflow playbook successfully saved in database');
            assert(wf.version === 1, 'Version tracker matches initial version');
            assert(wf.definition.steps.length === 4, 'Workflow definitions contain exactly 4 action nodes');
            passed++;
        }
        catch (e) {
            console.error('❌ Workflow Builder Failed:', e);
            failed++;
        }
        console.log('\n--- Trigger Engine Event Matching ---');
        try {
            const skippedRuns = await service.triggerWorkflow(tenantId, 'deal.stage.changed', {
                toStage: 'qualification',
                amount: 25000,
            });
            assert(skippedRuns.length === 0, 'Trigger engine successfully bypassed qualification events');
            const activeRuns = await service.triggerWorkflow(tenantId, 'deal.stage.changed', {
                toStage: 'proposal',
                amount: 75000,
                region: 'US',
            });
            assert(activeRuns.length === 1, 'Trigger engine successfully matched proposal events and instantiated run');
            const run = await prisma.workflowRun.findUnique({ where: { id: activeRuns[0].id } });
            assert(run !== null, 'Workflow run successfully created in DB');
            assert(run.status === 'paused', 'Workflow run correctly paused waiting for strategic quote approval');
            assert(run.currentStepIndex === 2, 'Execution stopped at exactly index 2 (quote threshold step)');
            passed++;
        }
        catch (e) {
            console.error('❌ Trigger Engine Failed:', e);
            failed++;
        }
        console.log('\n--- Quote Approval Routing & Resuming ---');
        try {
            const approvals = await service.getApprovals(tenantId, 'pending');
            assert(approvals.length === 1, 'Approval table logged exactly 1 pending quote verification task');
            assert(approvals[0].thresholdDetails.amount === 75000, 'Threshold details reflect exact transaction amount');
            const resolved = await service.submitApproval(tenantId, approvals[0].id, {
                status: 'approved',
            }, userId);
            assert(resolved.status === 'approved', 'Manager approval status transitioned to approved');
            const run = await prisma.workflowRun.findFirst({ where: { status: 'completed' } });
            assert(run !== null, 'Workflow run successfully resumed execution and completed with success state');
            assert(run.currentStepIndex === 4, 'All 4 step nodes executed successfully');
            passed++;
        }
        catch (e) {
            console.error('❌ Approval Routing Failed:', e);
            failed++;
        }
        console.log('\n--- CRM Integration Outage Recovery & Auditing ---');
        try {
            await service.updateIntegration(tenantId, 'salesforce', 'error');
            const activeRuns = await service.triggerWorkflow(tenantId, 'deal.stage.changed', {
                toStage: 'proposal',
                amount: 5000,
                region: 'US',
            });
            assert(activeRuns.length === 1, 'Workflow instantiated run for low-value deal');
            const run = await prisma.workflowRun.findUnique({ where: { id: activeRuns[0].id } });
            assert(run.status === 'failed', 'Execution failed gracefully due to CRM connection outage');
            const exceptions = await service.getExceptions(tenantId, false);
            assert(exceptions.length === 1, 'Exception monitoring dashboard registered exactly 1 unresolved CRM sync failure');
            assert(exceptions[0].errorCode === 'EXECUTION_FAILED', 'Correct execution error code assigned');
            const logs = await service.getAuditLogs(tenantId);
            assert(logs.length > 0, 'Immutable audit logger captured all actions and exceptions cleanly');
            passed++;
        }
        catch (e) {
            console.error('❌ Exception Monitoring Failed:', e);
            failed++;
        }
        console.log('\n--- Max Steps & Mandatory Fallback Validations ---');
        try {
            const longSteps = Array(21).fill({ type: 'sync_crm' });
            try {
                await service.createWorkflow(tenantId, {
                    name: 'Invalid Long Playbook',
                    triggerType: 'deal.stage.changed',
                    triggerConditions: {},
                    definition: { steps: longSteps },
                    version: 1,
                    isActive: true
                }, userId);
                assert(false, 'Should have failed with step limit checks');
            }
            catch (e) {
                assert(e.message === 'Workflows are restricted to a maximum of 20 step nodes', 'Enforced max 20 branches validation correctly');
            }
            try {
                await service.createWorkflow(tenantId, {
                    name: 'Invalid Conditional Playbook',
                    triggerType: 'deal.stage.changed',
                    triggerConditions: {},
                    definition: {
                        steps: [
                            { type: 'branch', conditions: { amount: { operator: 'greaterThan', value: '1000' } } }
                        ]
                    },
                    version: 1,
                    isActive: true
                }, userId);
                assert(false, 'Should have failed with mandatory fallback checks');
            }
            catch (e) {
                assert(e.message === 'Conditional branch steps require a valid fallback path or action', 'Enforced mandatory fallback check correctly');
            }
            passed++;
        }
        catch (e) {
            console.error('❌ Limit & Fallback checks failed:', e);
            failed++;
        }
        console.log('\n--- Trigger Event Idempotency Checks ---');
        try {
            await service.updateIntegration(tenantId, 'salesforce', 'connected');
            const firstTrigger = await service.triggerWorkflow(tenantId, 'deal.stage.changed', {
                toStage: 'proposal',
                amount: 25000,
                region: 'US',
                dealId: 'd1c2b3a4-1111-2222-3333-444455556666'
            });
            assert(firstTrigger.length === 1, 'First trigger registered deal successfully');
            const secondTrigger = await service.triggerWorkflow(tenantId, 'deal.stage.changed', {
                toStage: 'proposal',
                amount: 25000,
                region: 'US',
                dealId: 'd1c2b3a4-1111-2222-3333-444455556666'
            });
            assert(secondTrigger.length === 1, 'Subsequent triggers did not spawn duplicate parallel execution runs');
            passed++;
        }
        catch (e) {
            console.error('❌ Idempotency Lock Checks failed:', e);
            failed++;
        }
    }
    catch (globalError) {
        console.error('💥 E2E Test Suite Crashed:', globalError);
    }
    finally {
        await app.close();
    }
    console.log('\n==========================================================');
    console.log(`📊 TEST SUITE SUMMARY: PASSED ${passed} | FAILED ${failed}`);
    console.log('==========================================================\n');
    if (failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runWorkflowTests();
//# sourceMappingURL=run-workflow-tests.js.map
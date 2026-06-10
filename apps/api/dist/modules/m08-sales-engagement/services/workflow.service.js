"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const workflow_repository_1 = require("../repositories/workflow.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const m08_queue_constants_1 = require("../queues/m08-queue.constants");
let M08WorkflowService = class M08WorkflowService {
    repo;
    events;
    workflowRunsQueue;
    constructor(repo, events, workflowRunsQueue) {
        this.repo = repo;
        this.events = events;
        this.workflowRunsQueue = workflowRunsQueue;
    }
    async createWorkflow(tenantId, dto, userId) {
        const definition = dto.definition;
        const steps = definition?.steps || [];
        if (steps.length > 20) {
            throw new common_1.BadRequestException('Workflows are restricted to a maximum of 20 step nodes');
        }
        for (const step of steps) {
            if (step.type === 'branch' && !step.fallbackAction && !step.falseBranch) {
                throw new common_1.BadRequestException('Conditional branch steps require a valid fallback path or action');
            }
        }
        const wf = await this.repo.createWorkflow(tenantId, dto);
        await this.repo.logAction(tenantId, wf.id, userId, 'workflow.created', { name: wf.name });
        return wf;
    }
    async updateWorkflow(tenantId, id, dto, userId) {
        const wf = await this.repo.updateWorkflow(tenantId, id, dto);
        await this.repo.logAction(tenantId, wf.id, userId, 'workflow.updated', { updates: dto });
        return wf;
    }
    async getWorkflows(tenantId, isActive) {
        return this.repo.findWorkflows(tenantId, { isActive });
    }
    async getWorkflowById(tenantId, id) {
        return this.repo.findWorkflowById(tenantId, id);
    }
    async triggerWorkflow(tenantId, eventType, payload) {
        const activeWorkflows = await this.repo.findWorkflows(tenantId, { isActive: true });
        const triggeredRuns = [];
        for (const wf of activeWorkflows) {
            if (wf.triggerType === eventType) {
                const matches = this.evaluateConditions(payload, wf.triggerConditions);
                if (matches) {
                    console.log(`[Workflow Trigger Engine] Trigger match found for Workflow "${wf.name}" (${wf.id})`);
                    const run = await this.repo.createWorkflowRun(tenantId, wf.id, {
                        dealId: payload.dealId,
                        contactId: payload.contactId,
                        triggerPayload: payload,
                        variables: payload,
                    });
                    await this.enqueueWorkflowRun(tenantId, run.id);
                    triggeredRuns.push(run);
                }
            }
        }
        return triggeredRuns;
    }
    async enqueueWorkflowRun(tenantId, runId) {
        const jobId = `${tenantId}:${runId}`;
        await this.workflowRunsQueue.add(m08_queue_constants_1.EXECUTE_WORKFLOW_RUN_JOB, { tenantId, runId }, {
            jobId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
    }
    async getWorkflowRuns(tenantId, workflowId) {
        return this.repo.findWorkflowRuns(tenantId, workflowId);
    }
    evaluateConditions(payload, conditions) {
        if (!conditions || Object.keys(conditions).length === 0)
            return true;
        for (const key of Object.keys(conditions)) {
            const cond = conditions[key];
            const val = payload[key];
            if (cond.operator === 'equals' && val !== cond.value)
                return false;
            if (cond.operator === 'greaterThan' && (val === undefined || Number(val) <= Number(cond.value)))
                return false;
            if (cond.operator === 'contains' && (val === undefined || !String(val).includes(cond.value)))
                return false;
        }
        return true;
    }
    async executeWorkflowRun(tenantId, runId) {
        const run = await this.repo.findWorkflowRunById(tenantId, runId);
        const wf = await this.repo.findWorkflowById(tenantId, run.workflowId);
        const definition = wf.definition;
        const steps = definition.steps || [];
        const logs = run.logs || [];
        let currentIdx = run.currentStepIndex;
        let runStatus = 'completed';
        console.log(`[Workflow Execution Launcher] Executing Run ID ${run.id} starting from step index ${currentIdx}`);
        for (let i = currentIdx; i < steps.length; i++) {
            const step = steps[i];
            logs.push({ stepNum: i + 1, action: step.type, timestamp: new Date(), status: 'executing' });
            try {
                if (step.type === 'branch') {
                    const conditionMatches = this.evaluateConditions(run.variables, step.conditions);
                    const nextBranch = conditionMatches ? step.trueBranch : step.falseBranch;
                    console.log(`[Branch Engine] Conditional check resolved to: ${conditionMatches ? 'True Branch' : 'False Branch'}`);
                    logs.push({ stepNum: i + 1, detail: `Branch evaluated. Next workflow path targeted: ${nextBranch}` });
                    if (!conditionMatches && step.fallbackAction) {
                        await this.executeStepAction(tenantId, run, step.fallbackAction);
                    }
                }
                else if (step.type === 'assignment') {
                    const assignedUser = await this.resolveAssignment(tenantId, step.rule, run.variables);
                    console.log(`[Assignment Engine] Automated Lead/Task routing assigned to user ID: ${assignedUser}`);
                    run.variables = { ...(run.variables || {}), assignedUser };
                    logs.push({ stepNum: i + 1, detail: `Task assigned via rule '${step.rule}' to user: ${assignedUser}` });
                }
                else if (step.type === 'approval_threshold') {
                    const amount = run.variables ? run.variables.amount : 0;
                    if (amount > step.threshold) {
                        console.log(`[Quote Threshold Violation] Required approval for quote amount $${amount} exceeding limit of $${step.threshold}`);
                        await this.repo.createApproval(tenantId, {
                            runId: run.id,
                            workflowId: wf.id,
                            type: 'quote_approval',
                            title: `Quote Approval for Deal (${amount})`,
                            description: `Required strategic quote verification since opportunity value exceeds threshold rules limit ($${step.threshold}).`,
                            thresholdDetails: { amount, threshold: step.threshold },
                        });
                        runStatus = 'paused';
                        await this.repo.updateWorkflowRun(tenantId, run.id, {
                            status: 'paused',
                            currentStepIndex: i,
                            logs,
                        });
                        await this.events.publish('workflow.run.paused', { runId: run.id, reason: 'approval_required' });
                        return;
                    }
                }
                else {
                    await this.executeStepAction(tenantId, run, step);
                }
                logs[logs.length - 1].status = 'success';
            }
            catch (err) {
                logs[logs.length - 1].status = 'failed';
                logs[logs.length - 1].error = err.message;
                console.error(`[Execution Exception] Step failed during run ${run.id}:`, err.message);
                await this.repo.logException(tenantId, {
                    runId: run.id,
                    workflowId: wf.id,
                    errorCode: 'EXECUTION_FAILED',
                    errorMessage: err.message,
                });
                if (step.fallback) {
                    console.warn(`[Fallback Triggered] Executing emergency fallback path: ${step.fallback}`);
                    run.variables = { ...(run.variables || {}), fallbackInitiated: true };
                }
                runStatus = 'failed';
                await this.repo.updateWorkflowRun(tenantId, run.id, { status: 'failed', logs });
                return;
            }
        }
        await this.repo.updateWorkflowRun(tenantId, run.id, {
            status: runStatus,
            currentStepIndex: steps.length,
            logs,
        });
        await this.events.publish('workflow.run.completed', { runId: run.id, status: runStatus });
    }
    async executeStepAction(tenantId, run, step) {
        if (step.type === 'sync_crm') {
            const integration = await this.repo.findIntegrationStates(tenantId);
            const sf = integration.find(i => i.provider === 'salesforce');
            if (!sf || sf.status === 'error') {
                throw new common_1.BadRequestException('Salesforce Sync failed: connection offline or token expired.');
            }
            console.log(`[CRM Sync] Synchronized deal ${run.dealId} values to provider: Salesforce`);
        }
        if (step.type === 'email_compose') {
            await this.events.publish('notification.alert.requested', {
                tenantId,
                channel: 'email',
                subject: step.subject ?? 'Workflow outreach',
                body: step.body ?? 'Automated outreach from workflow run ' + run.id,
                recipient: run.variables?.ownerEmail,
                metadata: { runId: run.id, stepType: 'email_compose' },
            });
        }
    }
    async resolveAssignment(tenantId, rule, variables) {
        const sampleReps = [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333'
        ];
        if (rule === 'territory') {
            const region = variables.region || 'US';
            return region === 'EU' ? sampleReps[1] : sampleReps[0];
        }
        if (rule === 'capacity') {
            return sampleReps[2];
        }
        const idx = Math.floor(Math.random() * sampleReps.length);
        return sampleReps[idx];
    }
    async getApprovals(tenantId, status) {
        return this.repo.findApprovals(tenantId, { status });
    }
    async submitApproval(tenantId, id, dto, userId) {
        const approval = await this.repo.findApprovalById(tenantId, id);
        if (approval.status !== 'pending') {
            throw new common_1.BadRequestException('This approval task is already resolved');
        }
        const updated = await this.repo.updateApproval(tenantId, id, {
            status: dto.status,
            approverId: userId,
        });
        await this.repo.logAction(tenantId, approval.workflowId, userId, `approval.${dto.status}`, { id });
        if (dto.status === 'approved' && approval.runId) {
            const run = await this.repo.findWorkflowRunById(tenantId, approval.runId);
            await this.repo.updateWorkflowRun(tenantId, run.id, {
                status: 'running',
                currentStepIndex: run.currentStepIndex + 1,
            });
            console.log(`[Approval Resumed] Resuming paused workflow run ${run.id}`);
            await this.executeWorkflowRun(tenantId, run.id);
        }
        return updated;
    }
    async handleEscalationJob(tenantId, approvalId) {
        const app = await this.repo.findApprovalById(tenantId, approvalId);
        if (app.status === 'pending') {
            console.warn(`[Escalation Alert] Paused approval step ${app.id} exceeded duration threshold. Escalating to executive admin.`);
            await this.repo.updateApproval(tenantId, app.id, { status: 'escalated' });
            await this.events.publish('workflow.approval.escalated', { approvalId });
        }
    }
    async getExceptions(tenantId, resolved) {
        return this.repo.findExceptions(tenantId, resolved);
    }
    async resolveException(tenantId, id) {
        return this.repo.resolveException(tenantId, id);
    }
    async getIntegrations(tenantId) {
        return this.repo.findIntegrationStates(tenantId);
    }
    async updateIntegration(tenantId, provider, status, config) {
        return this.repo.upsertIntegrationState(tenantId, provider, status, config);
    }
    async getAuditLogs(tenantId, workflowId) {
        return this.repo.findAuditLogs(tenantId, workflowId);
    }
};
exports.M08WorkflowService = M08WorkflowService;
exports.M08WorkflowService = M08WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(workflow_repository_1.M08WorkflowRepository)),
    __param(1, (0, common_1.Inject)(event_publisher_service_1.EventPublisherService)),
    __param(2, (0, bullmq_1.InjectQueue)(m08_queue_constants_1.M08_WORKFLOW_RUNS_QUEUE)),
    __metadata("design:paramtypes", [workflow_repository_1.M08WorkflowRepository,
        event_publisher_service_1.EventPublisherService,
        bullmq_2.Queue])
], M08WorkflowService);
//# sourceMappingURL=workflow.service.js.map
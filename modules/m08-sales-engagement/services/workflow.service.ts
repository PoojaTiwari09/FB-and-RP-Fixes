import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { M08WorkflowRepository } from '../repositories/workflow.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { CreateWorkflowDto, UpdateWorkflowDto, SubmitApprovalDto } from '../schemas/workflow.schema';
import { EXECUTE_WORKFLOW_RUN_JOB, M08_WORKFLOW_RUNS_QUEUE } from '../queues/m08-queue.constants';

@Injectable()
export class M08WorkflowService {
  constructor(
    @Inject(M08WorkflowRepository) private readonly repo: M08WorkflowRepository,
    @Inject(EventPublisherService) private readonly events: EventPublisherService,
    @InjectQueue(M08_WORKFLOW_RUNS_QUEUE) private readonly workflowRunsQueue: Queue,
  ) {}

  // --- WORKFLOW DRAFT & LIFECYCLE ---

  async createWorkflow(tenantId: string, dto: CreateWorkflowDto, userId: string) {
    const definition = dto.definition as any;
    const steps = definition?.steps || [];
    if (steps.length > 20) {
      throw new BadRequestException('Workflows are restricted to a maximum of 20 step nodes');
    }
    for (const step of steps) {
      if (step.type === 'branch' && !step.fallbackAction && !step.falseBranch) {
        throw new BadRequestException('Conditional branch steps require a valid fallback path or action');
      }
    }
    const wf = await this.repo.createWorkflow(tenantId, dto);
    await this.repo.logAction(tenantId, wf.id, userId, 'workflow.created', { name: wf.name });
    return wf;
  }

  async updateWorkflow(tenantId: string, id: string, dto: UpdateWorkflowDto, userId: string) {
    const wf = await this.repo.updateWorkflow(tenantId, id, dto);
    await this.repo.logAction(tenantId, wf.id, userId, 'workflow.updated', { updates: dto });
    return wf;
  }

  async getWorkflows(tenantId: string, isActive?: boolean) {
    return this.repo.findWorkflows(tenantId, { isActive });
  }

  async getWorkflowById(tenantId: string, id: string) {
    return this.repo.findWorkflowById(tenantId, id);
  }

  // --- TRIGGER ENGINE & RUNS ORCHESTRATION ---

  async triggerWorkflow(tenantId: string, eventType: string, payload: any) {
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

  async enqueueWorkflowRun(tenantId: string, runId: string) {
    const jobId = `${tenantId}:${runId}`;
    await this.workflowRunsQueue.add(
      EXECUTE_WORKFLOW_RUN_JOB,
      { tenantId, runId },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }

  async getWorkflowRuns(tenantId: string, workflowId?: string) {
    return this.repo.findWorkflowRuns(tenantId, workflowId);
  }

  // --- BRANCH ENGINE & ROUTING LOGIC ---

  private evaluateConditions(payload: any, conditions: any): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;
    
    // Evaluate fields (e.g. operator: "equals", operator: "greaterThan")
    for (const key of Object.keys(conditions)) {
      const cond = conditions[key];
      const val = payload[key];

      if (cond.operator === 'equals' && val !== cond.value) return false;
      if (cond.operator === 'greaterThan' && (val === undefined || Number(val) <= Number(cond.value))) return false;
      if (cond.operator === 'contains' && (val === undefined || !String(val).includes(cond.value))) return false;
    }

    return true;
  }

  async executeWorkflowRun(tenantId: string, runId: string) {
    const run = await this.repo.findWorkflowRunById(tenantId, runId);
    const wf = await this.repo.findWorkflowById(tenantId, run.workflowId);

    const definition = wf.definition as any;
    const steps = definition.steps || [];
    const logs = (run.logs as any[]) || [];

    let currentIdx = run.currentStepIndex;
    let runStatus = 'completed';

    console.log(`[Workflow Execution Launcher] Executing Run ID ${run.id} starting from step index ${currentIdx}`);

    for (let i = currentIdx; i < steps.length; i++) {
      const step = steps[i];
      logs.push({ stepNum: i + 1, action: step.type, timestamp: new Date(), status: 'executing' });

      try {
        if (step.type === 'branch') {
          // Conditional branching evaluation
          const conditionMatches = this.evaluateConditions(run.variables, step.conditions);
          const nextBranch = conditionMatches ? step.trueBranch : step.falseBranch;
          console.log(`[Branch Engine] Conditional check resolved to: ${conditionMatches ? 'True Branch' : 'False Branch'}`);
          
          logs.push({ stepNum: i + 1, detail: `Branch evaluated. Next workflow path targeted: ${nextBranch}` });
          // If fallback route matches, execute custom action
          if (!conditionMatches && step.fallbackAction) {
            await this.executeStepAction(tenantId, run, step.fallbackAction);
          }
        } 
        else if (step.type === 'assignment') {
          // Routing Assignment rules
          const assignedUser = await this.resolveAssignment(tenantId, step.rule, run.variables);
          console.log(`[Assignment Engine] Automated Lead/Task routing assigned to user ID: ${assignedUser}`);
          
          run.variables = { ...((run.variables as any) || {}), assignedUser };
          logs.push({ stepNum: i + 1, detail: `Task assigned via rule '${step.rule}' to user: ${assignedUser}` });
        } 
        else if (step.type === 'approval_threshold') {
          // Quote approval verification (DocuSign integration thresholds)
          const amount = run.variables ? (run.variables as any).amount : 0;
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

            // Pause run execution until approved
            runStatus = 'paused';
            await this.repo.updateWorkflowRun(tenantId, run.id, {
              status: 'paused',
              currentStepIndex: i, // Resume from this approval step
              logs,
            });

            await this.events.publish('workflow.run.paused', { runId: run.id, reason: 'approval_required' });
            return;
          }
        } 
        else {
          // Standard core action executions (e.g. Email Compose task, Sync CRM)
          await this.executeStepAction(tenantId, run, step);
        }

        logs[logs.length - 1].status = 'success';
      } catch (err: any) {
        logs[logs.length - 1].status = 'failed';
        logs[logs.length - 1].error = err.message;
        
        console.error(`[Execution Exception] Step failed during run ${run.id}:`, err.message);

        // CRM Sync Recovery handling & Exception monitoring
        await this.repo.logException(tenantId, {
          runId: run.id,
          workflowId: wf.id,
          errorCode: 'EXECUTION_FAILED',
          errorMessage: err.message,
        });

        // Trigger Fallback handling if defined
        if (step.fallback) {
          console.warn(`[Fallback Triggered] Executing emergency fallback path: ${step.fallback}`);
          run.variables = { ...((run.variables as any) || {}), fallbackInitiated: true };
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

  private async executeStepAction(tenantId: string, run: any, step: any) {
    if (step.type === 'sync_crm') {
      const integration = await this.repo.findIntegrationStates(tenantId);
      const sf = integration.find(i => i.provider === 'salesforce');
      
      // Simulate connection failures to test recovery
      if (!sf || sf.status === 'error') {
        throw new BadRequestException('Salesforce Sync failed: connection offline or token expired.');
      }
      console.log(`[CRM Sync] Synchronized deal ${run.dealId} values to provider: Salesforce`);
    }

    if (step.type === 'email_compose') {
      await this.events.publish('notification.alert.requested', {
        tenantId,
        channel: 'email',
        subject: step.subject ?? 'Workflow outreach',
        body: step.body ?? 'Automated outreach from workflow run ' + run.id,
        recipient: (run.variables as any)?.ownerEmail,
        metadata: { runId: run.id, stepType: 'email_compose' },
      });
    }
  }

  // --- AUTOMATED ASSIGNMENT ENGINE ---

  private async resolveAssignment(tenantId: string, rule: string, variables: any): Promise<string> {
    const sampleReps = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    ];

    if (rule === 'territory') {
      // Routing based on territory geography parameter
      const region = variables.region || 'US';
      return region === 'EU' ? sampleReps[1] : sampleReps[0];
    }

    if (rule === 'capacity') {
      // Routes to rep with lowest task congestion - simulated
      return sampleReps[2];
    }

    // Default Round Robin assignment loop
    const idx = Math.floor(Math.random() * sampleReps.length);
    return sampleReps[idx];
  }

  // --- APPROVAL ROUTING & ACTION ---

  async getApprovals(tenantId: string, status?: string) {
    return this.repo.findApprovals(tenantId, { status });
  }

  async submitApproval(tenantId: string, id: string, dto: SubmitApprovalDto, userId: string) {
    const approval = await this.repo.findApprovalById(tenantId, id);

    if (approval.status !== 'pending') {
      throw new BadRequestException('This approval task is already resolved');
    }

    // Map approved / rejected status
    const updated = await this.repo.updateApproval(tenantId, id, {
      status: dto.status,
      approverId: userId,
    });

    await this.repo.logAction(tenantId, approval.workflowId, userId, `approval.${dto.status}`, { id });

    // If approved, resume workflow execution run
    if (dto.status === 'approved' && approval.runId) {
      const run = await this.repo.findWorkflowRunById(tenantId, approval.runId);
      await this.repo.updateWorkflowRun(tenantId, run.id, {
        status: 'running',
        currentStepIndex: run.currentStepIndex + 1, // Advance past paused step
      });

      console.log(`[Approval Resumed] Resuming paused workflow run ${run.id}`);
      // Resume E2E execution sequence
      await this.executeWorkflowRun(tenantId, run.id);
    }

    return updated;
  }

  // --- ESCALATIONS & RETRY ENGINE ---

  async handleEscalationJob(tenantId: string, approvalId: string) {
    const app = await this.repo.findApprovalById(tenantId, approvalId);
    if (app.status === 'pending') {
      console.warn(`[Escalation Alert] Paused approval step ${app.id} exceeded duration threshold. Escalating to executive admin.`);
      await this.repo.updateApproval(tenantId, app.id, { status: 'escalated' });
      await this.events.publish('workflow.approval.escalated', { approvalId });
    }
  }

  // --- EXCEPTIONS MONITORING & RESOLUTION ---

  async getExceptions(tenantId: string, resolved?: boolean) {
    return this.repo.findExceptions(tenantId, resolved);
  }

  async resolveException(tenantId: string, id: string) {
    return this.repo.resolveException(tenantId, id);
  }

  // --- INTEGRATION STATE ENGINE ---

  async getIntegrations(tenantId: string) {
    return this.repo.findIntegrationStates(tenantId);
  }

  async updateIntegration(tenantId: string, provider: string, status: string, config?: any) {
    return this.repo.upsertIntegrationState(tenantId, provider, status, config);
  }

  // --- AUDIT TRAIL LOGGING ---

  async getAuditLogs(tenantId: string, workflowId?: string) {
    return this.repo.findAuditLogs(tenantId, workflowId);
  }
}

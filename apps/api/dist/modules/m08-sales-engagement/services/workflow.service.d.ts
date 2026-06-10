import { Queue } from 'bullmq';
import { M08WorkflowRepository } from '../repositories/workflow.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { CreateWorkflowDto, UpdateWorkflowDto, SubmitApprovalDto } from '../schemas/workflow.schema';
export declare class M08WorkflowService {
    private readonly repo;
    private readonly events;
    private readonly workflowRunsQueue;
    constructor(repo: M08WorkflowRepository, events: EventPublisherService, workflowRunsQueue: Queue);
    createWorkflow(tenantId: string, dto: CreateWorkflowDto, userId: string): Promise<any>;
    updateWorkflow(tenantId: string, id: string, dto: UpdateWorkflowDto, userId: string): Promise<any>;
    getWorkflows(tenantId: string, isActive?: boolean): Promise<any>;
    getWorkflowById(tenantId: string, id: string): Promise<any>;
    triggerWorkflow(tenantId: string, eventType: string, payload: any): Promise<any>;
    enqueueWorkflowRun(tenantId: string, runId: string): Promise<any>;
    getWorkflowRuns(tenantId: string, workflowId?: string): Promise<any>;
    private evaluateConditions;
    executeWorkflowRun(tenantId: string, runId: string): Promise<any>;
    private executeStepAction;
    private resolveAssignment;
    getApprovals(tenantId: string, status?: string): Promise<any>;
    submitApproval(tenantId: string, id: string, dto: SubmitApprovalDto, userId: string): Promise<any>;
    handleEscalationJob(tenantId: string, approvalId: string): Promise<any>;
    getExceptions(tenantId: string, resolved?: boolean): Promise<any>;
    resolveException(tenantId: string, id: string): Promise<any>;
    getIntegrations(tenantId: string): Promise<any>;
    updateIntegration(tenantId: string, provider: string, status: string, config?: any): Promise<any>;
    getAuditLogs(tenantId: string, workflowId?: string): Promise<any>;
}

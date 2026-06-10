import { M08WorkflowService } from '../services/workflow.service';
export declare class M08WorkflowController {
    private readonly workflowService;
    constructor(workflowService: M08WorkflowService);
    private tenantId;
    private userId;
    private role;
    createWorkflow(body: any, req: any): Promise<any>;
    getWorkflows(req: any, isActiveStr?: string): Promise<any>;
    triggerWorkflowEvent(body: any, req: any): Promise<any>;
    getApprovals(req: any, status?: string): Promise<any>;
    submitApproval(id: string, body: any, req: any): Promise<any>;
    getExceptions(req: any, resolvedStr?: string): Promise<any>;
    resolveException(id: string, req: any): Promise<any>;
    getIntegrations(req: any): Promise<any>;
    updateIntegration(provider: string, body: any, req: any): Promise<any>;
    getAuditLogs(req: any, workflowId?: string): Promise<any>;
    getWorkflowRuns(id: string, req: any): Promise<any>;
    getWorkflowById(id: string, req: any): Promise<any>;
    updateWorkflow(id: string, body: any, req: any): Promise<any>;
}

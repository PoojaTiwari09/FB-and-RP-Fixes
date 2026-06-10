export type DriverPriority = 'high' | 'medium' | 'low';
export type DriverStatus = 'active' | 'resolved' | 'dismissed';
export type DriverType = 'action' | 'risk' | 'insight' | 'coaching';
export type WarningTypeKey = 'no_next_step' | 'single_threaded' | 'no_close_plan' | 'stale_gt14d' | 'champion_left';
export declare const WARNING_LABELS: Record<WarningTypeKey, string>;
export interface DealDriverRecord {
    id: string;
    tenantId: string;
    dealId: string;
    boardId: string | null;
    name: string;
    type: DriverType;
    status: DriverStatus;
    priority: DriverPriority;
    owner: string | null;
    dueDate: string | null;
    description: string | null;
    warningType: WarningTypeKey | null;
    createdAt: string;
    updatedAt: string;
    dealName?: string;
    boardName?: string;
}
export interface CreateDealDriverDto {
    dealId: string;
    boardId?: string;
    name: string;
    type?: DriverType;
    status?: DriverStatus;
    priority?: DriverPriority;
    owner?: string;
    dueDate?: string;
    description?: string;
    warningType?: WarningTypeKey;
}
export interface UpdateDealDriverDto {
    name?: string;
    type?: DriverType;
    status?: DriverStatus;
    priority?: DriverPriority;
    owner?: string;
    dueDate?: string | null;
    description?: string;
    warningType?: WarningTypeKey | null;
    boardId?: string;
}

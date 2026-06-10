import type { DealDriverRecord, DriverPriority, DriverStatus, DriverType, WarningTypeKey } from '../interfaces/deal-driver.types';
export declare class DealDriverEntity implements DealDriverRecord {
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
    constructor(data: DealDriverRecord);
    static fromPrisma(row: {
        id: string;
        tenantId: string;
        dealId: string;
        boardId: string | null;
        name: string;
        type: string;
        status: string;
        priority: string;
        owner: string | null;
        dueDate: Date | null;
        description: string | null;
        warningType: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): DealDriverEntity;
}

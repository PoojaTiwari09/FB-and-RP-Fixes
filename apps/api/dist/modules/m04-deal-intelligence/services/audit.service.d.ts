import { DatabaseService } from '../database/database.service';
export declare class AuditService {
    private readonly db;
    constructor(db: DatabaseService);
    log(entry: {
        userId: string;
        action: string;
        resource: string;
        resourceId?: string;
        meta?: unknown;
    }): Promise<void>;
}

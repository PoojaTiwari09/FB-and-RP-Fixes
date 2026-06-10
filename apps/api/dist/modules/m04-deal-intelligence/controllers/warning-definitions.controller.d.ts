import { DatabaseService } from '../database/database.service';
import { CreateWarningDefinitionDto, UpdateWarningDefinitionDto } from '../schemas/deal-drivers.dto';
export declare class WarningDefinitionsController {
    private readonly db;
    constructor(db: DatabaseService);
    listWarningDefinitions(): Promise<Record<string, unknown>[]>;
    createWarningDefinition(body: CreateWarningDefinitionDto, req: any): Promise<Record<string, unknown>>;
    updateWarningDefinition(id: string, body: UpdateWarningDefinitionDto, req: any): Promise<Record<string, unknown>>;
    private writeAuditLog;
}

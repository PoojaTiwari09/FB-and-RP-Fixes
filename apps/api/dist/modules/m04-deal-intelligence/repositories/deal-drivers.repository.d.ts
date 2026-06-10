import { DatabaseService } from '../database/database.service';
import { PeriodWindow } from '../entities/deal-drivers.entities';
interface BoardRow {
    id: string;
    name: string;
    description?: string;
}
interface ManagerRow {
    id: string;
    name: string;
}
interface WarningRow {
    id: string;
    label: string;
}
interface RepRow {
    id: string;
    name: string;
    managerId?: string;
}
interface DirectReportRow {
    id: string;
    name: string;
    segment: string | null;
}
interface ManagerListRow {
    id: string;
    name: string;
    role: string;
}
interface BoardWarningRow {
    warningId: string;
    sortOrder: number;
    warningKey: string;
    label: string;
}
interface LastUsedBoardRow {
    boardId: string;
}
interface DealRow {
    repId: string;
    dealId: string;
    openedAt: Date;
    closedAt: Date | null;
    accountName: string;
    amount: number;
    currency: string;
    crmStage: string;
    closeDate: Date;
}
interface WarningEventRow {
    dealId: string;
    warningId: string;
    status: string;
    triggeredAt: Date;
}
interface DealDetailRow {
    dealId: string;
    accountName: string;
    amount: number;
    currency: string;
    crmStage: string;
    closeDate: Date;
}
export declare class DealDriversRepository {
    private readonly db;
    constructor(db: DatabaseService);
    getBoardsForUser(userId: string): Promise<BoardRow[]>;
    getWarningsForBoard(boardId: string): Promise<BoardWarningRow[]>;
    getLastUsedBoard(userId: string): Promise<LastUsedBoardRow>;
    setLastUsedBoard(userId: string, boardId: string): Promise<void>;
    getManagerById(managerId: string): Promise<ManagerRow>;
    getBoardById(boardId: string): Promise<BoardRow>;
    getWarningById(warningId: string): Promise<WarningRow>;
    getRepById(repId: string): Promise<RepRow>;
    getAllManagers(): Promise<ManagerListRow[]>;
    getQualifyingDealsForTeam(repIds: string[], boardId: string, window: PeriodWindow): Promise<DealRow[]>;
    getWarningEventsForDeals(dealIds: string[], warningIds: string[]): Promise<WarningEventRow[]>;
    getDealDetails(dealIds: string[]): Promise<DealDetailRow[]>;
    checkManagerAccess(requestingUserId: string, managerId: string): Promise<boolean>;
    getDirectReports(managerId: string): Promise<DirectReportRow[]>;
    getAllManagersForUser(userId: string): Promise<Record<string, unknown>[]>;
}
export {};

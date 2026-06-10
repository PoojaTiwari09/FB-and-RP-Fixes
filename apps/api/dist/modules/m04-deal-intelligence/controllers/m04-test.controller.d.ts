import { DealRepository } from '@/repositories/deal.repository';
import { DealBoardRepository } from '@/repositories/deal-board.repository';
import { M04MemoryStore } from '../database/m04-memory.store';
export declare class M04TestController {
    private readonly deals;
    private readonly boards;
    private readonly store;
    constructor(deals: DealRepository, boards: DealBoardRepository, store: M04MemoryStore);
    health(): {
        success: boolean;
        storage: string;
        counts: {
            deals: number;
            boards: number;
            users: number;
        };
        timestamp: string;
    };
    smoke(): Promise<{
        success: boolean;
        dealCount: number;
        boardCount: number;
        sampleDealId: string;
        devUserId: string;
    }>;
}

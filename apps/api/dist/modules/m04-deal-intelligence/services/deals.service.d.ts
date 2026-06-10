import { DealBoard } from '../interfaces/hubspot.types';
export declare class DealsService {
    getMockDealBoards(): DealBoard[];
    getMockBoardDetail(boardId: string): any;
    getMockDeals(boardId: string): any[];
    getAllMockDeals(): any[];
    getMockDealById(dealId: string): any | null;
}

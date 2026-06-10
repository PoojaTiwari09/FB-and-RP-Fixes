import { HubSpotService } from './hubspot.service';
import { DealsService } from './deals.service';
import { DealMeddpiccService } from './deal-meddpicc.service';
import type { DealBoard } from '../interfaces/hubspot.types';
type DealRow = Record<string, unknown>;
export declare class DealCatalogService {
    private readonly hubSpotService;
    private readonly dealsService;
    private readonly meddpiccService;
    private readonly logger;
    constructor(hubSpotService: HubSpotService, dealsService: DealsService, meddpiccService: DealMeddpiccService);
    private calculateMeddpiccFromTexts;
    private analyzeMeddpiccFromTexts;
    private getSeededTranscripts;
    private deriveContactsFromTranscripts;
    private generateNextStep;
    private extractAnswerForCategory;
    private enrichDealWithTranscriptMeddpicc;
    loadDeals(limit?: number): Promise<{
        deals: DealRow[];
        boards: DealBoard[];
        isMock: boolean;
    }>;
    findDealById(dealId: string): Promise<DealRow>;
    resolveBoardForDeal(dealId: string): Promise<{
        boardId: string;
        boardName: string;
    } | null>;
    assertDealExists(dealId: string): Promise<DealRow>;
}
export {};

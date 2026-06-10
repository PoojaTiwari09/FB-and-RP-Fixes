import { RepDealSet } from '../entities/deal-drivers.entities';
interface RawDealRow {
    repId: string;
    dealId: string;
    openedAt: Date;
    closedAt: Date | null;
    accountName: string;
    amount: number | bigint;
    currency: string;
    crmStage: string;
    closeDate: Date;
}
export declare function computeRepDealSets(rawDeals: RawDealRow[], window: {
    start: Date;
    end: Date;
}): Map<string, RepDealSet>;
export {};

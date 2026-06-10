import { ActivationMap } from '../entities/deal-drivers.entities';
interface RawEvent {
    dealId: string;
    warningId: string;
    status: string;
    triggeredAt: Date;
}
export declare function computeWarningActivations(events: RawEvent[], window: {
    start: Date;
    end: Date;
}): ActivationMap;
export declare function countFlaggedDeals(activationMap: ActivationMap, dealIds: string[], warningId: string): number;
export {};

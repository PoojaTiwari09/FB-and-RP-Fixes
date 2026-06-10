import { DealDriversApiService } from '../services/deal-drivers-api.service';
export declare class DealDriversDealController {
    private readonly dealDrivers;
    constructor(dealDrivers: DealDriversApiService);
    listForDeal(dealId: string): Promise<{
        success: boolean;
        data: import("../interfaces/deal-driver.types").DealDriverRecord[];
    }>;
}

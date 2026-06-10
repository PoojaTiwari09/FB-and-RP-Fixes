import { M06ForecastingPredictionService } from '../services/m06.service';
export declare class M06ExecutiveController {
    private readonly service;
    constructor(service: M06ForecastingPredictionService);
    getExecutiveDashboard(tenantId: string, region?: string, baseline?: string, periodId?: string): Promise<any>;
    getExecutiveTrends(tenantId: string): Promise<any[]>;
}

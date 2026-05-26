import { M06ForecastingPredictionService } from '../services/m06.service';
export declare class M06ForecastingPredictionController {
    private readonly service;
    constructor(service: M06ForecastingPredictionService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}

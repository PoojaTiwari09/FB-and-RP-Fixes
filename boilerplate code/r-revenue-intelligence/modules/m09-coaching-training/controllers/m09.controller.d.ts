import { M09CoachingTrainingService } from '../services/m09.service';
export declare class M09CoachingTrainingController {
    private readonly service;
    constructor(service: M09CoachingTrainingService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}

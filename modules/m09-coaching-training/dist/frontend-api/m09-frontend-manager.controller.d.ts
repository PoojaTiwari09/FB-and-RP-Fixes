import { M09FrontendTrainingsService } from './m09-frontend-trainings.service';
export declare class M09FrontendManagerController {
    private readonly svc;
    constructor(svc: M09FrontendTrainingsService);
    dashboard(req: any): Promise<{
        activeTrainings: any;
        trainings: any;
    }>;
    create(body: unknown, req: any): Promise<{
        success: boolean;
        trainingId: any;
    }>;
    reassign(trainingId: string, body: unknown, req: any): Promise<{
        success: boolean;
        newTrainingId: string;
    }>;
}

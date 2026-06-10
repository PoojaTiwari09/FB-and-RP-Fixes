import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { M06ForecastingPredictionService } from '../services/m06.service';
export declare class M06ForecastingPredictionWorker extends WorkerHost {
    private readonly prisma;
    private readonly forecastingService;
    constructor(prisma: PrismaService, forecastingService: M06ForecastingPredictionService);
    process(job: Job): Promise<void>;
    private runPrediction;
    private materializeExecutive;
}

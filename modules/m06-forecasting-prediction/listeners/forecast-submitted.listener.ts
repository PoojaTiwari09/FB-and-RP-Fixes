import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { M06PredictionQueueService } from '../services/m06-prediction-queue.service';

@Injectable()
export class ForecastSubmittedListener {
  private readonly logger = new Logger(ForecastSubmittedListener.name);

  constructor(private readonly predictionQueue: M06PredictionQueueService) {}

  @OnEvent('forecast.submitted')
  async handleForecastSubmitted(envelope: {
    tenantId: string;
    payload: {
      submissionId: string;
      periodId: string;
      userId: string;
      submittedAmount: number;
      version: number;
      submittedAt?: string;
    };
  }) {
    const { tenantId, payload } = envelope;
    if (!tenantId || !payload?.periodId) return;

    this.logger.log(
      `forecast.submitted → enqueue prediction + executive snapshot (${payload.submissionId})`,
    );

    await this.predictionQueue.enqueuePrediction(
      tenantId,
      payload.periodId,
      'forecast.submitted',
      { submissionId: payload.submissionId },
    );

    await this.predictionQueue.enqueueExecutiveMaterialize(
      tenantId,
      payload.periodId,
      payload.submissionId,
      payload as unknown as Record<string, unknown>,
    );
  }
}

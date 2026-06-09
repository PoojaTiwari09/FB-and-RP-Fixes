import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { M08SalesEngagementService } from '../services/m08.service';

@Processor('m08-queue')
@Injectable()
export class M08SalesEngagementWorker extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => M08SalesEngagementService))
    private readonly service: M08SalesEngagementService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`[Queue Worker] Processing job ID ${job.id} for type: ${job.name}`);
    
    switch (job.name) {
      case 'process-auto-enrollment': {
        const { tenantId, playId, dealId, userId, triggerEventId } = job.data;
        console.log(`[Queue Worker] Initiating auto-enrollment transaction for Play ${playId}, Deal ${dealId}`);
        
        try {
          const enrollment = await this.service.enrollOpportunity({
            playId,
            dealId,
            userId,
            triggerEventId,
          }, tenantId);
          return { status: 'success', enrollmentId: enrollment.id };
        } catch (e) {
          console.error(`[Queue Worker] Failed auto-enrollment execution attempt:`, e);
          throw e; // Bubble exception for BullMQ retry handlers
        }
      }

      default: {
        console.warn(`[Queue Worker] Unknown job handler called: ${job.name}`);
        return { status: 'ignored' };
      }
    }
  }
}

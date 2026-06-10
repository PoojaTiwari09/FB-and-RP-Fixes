import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@Processor('platform-events')
export class PlatformEventsWorker extends WorkerHost {
  private readonly logger = new Logger(PlatformEventsWorker.name);

  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;
    this.logger.log(`Processing async platform event "${name}" with job ID ${job.id}`);
    
    // Broadcast locally in-process to any @OnEvent listener
    this.emitter.emit(name, data);
  }
}

import { Module }        from '@nestjs/common';
import { BullModule }    from '@nestjs/bullmq';

// Controllers
import { M01CaptureTranscriptionController } from './controllers/m01.controller';
import { CallsController }                   from './controllers/calls.controller';

// Services
import { M01CaptureTranscriptionService } from './services/m01.service';
import { CallService }                    from './services/call.service';

// Repositories
import { M01CaptureTranscriptionRepository } from './repositories/m01.repository';
import { CallRepository }                    from './repositories/call.repository';
import { TranscriptRepository }              from './repositories/transcript.repository';
import { NotesRepository }                   from './repositories/notes.repository';
import { SearchRepository, ShareRepository } from './repositories/search.repository';

// Infrastructure
import { PrismaModule }         from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

// Workers
import { M01CaptureTranscriptionWorker } from './workers/m01.worker';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm01-queue' }),
  ],
  controllers: [
    M01CaptureTranscriptionController,
    CallsController,
  ],
  providers: [
    // Services
    M01CaptureTranscriptionService,
    CallService,
    // Repositories
    M01CaptureTranscriptionRepository,
    CallRepository,
    TranscriptRepository,
    NotesRepository,
    SearchRepository,
    ShareRepository,
    // Workers
    M01CaptureTranscriptionWorker,
  ],
  exports: [
    M01CaptureTranscriptionService,
    CallService,
  ],
})
export class M01CaptureTranscriptionModule {}

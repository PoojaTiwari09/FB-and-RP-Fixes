import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { M03AiSummariesGenaiController } from './controllers/m03.controller';
import { ResearchController } from './controllers/research.controller';
import { QueryController } from './controllers/query.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { M03AiSummariesGenaiService } from './services/m03.service';
import { ResearchService } from './services/research.service';
import { ReportService } from './services/report.service';
import { QueryService } from './services/query.service';
import { FeedbackService } from './services/feedback.service';
import { CrossObjectJoinerService } from './services/cross-object-joiner.service';
import { M03AiSummariesGenaiWorker } from './workers/m03.worker';
import { M03AiSummariesGenaiRepository } from './repositories/m03.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';
import { SupabaseModule } from './config/supabase.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SupabaseModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm03-queue' }),
  ],
  controllers: [
    M03AiSummariesGenaiController,
    ResearchController,
    QueryController,
    FeedbackController,
  ],
  providers: [
    M03AiSummariesGenaiService,
    ResearchService,
    ReportService,
    QueryService,
    FeedbackService,
    CrossObjectJoinerService,
    M03AiSummariesGenaiWorker,
    M03AiSummariesGenaiRepository,
  ],
  exports: [
    M03AiSummariesGenaiService,
    ResearchService,
    QueryService,
    FeedbackService,
  ],
})
export class M03AiSummariesGenaiModule {}

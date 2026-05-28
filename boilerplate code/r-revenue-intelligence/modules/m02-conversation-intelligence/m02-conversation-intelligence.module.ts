import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceController } from './controllers/m02.controller';
import { TrackerController } from './controllers/tracker.controller';
import { TopicManagementController } from './controllers/topic-management.controller';
import { TopicTagController } from './controllers/topic-tag.controller';
import { TranslationController } from './controllers/translation.controller';
import { VocabularyCorrectionController } from './controllers/vocabulary-correction.controller';
import { ConversationIngestController } from './controllers/ingest.controller';
import { ConversationIngestService } from './services/ingest.service';
import { M02ConversationIntelligenceService } from './services/m02.service';
import { HybridSearchService } from './services/hybrid-search.service';
import { TrackerService } from './services/tracker.service';
import { TopicManagementService } from './services/topic-management.service';
import { TopicTagService } from './services/topic-tag.service';
import { TopicTaggingService } from './services/topic-tagging.service';
import { AiTopicTaggerService } from './services/ai-topic-tagger.service';
import { TranslationService } from './services/translation.service';
import { VocabularyCorrectionService } from './services/vocabulary-correction.service';
import { M02ConversationIntelligenceRepository } from './repositories/m02.repository';
import { TopicRepository } from './repositories/topic.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [PrismaModule, EventPublisherModule],
  controllers: [
    M02ConversationIntelligenceController,
    TrackerController,
    TopicManagementController,
    TopicTagController,
    TranslationController,
    VocabularyCorrectionController,
    ConversationIngestController,
  ],
  providers: [
    ConversationIngestService,
    // Application services
    M02ConversationIntelligenceService,
    HybridSearchService,
    TrackerService,
    TopicManagementService,
    TopicTagService,         // CRUD
    TopicTaggingService,     // orchestrator
    AiTopicTaggerService,    // AI provider client
    TranslationService,
    VocabularyCorrectionService,
    // Repositories
    M02ConversationIntelligenceRepository,
    TopicRepository,
  ],
  exports: [
    M02ConversationIntelligenceService,
    HybridSearchService,
    TrackerService,
    TopicManagementService,
    TopicTaggingService,
    AiTopicTaggerService,
    TranslationService,
    VocabularyCorrectionService,
    M02ConversationIntelligenceRepository,
    TopicRepository,
  ],
})
export class M02ConversationIntelligenceModule {}

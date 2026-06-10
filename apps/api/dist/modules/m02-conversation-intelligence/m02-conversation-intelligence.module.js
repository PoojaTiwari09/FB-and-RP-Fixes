"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02ConversationIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const m02_controller_1 = require("./controllers/m02.controller");
const tracker_controller_1 = require("./controllers/tracker.controller");
const topic_management_controller_1 = require("./controllers/topic-management.controller");
const topic_tag_controller_1 = require("./controllers/topic-tag.controller");
const translation_controller_1 = require("./controllers/translation.controller");
const vocabulary_correction_controller_1 = require("./controllers/vocabulary-correction.controller");
const ingest_controller_1 = require("./controllers/ingest.controller");
const m02_frontend_search_controller_1 = require("./controllers/m02-frontend-search.controller");
const m02_frontend_call_reviews_controller_1 = require("./controllers/m02-frontend-call-reviews.controller");
const m02_frontend_trackers_controller_1 = require("./controllers/m02-frontend-trackers.controller");
const m02_frontend_trackers_service_1 = require("./services/m02-frontend-trackers.service");
const m02_frontend_call_reviews_service_1 = require("./services/m02-frontend-call-reviews.service");
const m02_frontend_search_service_1 = require("./services/m02-frontend-search.service");
const ingest_service_1 = require("./services/ingest.service");
const m02_service_1 = require("./services/m02.service");
const hybrid_search_service_1 = require("./services/hybrid-search.service");
const tracker_service_1 = require("./services/tracker.service");
const topic_management_service_1 = require("./services/topic-management.service");
const topic_tag_service_1 = require("./services/topic-tag.service");
const topic_tagging_service_1 = require("./services/topic-tagging.service");
const ai_topic_tagger_service_1 = require("./services/ai-topic-tagger.service");
const translation_service_1 = require("./services/translation.service");
const vocabulary_correction_service_1 = require("./services/vocabulary-correction.service");
const m02_repository_1 = require("./repositories/m02.repository");
const topic_repository_1 = require("./repositories/topic.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M02ConversationIntelligenceModule = class M02ConversationIntelligenceModule {
};
exports.M02ConversationIntelligenceModule = M02ConversationIntelligenceModule;
exports.M02ConversationIntelligenceModule = M02ConversationIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, event_publisher_module_1.EventPublisherModule],
        controllers: [
            m02_controller_1.M02ConversationIntelligenceController,
            tracker_controller_1.TrackerController,
            topic_management_controller_1.TopicManagementController,
            topic_tag_controller_1.TopicTagController,
            translation_controller_1.TranslationController,
            vocabulary_correction_controller_1.VocabularyCorrectionController,
            ingest_controller_1.ConversationIngestController,
            m02_frontend_search_controller_1.M02FrontendSearchController,
            m02_frontend_search_controller_1.M02FrontendFiltersController,
            m02_frontend_search_controller_1.M02FrontendCallsActionsController,
            m02_frontend_search_controller_1.M02FrontendStreamsController,
            m02_frontend_call_reviews_controller_1.M02FrontendCallReviewsController,
            m02_frontend_call_reviews_controller_1.M02FrontendManagerCallsController,
            m02_frontend_call_reviews_controller_1.M02FrontendScorecardsController,
            m02_frontend_call_reviews_controller_1.M02FrontendUsersController,
            m02_frontend_call_reviews_controller_1.M02FrontendMetaController,
            m02_frontend_call_reviews_controller_1.M02FrontendAnalyticsController,
            m02_frontend_trackers_controller_1.M02FrontendTrackersController,
        ],
        providers: [
            m02_frontend_search_service_1.M02FrontendSearchService,
            m02_frontend_call_reviews_service_1.M02FrontendCallReviewsService,
            m02_frontend_trackers_service_1.M02FrontendTrackersService,
            ingest_service_1.ConversationIngestService,
            m02_service_1.M02ConversationIntelligenceService,
            hybrid_search_service_1.HybridSearchService,
            tracker_service_1.TrackerService,
            topic_management_service_1.TopicManagementService,
            topic_tag_service_1.TopicTagService,
            topic_tagging_service_1.TopicTaggingService,
            ai_topic_tagger_service_1.AiTopicTaggerService,
            translation_service_1.TranslationService,
            vocabulary_correction_service_1.VocabularyCorrectionService,
            m02_repository_1.M02ConversationIntelligenceRepository,
            topic_repository_1.TopicRepository,
        ],
        exports: [
            m02_service_1.M02ConversationIntelligenceService,
            hybrid_search_service_1.HybridSearchService,
            tracker_service_1.TrackerService,
            topic_management_service_1.TopicManagementService,
            topic_tagging_service_1.TopicTaggingService,
            ai_topic_tagger_service_1.AiTopicTaggerService,
            translation_service_1.TranslationService,
            vocabulary_correction_service_1.VocabularyCorrectionService,
            m02_repository_1.M02ConversationIntelligenceRepository,
            topic_repository_1.TopicRepository,
        ],
    })
], M02ConversationIntelligenceModule);
//# sourceMappingURL=m02-conversation-intelligence.module.js.map
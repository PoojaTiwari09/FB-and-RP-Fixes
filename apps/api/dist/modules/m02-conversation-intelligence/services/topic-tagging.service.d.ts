import { TopicRepository } from '../repositories/topic.repository';
import { AiTopicTaggerService } from './ai-topic-tagger.service';
export declare class TopicTaggingService {
    private readonly topicRepository;
    private readonly aiTagger;
    private readonly logger;
    constructor(topicRepository: TopicRepository, aiTagger: AiTopicTaggerService);
    processTranscript(tenantId: string, transcriptText: string, callId: string): Promise<void>;
    batchProcessTranscripts(tenantId: string, limit?: number): Promise<void>;
    private getDefaultTopics;
}

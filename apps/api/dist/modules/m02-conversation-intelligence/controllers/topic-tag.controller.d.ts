import { TopicTagService } from '../services/topic-tag.service';
import { TopicTaggingService } from '../services/topic-tagging.service';
export declare class TopicTagController {
    private readonly topicTagService;
    private readonly topicTaggingService;
    constructor(topicTagService: TopicTagService, topicTaggingService: TopicTaggingService);
    getTagsForConversation(id: string): Promise<import("../repositories/topic.repository").TopicTag[]>;
    addManualTag(req: Record<string, any>, conversationId: string, topicName: string, explanation?: string): Promise<import("../repositories/topic.repository").TopicTag>;
    deleteTag(tagId: string): Promise<void>;
    batchTagTranscripts(req: Record<string, any>, limit?: number): Promise<void>;
}

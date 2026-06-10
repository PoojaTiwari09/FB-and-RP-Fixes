import { TopicRepository, TopicTag } from '../repositories/topic.repository';
export declare class TopicTagService {
    private readonly topicRepository;
    constructor(topicRepository: TopicRepository);
    getTagsForConversation(conversationId: string): Promise<TopicTag[]>;
    addManualTag(tenantId: string, conversationId: string, topicName: string, explanation?: string): Promise<TopicTag>;
    deleteTag(tagId: string): Promise<void>;
    deleteTagsForConversation(conversationId: string): Promise<void>;
}

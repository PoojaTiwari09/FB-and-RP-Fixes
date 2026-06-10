import { TopicManagementService } from '../services/topic-management.service';
import { TopicDefinition } from '../repositories/topic.repository';
export declare class TopicManagementController {
    private readonly topicManagementService;
    constructor(topicManagementService: TopicManagementService);
    createTopicModel(req: Record<string, any>, topics: TopicDefinition[], type?: string): Promise<import("../repositories/topic.repository").TopicModel>;
    getTopicModels(req: Record<string, any>): Promise<import("../repositories/topic.repository").TopicModel[]>;
    deleteTopicModel(id: string): Promise<void>;
    addTopicToModel(req: Record<string, any>, body: any): Promise<import("../repositories/topic.repository").TopicModel>;
    removeTopic(req: Record<string, any>, topicName: string): Promise<import("../repositories/topic.repository").TopicModel>;
    seedDefaultTopics(req: Record<string, any>): Promise<import("../repositories/topic.repository").TopicModel | {
        message: string;
        models: import("../repositories/topic.repository").TopicModel[];
    }>;
}

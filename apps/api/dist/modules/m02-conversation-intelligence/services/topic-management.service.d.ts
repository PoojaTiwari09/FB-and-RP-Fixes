import { TopicRepository, TopicDefinition, TopicModel } from '../repositories/topic.repository';
import { PrismaService } from '../database/prisma.service';
export declare class TopicManagementService {
    private readonly topicRepository;
    private readonly prisma;
    private readonly logger;
    constructor(topicRepository: TopicRepository, prisma: PrismaService);
    createTopicModel(tenantId: string, topics: TopicDefinition[], type?: string): Promise<TopicModel>;
    getTopicModels(tenantId: string): Promise<TopicModel[]>;
    deleteTopicModel(id: string): Promise<void>;
    updateTopicModel(id: string, topics: TopicDefinition[]): Promise<TopicModel>;
    addTopicToModel(tenantId: string, topicPayload: TopicDefinition): Promise<TopicModel>;
    removeTopicFromModel(tenantId: string, topicName: string): Promise<TopicModel | null>;
}

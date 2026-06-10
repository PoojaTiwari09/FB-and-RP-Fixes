import { PrismaService } from '../database/prisma.service';
export interface TopicDefinition {
    name: string;
    description?: string;
    color?: string;
    speakerScope?: string;
    callTypes?: string[];
    keywords?: string[];
    linkedTrackerId?: string;
    isActive?: boolean;
}
export interface TopicModel {
    id: string;
    tenantId: string;
    topics: any[];
    type: string;
    lastTrainedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface TopicTag {
    id: string;
    callId?: string;
    emailId?: string;
    tenantId: string;
    topicName: string;
    source: string;
    confidenceScore: number;
    explanation?: string;
    evidenceSnippet?: string;
    createdAt: Date;
}
export interface CreateTopicModelDto {
    tenantId: string;
    topics: any[];
    type?: string;
}
export interface CreateTopicTagDto {
    callId?: string;
    emailId?: string;
    tenantId: string;
    topicName: string;
    source: string;
    confidenceScore: number;
    explanation?: string;
    evidenceSnippet?: string;
}
export declare class TopicRepository {
    private readonly prisma;
    private static topicModels;
    private static topicTags;
    constructor(prisma: PrismaService);
    private isDbAvailable;
    createTopicModel(dto: CreateTopicModelDto): Promise<TopicModel>;
    getTopicModels(tenantId: string): Promise<TopicModel[]>;
    getTopicModelById(id: string): Promise<TopicModel | null>;
    deleteTopicModel(id: string): Promise<void>;
    updateTopicModel(id: string, topics: any[]): Promise<TopicModel>;
    createTopicTag(dto: CreateTopicTagDto): Promise<TopicTag>;
    getTagsForConversation(conversationId: string): Promise<TopicTag[]>;
    getTagsForTenant(tenantId: string): Promise<TopicTag[]>;
    deleteTag(tagId: string): Promise<void>;
    deleteTagsForConversation(conversationId: string): Promise<void>;
    getUntaggedConversations(tenantId: string, limit?: number): Promise<any[]>;
    getConversationById(conversationId: string): Promise<any>;
}

export interface TopicTagCandidate {
    topicName: string;
    confidenceScore: number;
    source: 'aimodel' | 'manual';
    explanation?: string;
    evidenceSnippet?: string;
}
export interface TopicDefinition {
    name: string;
    description?: string;
}
export interface TranscriptAnalysisResult {
    summary: string;
    competitors: string[];
}
export declare class AiTopicTaggerService {
    private readonly logger;
    tagTranscript(transcriptText: string, topicDefinitions: TopicDefinition[]): Promise<TopicTagCandidate[]>;
    private tryGroq;
    private tryGemini;
    private normalizeTopicName;
    private normalizeConfidence;
    deduplicateAndFilterTopics(candidates: TopicTagCandidate[], threshold?: number): TopicTagCandidate[];
    private keywordBasedTagging;
    analyzeSummaryAndCompetitors(transcriptText: string): Promise<TranscriptAnalysisResult>;
    private tryGroqAnalysis;
    private tryGeminiAnalysis;
}

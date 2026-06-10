import { PrismaService } from '../database/prisma.service';
import { SearchResult, ConversationRecord } from '../interfaces/search.interface';
export declare class HybridSearchService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    get semanticBackend(): 'simulated' | 'pgvector' | 'postgres-fts';
    private stem;
    private levenshtein;
    private wordsMatch;
    private fuzzyIndexOf;
    blendHybridResults(textResults: SearchResult[], semanticResults: SearchResult[], textWeight?: number, semanticWeight?: number): SearchResult[];
    simulateTextSearch(corpus: ConversationRecord[], query: string): SearchResult[];
    private executePostgresFtsSearch;
    simulateSemanticSearch(corpus: ConversationRecord[], query: string): SearchResult[];
    private executePgvectorSearch;
    executeTextSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]>;
    private syncMeilisearchIndex;
    executeSemanticSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]>;
}

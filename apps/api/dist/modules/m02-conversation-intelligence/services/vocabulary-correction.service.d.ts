import { PrismaService } from '../database/prisma.service';
export interface VocabularyRule {
    vocabId: string;
    incorrectTerm: string;
    correctTerm: string;
    language: string;
    isActive: boolean;
}
export declare class VocabularyCorrectionService {
    private prisma;
    private readonly logger;
    private static mockRules;
    private static mockCorrections;
    constructor(prisma: PrismaService);
    createRule(tenantId: string, incorrectTerm: string, correctTerm: string, language?: string, category?: string, mispronunciations?: string[], variations?: string[]): Promise<any>;
    getRules(tenantId: string): Promise<any>;
    deleteRule(id: string, tenantId: string): Promise<any>;
    getStats(tenantId: string): Promise<{
        termsCount: any;
        correctionsThisMonth: any;
        enhancedPercent: number;
    }>;
    applyVocabularyCorrections(rawText: string, rules: VocabularyRule[]): {
        correctedText: string;
        appliedRules: {
            originalTerm: string;
            correctedTerm: string;
        }[];
    };
    correctTranscript(transcriptId: string, type: 'call' | 'email', tenantId: string): Promise<string>;
}

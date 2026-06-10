import { VocabularyCorrectionService } from '../services/vocabulary-correction.service';
export declare class VocabularyCorrectionController {
    private readonly vocabService;
    constructor(vocabService: VocabularyCorrectionService);
    createRule(req: Record<string, any>, body: {
        incorrectTerm: string;
        correctTerm: string;
        language?: string;
        category?: string;
        mispronunciations?: string[];
        variations?: string[];
    }): Promise<any>;
    getRules(req: Record<string, any>): Promise<any>;
    getStats(req: Record<string, any>): Promise<{
        termsCount: any;
        correctionsThisMonth: any;
        enhancedPercent: number;
    }>;
    deleteRule(req: Record<string, any>, id: string): Promise<any>;
}

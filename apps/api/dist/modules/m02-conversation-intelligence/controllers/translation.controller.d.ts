import { TranslationService } from '../services/translation.service';
export declare class TranslationController {
    private readonly translationService;
    constructor(translationService: TranslationService);
    translateContent(req: Record<string, any>, body: {
        text: string;
        sourceLang: string;
        targetLang: string;
        entityType?: string;
        entityId?: string;
    }): Promise<{
        translatedText: any;
    }>;
    getSettings(req: Record<string, any>): Promise<{
        defaultLanguage: any;
        fallbackLanguage: any;
        supportedLanguages: any;
    }>;
    updateSettings(req: Record<string, any>, body: {
        defaultLanguage?: string;
        fallbackLanguage?: string;
        supportedLanguages?: string[];
    }): Promise<any>;
}

import { PrismaService } from '../database/prisma.service';
export declare class TranslationService {
    private prisma;
    private readonly logger;
    private readonly libreTranslateUrl;
    constructor(prisma: PrismaService);
    translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
    translateBulk(texts: string[], sourceLang: string, targetLang: string): Promise<{
        translated: string[];
        fallback: boolean;
    }>;
    getTranslatedEntity(tenantId: string, entityType: string, entityId: string, sourceLang: string, targetLang: string, originalText: string): Promise<any>;
    private static workspaceSettings;
    private get workspaceDelegate();
    getWorkspaceSettings(tenantId: string): Promise<{
        defaultLanguage: any;
        fallbackLanguage: any;
        supportedLanguages: any;
    }>;
    updateWorkspaceSettings(tenantId: string, data: {
        defaultLanguage?: string;
        fallbackLanguage?: string;
        supportedLanguages?: string[];
    }): Promise<any>;
}

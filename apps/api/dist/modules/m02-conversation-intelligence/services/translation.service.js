"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let TranslationService = class TranslationService {
    static { TranslationService_1 = this; }
    prisma;
    logger = new common_1.Logger(TranslationService_1.name);
    libreTranslateUrl = 'https://libretranslate.de/translate';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async translate(text, sourceLang, targetLang) {
        const safeText = text || '';
        this.logger.log(`[TRANSLATE REQ] Source: ${sourceLang} | Target: ${targetLang} | Text: "${safeText.substring(0, 50)}..."`);
        if (!safeText)
            return '';
        try {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) {
                throw new Error('GROQ_API_KEY is not defined in environment variables');
            }
            console.log(`[Translation DEBUG] Attempting to translate using Groq API...`);
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{
                            role: 'user',
                            content: `Translate the following text to ${targetLang}. Return ONLY the translated text without any explanation, markdown, or quotes:\n\n${safeText}`
                        }],
                    temperature: 0.3
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Translation DEBUG] Groq API returned error: ${response.status} - ${errorText}`);
                throw new Error(`Groq API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const translatedResult = data.choices[0].message.content.trim();
                this.logger.log(`[TRANSLATE RES] Translated Text: "${translatedResult.substring(0, 50)}..."`);
                console.log(`[Translation DEBUG] Success! Translation: ${translatedResult.substring(0, 50)}...`);
                return translatedResult;
            }
            else {
                console.error(`[Translation DEBUG] Unexpected Groq response format:`, data);
                throw new Error('Invalid translation response from Groq');
            }
        }
        catch (error) {
            console.error(`[Translation DEBUG] Caught error in translation:`, error);
            this.logger.error(`[TRANSLATE ERR] API Call failed: ${error.message}. Using mock fallback.`);
            const mockedTranslation = `[${targetLang.toUpperCase()}] ${safeText}`;
            this.logger.log(`[TRANSLATE RES (Fallback)] Translated Text: "${mockedTranslation.substring(0, 50)}..."`);
            return mockedTranslation;
        }
    }
    async translateBulk(texts, sourceLang, targetLang) {
        if (!texts || texts.length === 0)
            return { translated: [], fallback: false };
        if (sourceLang === targetLang)
            return { translated: texts, fallback: false };
        try {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey)
                throw new Error('GROQ_API_KEY missing');
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{
                            role: 'user',
                            content: `Translate the following list of texts from ${sourceLang} to ${targetLang}. Return ONLY a valid JSON array of strings in the exact same order. Do NOT include markdown code blocks, do NOT include explanations. Just the JSON array: \n\n${JSON.stringify(texts)}`
                        }],
                    temperature: 0.1
                })
            });
            if (!response.ok)
                throw new Error(`Groq API error: ${response.statusText}`);
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                let content = data.choices[0].message.content.trim();
                if (content.startsWith('```json'))
                    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                if (content.startsWith('```'))
                    content = content.replace(/```/g, '').trim();
                const translatedArray = JSON.parse(content);
                if (Array.isArray(translatedArray) && translatedArray.length === texts.length) {
                    return { translated: translatedArray, fallback: false };
                }
            }
            throw new Error('Invalid JSON array from LLM');
        }
        catch (error) {
            this.logger.error(`[TRANSLATE BULK ERR] ${error.message}. Falling back.`);
            return { translated: texts.map(t => `[${targetLang.toUpperCase()}] ${t}`), fallback: true };
        }
    }
    async getTranslatedEntity(tenantId, entityType, entityId, sourceLang, targetLang, originalText) {
        if (sourceLang === targetLang)
            return originalText;
        let existing = null;
        try {
            if (this.prisma && this.prisma.m02TranslatedText) {
                existing = await this.prisma.m02TranslatedText.findFirst({
                    where: { tenantId, entityType, entityId, targetLanguage: targetLang }
                });
            }
        }
        catch (e) {
            this.logger.warn(`Failed to query cache (DB out of sync?): ${e.message}`);
        }
        if (existing) {
            this.logger.log(`[CACHE HIT] Found translation in DB for ${entityType} ${entityId}`);
            return existing.translatedText;
        }
        this.logger.log(`[CACHE MISS] Translating ${entityType} ${entityId} to ${targetLang}`);
        const translatedText = await this.translate(originalText, sourceLang, targetLang);
        try {
            if (this.prisma && this.prisma.m02TranslatedText) {
                await this.prisma.m02TranslatedText.create({
                    data: {
                        tenantId,
                        entityType,
                        entityId,
                        sourceLanguage: sourceLang,
                        targetLanguage: targetLang,
                        originalText: originalText || '',
                        translatedText,
                        qualityStatus: 'success'
                    }
                });
            }
        }
        catch (e) {
            this.logger.warn(`Failed to cache translation in DB: ${e.message}`);
        }
        return translatedText;
    }
    static workspaceSettings = new Map();
    get workspaceDelegate() {
        return (this.prisma?.m02WorkspaceLanguageSettings ??
            this.prisma?.workspaceLanguageSettings ??
            null);
    }
    async getWorkspaceSettings(tenantId) {
        const delegate = this.workspaceDelegate;
        if (delegate?.findUnique) {
            try {
                let settings = await delegate.findUnique({ where: { tenantId } });
                if (!settings) {
                    settings = await delegate.create({
                        data: {
                            tenantId,
                            defaultLanguage: 'English',
                            fallbackLanguage: 'English',
                            supportedLanguages: ['English'],
                        },
                    });
                }
                return {
                    defaultLanguage: settings.defaultLanguage,
                    fallbackLanguage: settings.fallbackLanguage,
                    supportedLanguages: Array.isArray(settings.supportedLanguages)
                        ? settings.supportedLanguages
                        : JSON.parse(settings.supportedLanguages || '["English"]'),
                };
            }
            catch (err) {
                this.logger.warn(`getWorkspaceSettings via Prisma failed (${err.message}); using memory store`);
            }
        }
        const existing = TranslationService_1.workspaceSettings.get(tenantId);
        if (existing)
            return existing;
        const defaults = {
            defaultLanguage: 'English',
            fallbackLanguage: 'English',
            supportedLanguages: ['English'],
        };
        TranslationService_1.workspaceSettings.set(tenantId, defaults);
        return defaults;
    }
    async updateWorkspaceSettings(tenantId, data) {
        const delegate = this.workspaceDelegate;
        if (delegate?.upsert) {
            try {
                const updated = await delegate.upsert({
                    where: { tenantId },
                    update: {
                        ...(data.defaultLanguage && { defaultLanguage: data.defaultLanguage }),
                        ...(data.fallbackLanguage && { fallbackLanguage: data.fallbackLanguage }),
                        ...(data.supportedLanguages && { supportedLanguages: data.supportedLanguages }),
                    },
                    create: {
                        tenantId,
                        defaultLanguage: data.defaultLanguage || 'English',
                        fallbackLanguage: data.fallbackLanguage || 'English',
                        supportedLanguages: data.supportedLanguages || ['English'],
                    },
                });
                return updated;
            }
            catch (err) {
                this.logger.warn(`updateWorkspaceSettings via Prisma failed (${err.message}); using memory store`);
            }
        }
        const current = TranslationService_1.workspaceSettings.get(tenantId) ?? {
            defaultLanguage: 'English',
            fallbackLanguage: 'English',
            supportedLanguages: ['English'],
        };
        const next = {
            defaultLanguage: data.defaultLanguage ?? current.defaultLanguage,
            fallbackLanguage: data.fallbackLanguage ?? current.fallbackLanguage,
            supportedLanguages: data.supportedLanguages ?? current.supportedLanguages,
        };
        TranslationService_1.workspaceSettings.set(tenantId, next);
        return next;
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = TranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TranslationService);
//# sourceMappingURL=translation.service.js.map
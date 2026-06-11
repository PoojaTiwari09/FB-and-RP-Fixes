import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  // Using a public instance of LibreTranslate for demo. In production, this would be self-hosted or authenticated.
  private readonly libreTranslateUrl = 'https://libretranslate.de/translate'; 

  constructor(private prisma: PrismaService) {}

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const safeText = text || '';
    this.logger.log(`[TRANSLATE REQ] Source: ${sourceLang} | Target: ${targetLang} | Text: "${safeText.substring(0, 50)}..."`);
    
    if (!safeText) return '';

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
      
      if ((data as any).choices && (data as any).choices[0] && (data as any).choices[0].message) {
        const translatedResult = (data as any).choices[0].message.content.trim();
        this.logger.log(`[TRANSLATE RES] Translated Text: "${translatedResult.substring(0, 50)}..."`);
        console.log(`[Translation DEBUG] Success! Translation: ${translatedResult.substring(0, 50)}...`);
        return translatedResult;
      } else {
        console.error(`[Translation DEBUG] Unexpected Groq response format:`, data);
        throw new Error('Invalid translation response from Groq');
      }
    } catch (error) {
      console.error(`[Translation DEBUG] Caught error in translation:`, error);
      this.logger.error(`[TRANSLATE ERR] API Call failed: ${(error as Error).message}. Using mock fallback.`);
      const mockedTranslation = `[${targetLang.toUpperCase()}] ${safeText}`;
      this.logger.log(`[TRANSLATE RES (Fallback)] Translated Text: "${mockedTranslation.substring(0, 50)}..."`);
      return mockedTranslation;
    }
  }

  async translateBulk(texts: string[], sourceLang: string, targetLang: string): Promise<{ translated: string[], fallback: boolean }> {
    if (!texts || texts.length === 0) return { translated: [], fallback: false };
    if (sourceLang === targetLang) return { translated: texts, fallback: false };

    try {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) throw new Error('GROQ_API_KEY missing');

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

      if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
      
      const data = await response.json();
      if ((data as any).choices && (data as any).choices[0] && (data as any).choices[0].message) {
        let content = (data as any).choices[0].message.content.trim();
        // clean markdown if llm ignored prompt
        if (content.startsWith('```json')) content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        if (content.startsWith('```')) content = content.replace(/```/g, '').trim();

        const translatedArray = JSON.parse(content);
        if (Array.isArray(translatedArray) && translatedArray.length === texts.length) {
          return { translated: translatedArray, fallback: false };
        }
      }
      throw new Error('Invalid JSON array from LLM');
    } catch (error) {
      this.logger.error(`[TRANSLATE BULK ERR] ${(error as Error).message}. Falling back.`);
      return { translated: texts.map(t => `[${targetLang.toUpperCase()}] ${t}`), fallback: true };
    }
  }

  async getTranslatedEntity(tenantId: string, entityType: string, entityId: string, sourceLang: string, targetLang: string, originalText: string) {
    if (sourceLang === targetLang) return originalText;

    // Check DB for existing translation
    let existing = null;
    try {
      if (this.prisma && this.prisma.m02TranslatedText) {
        existing = await this.prisma.m02TranslatedText.findFirst({
          where: { tenantid: tenantId, entityType, entityId, targetLanguage: targetLang }
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to query cache (DB out of sync?): ${(e as Error).message}`);
    }

    if (existing) {
      this.logger.log(`[CACHE HIT] Found translation in DB for ${entityType} ${entityId}`);
      return existing.translatedText;
    }

    this.logger.log(`[CACHE MISS] Translating ${entityType} ${entityId} to ${targetLang}`);
    const translatedText = await this.translate(originalText, sourceLang, targetLang);

    // Cache in DB
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
    } catch (e) {
      this.logger.warn(`Failed to cache translation in DB: ${(e as Error).message}`);
    }

    return translatedText;
  }

  // In-memory store for workspace language preferences when the M02 Prisma
  // delegate isn't available on the unified client. Keyed by tenantId.
  private static workspaceSettings: Map<string, {
    defaultLanguage: string;
    fallbackLanguage: string;
    supportedLanguages: string[];
  }> = new Map();

  private get workspaceDelegate(): any | null {
    return (
      (this.prisma as any)?.m02WorkspaceLanguageSettings ??
      (this.prisma as any)?.workspaceLanguageSettings ??
      null
    );
  }

  async getWorkspaceSettings(tenantId: string) {
    const delegate = this.workspaceDelegate;
    if (delegate?.findUnique) {
      try {
        let settings = await delegate.findUnique({ where: { tenantid: tenantId } });
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
            : JSON.parse((settings.supportedLanguages as string) || '["English"]'),
        };
      } catch (err: any) {
        this.logger.warn(`getWorkspaceSettings via Prisma failed (${err.message}); using memory store`);
      }
    }

    const existing = TranslationService.workspaceSettings.get(tenantId);
    if (existing) return existing;
    const defaults = {
      defaultLanguage: 'English',
      fallbackLanguage: 'English',
      supportedLanguages: ['English'],
    };
    TranslationService.workspaceSettings.set(tenantId, defaults);
    return defaults;
  }

  async updateWorkspaceSettings(
    tenantId: string,
    data: { defaultLanguage?: string; fallbackLanguage?: string; supportedLanguages?: string[] },
  ) {
    const delegate = this.workspaceDelegate;
    if (delegate?.upsert) {
      try {
        const updated = await delegate.upsert({
          where: { tenantid: tenantId },
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
      } catch (err: any) {
        this.logger.warn(`updateWorkspaceSettings via Prisma failed (${err.message}); using memory store`);
      }
    }

    const current = TranslationService.workspaceSettings.get(tenantId) ?? {
      defaultLanguage: 'English',
      fallbackLanguage: 'English',
      supportedLanguages: ['English'],
    };
    const next = {
      defaultLanguage: data.defaultLanguage ?? current.defaultLanguage,
      fallbackLanguage: data.fallbackLanguage ?? current.fallbackLanguage,
      supportedLanguages: data.supportedLanguages ?? current.supportedLanguages,
    };
    TranslationService.workspaceSettings.set(tenantId, next);
    return next;
  }
}

import { Controller, Post, Body, Get, Param, Headers, Query, UseInterceptors } from '@nestjs/common';
import { TranslationService } from '../services/translation.service';

@Controller('api/v1/m02-conversation-intelligence/translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  async translateContent(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { 
      text: string; 
      sourceLang: string; 
      targetLang: string; 
      entityType?: string; 
      entityId?: string; 
    }
  ) {
    try {
      if (!tenantId) {
          tenantId = '00000000-0000-0000-0000-000000000001'; // Default for demo
      }

      if (body.entityType && body.entityId) {
        const translated = await this.translationService.getTranslatedEntity(
          tenantId,
          body.entityType,
          body.entityId,
          body.sourceLang || 'en',
          body.targetLang,
          body.text
        );
        return { translatedText: translated };
      }

      // Direct translation without caching
      const translated = await this.translationService.translate(
        body.text,
        body.sourceLang || 'en',
        body.targetLang
      );
      return { translatedText: translated };
    } catch (err: any) {
      return { translatedText: `[ERROR] ${err.message}\n${err.stack}` };
    }
  }

  @Get('settings')
  async getSettings(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) tenantId = '00000000-0000-0000-0000-000000000001';
    return this.translationService.getWorkspaceSettings(tenantId);
  }

  @Post('settings')
  async updateSettings(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { defaultLanguage?: string; fallbackLanguage?: string; supportedLanguages?: string[] }
  ) {
    if (!tenantId) tenantId = '00000000-0000-0000-0000-000000000001';
    return this.translationService.updateWorkspaceSettings(tenantId, body);
  }
}

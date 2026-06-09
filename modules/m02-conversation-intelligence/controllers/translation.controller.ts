import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { TranslationService } from '../services/translation.service';

/**
 * Translation surface — translates utterances / emails into a target language and
 * persists workspace-level language preferences.
 *
 * `TenantGuard` is enforced at the class level; no fallback tenant value remains.
 */
@Controller('api/v1/m02-conversation-intelligence/translate')
@UseGuards(TenantGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  async translateContent(
    @Req() req: Record<string, any>,
    @Body() body: {
      text: string;
      sourceLang: string;
      targetLang: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    try {
      if (body.entityType && body.entityId) {
        const translated = await this.translationService.getTranslatedEntity(
          req.tenantId,
          body.entityType,
          body.entityId,
          body.sourceLang || 'en',
          body.targetLang,
          body.text,
        );
        return { translatedText: translated };
      }

      const translated = await this.translationService.translate(
        body.text,
        body.sourceLang || 'en',
        body.targetLang,
      );
      return { translatedText: translated };
    } catch (err: any) {
      throw new HttpException(
        { message: 'Translation failed', detail: err?.message ?? String(err) },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('settings')
  async getSettings(@Req() req: Record<string, any>) {
    return this.translationService.getWorkspaceSettings(req.tenantId);
  }

  @Post('settings')
  async updateSettings(
    @Req() req: Record<string, any>,
    @Body() body: { defaultLanguage?: string; fallbackLanguage?: string; supportedLanguages?: string[] },
  ) {
    return this.translationService.updateWorkspaceSettings(req.tenantId, body);
  }
}

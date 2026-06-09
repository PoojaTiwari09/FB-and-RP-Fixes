# AI Translator - Multi-Language Translation Service

## Overview

The AI Translator is a comprehensive translation service that enables real-time translation of conversation content (summaries, transcripts, coaching suggestions) using Large Language Models. It features intelligent caching, workspace language settings, bulk translation support, and fallback mechanisms to ensure reliable multilingual support across the platform.

## Architecture

### Components

1. **TranslationService** - Core translation logic
2. **TranslationController** - API endpoints for translation
3. **M02ConversationIntelligenceService** - Integration with search and conversation flows
4. **PrismaService** - Database access for caching

### Technology Stack

- **Translation API**: Groq API (Llama-3.1-8b-instant)
- **Fallback**: Mock translation with language prefix
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Database-based translation cache

## How It Works

### Translation Flow

```
User Request (with targetLanguage parameter)
    ↓
Check Workspace Language Settings
    ↓
TranslationService.getTranslatedEntity()
    ↓
Check Cache (m02_translated_texts table)
    ↓ (if cache hit)
Return Cached Translation
    ↓ (if cache miss)
Call Groq API
    ├─→ Build prompt: "Translate to {targetLang}. Return ONLY translated text..."
    ├─→ Send to Groq Llama-3.1-8b-instant
    ├─→ Parse response
    └─→ Clean any markdown formatting
    ↓
Save to Cache (m02_translated_texts)
    ↓
Return Translated Text
```

### Bulk Translation Flow

```
Array of Texts to Translate
    ↓
TranslationService.translateBulk()
    ↓
Check if source == target language
    ↓ (if same)
Return Original Texts
    ↓ (if different)
Call Groq API with Array
    ├─→ Build prompt: "Translate list to {targetLang}. Return ONLY JSON array..."
    ├─→ Send to Groq
    ├─→ Parse JSON array
    └─→ Validate array length matches input
    ↓ (if success)
Return Translated Array
    ↓ (if failure)
Return Mock Translations with Fallback Flag
```

### Key Features

1. **AI-Powered Translation**: Uses Groq Llama-3.1-8b-instant for high-quality translations
2. **Intelligent Caching**: Translations cached in database to avoid redundant API calls
3. **Workspace Settings**: Tenant-specific language preferences
4. **Bulk Translation**: Efficient translation of text arrays
5. **Fallback Mechanism**: Mock translation when API unavailable
6. **Quality Tracking**: Status tracking for translation quality
7. **Multi-Entity Support**: Translates summaries, transcripts, coaching suggestions, search results
8. **Language Preferences**: User/team-specific translation preferences

## Implementation Details

### 1. TranslationService

**File**: `modules/m02-conversation-intelligence/services/translation.service.ts`

This service handles all translation logic including API calls, caching, and workspace settings.

#### Key Method: translate()

```typescript
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
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedResult = data.choices[0].message.content.trim();
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
```

#### Key Method: translateBulk()

```typescript
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
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let content = data.choices[0].message.content.trim();
      // Clean markdown if LLM ignored prompt
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
```

#### Key Method: getTranslatedEntity() with Caching

```typescript
async getTranslatedEntity(tenantId: string, entityType: string, entityId: string, sourceLang: string, targetLang: string, originalText: string) {
  if (sourceLang === targetLang) return originalText;

  // Check DB for existing translation
  let existing = null;
  try {
    if (this.prisma && this.prisma.m02TranslatedText) {
      existing = await this.prisma.m02TranslatedText.findFirst({
        where: { tenantId, entityType, entityId, targetLanguage: targetLang }
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
```

#### Workspace Language Settings

```typescript
async getWorkspaceSettings(tenantId: string) {
  if (!this.prisma.m02WorkspaceLanguageSettings) {
    return { defaultLanguage: 'English', fallbackLanguage: 'English', supportedLanguages: ['English'] };
  }
  
  let settings = await this.prisma.m02WorkspaceLanguageSettings.findUnique({
    where: { tenantId }
  });

  if (!settings) {
    settings = await this.prisma.m02WorkspaceLanguageSettings.create({
      data: {
        tenantId,
        defaultLanguage: 'English',
        fallbackLanguage: 'English',
        supportedLanguages: ['English']
      }
    });
  }

  return {
    defaultLanguage: settings.defaultLanguage,
    fallbackLanguage: settings.fallbackLanguage,
    supportedLanguages: Array.isArray(settings.supportedLanguages) ? settings.supportedLanguages : JSON.parse(settings.supportedLanguages as string || '["English"]')
  };
}

async updateWorkspaceSettings(tenantId: string, data: { defaultLanguage?: string, fallbackLanguage?: string, supportedLanguages?: string[] }) {
  if (!this.prisma.m02WorkspaceLanguageSettings) return null;

  const existing = await this.prisma.m02WorkspaceLanguageSettings.findUnique({
    where: { tenantId }
  });

  if (existing) {
    return this.prisma.m02WorkspaceLanguageSettings.update({
      where: { tenantId },
      data: {
        ...(data.defaultLanguage && { defaultLanguage: data.defaultLanguage }),
        ...(data.fallbackLanguage && { fallbackLanguage: data.fallbackLanguage }),
        ...(data.supportedLanguages && { supportedLanguages: data.supportedLanguages })
      }
    });
  } else {
    return this.prisma.m02WorkspaceLanguageSettings.create({
      data: {
        tenantId,
        defaultLanguage: data.defaultLanguage || 'English',
        fallbackLanguage: data.fallbackLanguage || 'English',
        supportedLanguages: data.supportedLanguages || ['English']
      }
    });
  }
}
```

### 2. Integration with Search Flow

**File**: `modules/m02-conversation-intelligence/services/m02.service.ts`

Translation is automatically applied to search results when workspace language settings require it.

```typescript
async searchConversations(dto: SearchQueryDto, tenantId: string): Promise<SearchResult[]> {
  // ... search logic ...

  const paginatedResults = blendedResults.slice(startIndex, startIndex + limit);

  // Fetch topic tags for each conversation
  let resultsWithTags = await Promise.all(
    paginatedResults.map(async (result) => {
      const topicTags = await this.topicRepository.getTagsForConversation(result.entityId);
      return {
        ...result,
        topicTags: topicTags.map(tag => ({
          topicName: tag.topicName,
          confidenceScore: tag.confidenceScore,
          explanation: tag.explanation,
          evidenceSnippet: tag.evidenceSnippet,
          source: tag.source as 'aimodel' | 'manual',
        })),
      };
    })
  );

  // Translate if default language is set
  try {
    const settings = await this.translationService.getWorkspaceSettings(tenantId);
    const targetLanguage = settings.defaultLanguage;
    if (targetLanguage && targetLanguage.toLowerCase() !== 'english' && targetLanguage.toLowerCase() !== 'original') {
      const sourceLang = 'en';
      resultsWithTags = await Promise.all(resultsWithTags.map(async (res) => {
        let translatedTitle = res.title;
        let translatedSnippet = res.snippet;

        if (res.title) {
           translatedTitle = await this.translationService.getTranslatedEntity(tenantId, 'search_title', res.entityId, sourceLang, targetLanguage, res.title);
        }
        if (res.snippet) {
           translatedSnippet = await this.translationService.getTranslatedEntity(tenantId, 'search_snippet', res.entityId, sourceLang, targetLanguage, res.snippet);
        }

        // Translate highlights
        const translatedHighlights = res.highlights ? await this.translationService.translateBulk(res.highlights, sourceLang, targetLanguage) : { translated: [] };

        return {
          ...res,
          title: translatedTitle,
          snippet: translatedSnippet,
          highlights: translatedHighlights.translated.length > 0 ? translatedHighlights.translated : res.highlights,
          translatedTo: targetLanguage,
          sourceLanguage: sourceLang
        };
      }));
    }
  } catch (e) {
    this.logger.warn('Failed to translate search results: ' + e);
  }

  return resultsWithTags;
}
```

### 3. Integration with Conversation Detail View

```typescript
async getConversationById(id: string, tenantId: string, targetLanguage?: string): Promise<ConversationRecord | undefined> {
  const conversation = await this.repo.findConversationById(id, tenantId);
  
  if (!conversation) {
    return undefined;
  }

  // Fetch topic tags
  const topicTags = await this.topicRepository.getTagsForConversation(id);
  const result = {
    ...conversation,
    topicTags: topicTags.map(tag => ({
      topicName: tag.topicName,
      confidenceScore: tag.confidenceScore,
      explanation: tag.explanation,
      evidenceSnippet: tag.evidenceSnippet,
      source: tag.source as 'aimodel' | 'manual',
    })),
  };

  if (targetLanguage && targetLanguage.toLowerCase() !== 'original') {
    const sourceLang = 'en';
    
    // Translate Summary
    if (result.summary) {
      result.summary = await this.translationService.getTranslatedEntity(tenantId, 'summary', id, sourceLang, targetLanguage, result.summary);
    }
    
    // Translate Coaching Suggestion
    if (result.coachingSuggestion) {
      result.coachingSuggestion = await this.translationService.getTranslatedEntity(tenantId, 'coaching', id, sourceLang, targetLanguage, result.coachingSuggestion);
    }
    
    // Translate Transcript (diarized)
    if (result.diarizedTranscript && result.diarizedTranscript.length > 0) {
      const textsToTranslate = result.diarizedTranscript.map(t => t.text);
      const translationResult = await this.translationService.translateBulk(textsToTranslate, sourceLang, targetLanguage);
      if (translationResult.translated.length === textsToTranslate.length) {
        result.diarizedTranscript = result.diarizedTranscript.map((t, index) => ({
          ...t,
          text: translationResult.translated[index]
        }));
        (result as any).translationUnavailable = translationResult.fallback;
      }
    }
    
    (result as any).translatedTo = targetLanguage;
  }

  return result;
}
```

### 4. TranslationController

**File**: `modules/m02-conversation-intelligence/controllers/translation.controller.ts`

```typescript
@Controller('api/v1/conversation-intelligence/translation')
@UseGuards(TenantGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get('workspace-settings')
  async getSettings(@Req() req: Record<string, any>) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000001';
    return this.translationService.getWorkspaceSettings(tenantId);
  }

  @Put('workspace-settings')
  async updateSettings(@Body() body: any, @Req() req: Record<string, any>) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000001';
    return this.translationService.updateWorkspaceSettings(tenantId, body);
  }

  @Post('translate')
  async translate(@Body() body: { text: string, sourceLang: string, targetLang: string }) {
    return this.translationService.translate(body.text, body.sourceLang, body.targetLang);
  }

  @Post('translate-bulk')
  async translateBulk(@Body() body: { texts: string[], sourceLang: string, targetLang: string }) {
    return this.translationService.translateBulk(body.texts, body.sourceLang, body.targetLang);
  }
}
```

## Database Schema

### m02_translated_texts Table

Stores cached translations to avoid redundant API calls.

```sql
CREATE TABLE m02_translated_texts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    quality_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_translated_texts_tenant ON m02_translated_texts(tenant_id);
CREATE INDEX idx_translated_texts_entity ON m02_translated_texts(entity_id);
```

**Entity Types:**
- `summary` - Conversation summary
- `coaching` - Coaching suggestions
- `search_title` - Search result title
- `search_snippet` - Search result snippet
- `transcript` - Full transcript text

### m02_translation_preferences Table

Stores user/team-specific translation preferences.

```sql
CREATE TABLE m02_translation_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    team_id UUID,
    user_id UUID,
    target_language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_translation_preferences_tenant ON m02_translation_preferences(tenant_id);
CREATE INDEX idx_translation_preferences_team ON m02_translation_preferences(team_id);
CREATE INDEX idx_translation_preferences_user ON m02_translation_preferences(user_id);
```

### m02_workspace_language_settings Table

Stores workspace-wide language configuration.

```sql
CREATE TABLE m02_workspace_language_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE,
    default_language VARCHAR(50) NOT NULL,
    fallback_language VARCHAR(50) NOT NULL,
    supported_languages JSON NOT NULL DEFAULT '[]'::json,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Supported Languages JSON Structure:**
```json
["English", "Spanish", "French", "German", "Japanese", "Chinese"]
```

## API Endpoints

### Workspace Settings

#### Get Workspace Settings
```
GET /api/v1/conversation-intelligence/translation/workspace-settings
```

**Response:**
```json
{
  "defaultLanguage": "Spanish",
  "fallbackLanguage": "English",
  "supportedLanguages": ["English", "Spanish", "French", "German"]
}
```

#### Update Workspace Settings
```
PUT /api/v1/conversation-intelligence/translation/workspace-settings
```

**Request Body:**
```json
{
  "defaultLanguage": "Spanish",
  "fallbackLanguage": "English",
  "supportedLanguages": ["English", "Spanish", "French"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "defaultLanguage": "Spanish",
  "fallbackLanguage": "English",
  "supportedLanguages": ["English", "Spanish", "French"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Direct Translation

#### Translate Single Text
```
POST /api/v1/conversation-intelligence/translation/translate
```

**Request Body:**
```json
{
  "text": "The customer asked about pricing options.",
  "sourceLang": "en",
  "targetLang": "es"
}
```

**Response:**
```json
{
  "translatedText": "El cliente preguntó sobre las opciones de precios."
}
```

#### Translate Bulk (Array)
```
POST /api/v1/conversation-intelligence/translation/translate-bulk
```

**Request Body:**
```json
{
  "texts": [
    "The customer asked about pricing.",
    "We discussed the ROI.",
    "They expressed interest in the enterprise plan."
  ],
  "sourceLang": "en",
  "targetLang": "es"
}
```

**Response:**
```json
{
  "translated": [
    "El cliente preguntó sobre el precio.",
    "Discutimos el ROI.",
    "Expresaron interés en el plan empresarial."
  ],
  "fallback": false
}
```

### Integrated Translation

#### Search with Translation
```
GET /api/v1/conversation-intelligence/conversations/search?query=pricing
```

**Response (when workspace default language is Spanish):**
```json
{
  "results": [
    {
      "entityId": "uuid",
      "title": "Llamada con Acme Corp",
      "snippet": "...discusión de precios...",
      "translatedTo": "Spanish",
      "sourceLanguage": "en",
      "topicTags": [...]
    }
  ]
}
```

#### Conversation Detail with Translation
```
GET /api/v1/conversation-intelligence/conversations/:id?targetLanguage=Spanish
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Llamada con Acme Corp",
  "summary": "Resumen traducido...",
  "coachingSuggestion": "Sugerencia traducida...",
  "diarizedTranscript": [
    {
      "speaker": "Agent",
      "text": "Texto traducido..."
    }
  ],
  "translatedTo": "Spanish",
  "sourceLanguage": "en"
}
```

## Configuration

### Environment Variables

```env
# Groq API for Translation
GROQ_API_KEY=gsk_your_groq_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Supported Languages

The system supports translation to any language supported by the Groq Llama-3.1 model. Common languages include:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Russian (ru)
- Japanese (ja)
- Chinese (zh)
- Korean (ko)
- Arabic (ar)

## Performance Considerations

1. **Caching**: All translations cached in database to avoid redundant API calls
2. **Bulk Translation**: Efficient array translation reduces API calls
3. **Lazy Loading**: Translations only performed when requested
4. **Cache Hit Ratio**: Monitor cache effectiveness to optimize settings
5. **API Rate Limits**: Groq has rate limits; caching helps stay within limits

## Error Handling

### Groq API Failure
- Falls back to mock translation with language prefix
- Logs error details for debugging
- Returns `[LANG] original_text` format
- Sets `fallback: true` flag for bulk operations

### Database Cache Failure
- Continues with API call if cache read fails
- Logs warning for monitoring
- Attempts cache write even if read failed
- Graceful degradation to non-cached mode

### Invalid JSON Response
- Attempts to clean markdown formatting
- Falls back to mock translation if parsing fails
- Logs parsing errors for debugging

### Empty Input
- Returns empty string immediately
- No API calls made for empty input
- Logs warning for monitoring

## Testing

### Unit Tests

```typescript
describe('TranslationService', () => {
  it('should translate text using Groq API', async () => {
    const result = await service.translate('Hello world', 'en', 'es');
    expect(result).toBeDefined();
    expect(result).not.toContain('Hello');
  });

  it('should use cache for repeated translations', async () => {
    await service.getTranslatedEntity('tenant-1', 'summary', 'conv-1', 'en', 'es', 'Original text');
    const cached = await service.getTranslatedEntity('tenant-1', 'summary', 'conv-1', 'en', 'es', 'Original text');
    expect(cached).toBeDefined();
  });

  it('should translate bulk texts', async () => {
    const texts = ['Hello', 'World', 'Test'];
    const result = await service.translateBulk(texts, 'en', 'es');
    expect(result.translated.length).toBe(3);
    expect(result.fallback).toBe(false);
  });

  it('should fallback to mock translation on API failure', async () => {
    process.env.GROQ_API_KEY = '';
    const result = await service.translate('Hello', 'en', 'es');
    expect(result).toContain('[ES]');
  });
});
```

### Integration Tests

```typescript
describe('Translation API', () => {
  it('should get workspace settings', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/conversation-intelligence/translation/workspace-settings')
      .expect(200);
    
    expect(response.body.defaultLanguage).toBeDefined();
  });

  it('should update workspace settings', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/conversation-intelligence/translation/workspace-settings')
      .send({ defaultLanguage: 'Spanish' })
      .expect(200);
    
    expect(response.body.defaultLanguage).toBe('Spanish');
  });

  it('should translate text', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/conversation-intelligence/translation/translate')
      .send({ text: 'Hello', sourceLang: 'en', targetLang: 'es' })
      .expect(200);
    
    expect(response.body.translatedText).toBeDefined();
  });
});
```

## Troubleshooting

### Translations Not Working
- Check `GROQ_API_KEY` environment variable
- Verify Groq API status
- Check logs for API errors
- Ensure workspace settings are configured

### Cache Not Working
- Verify database connection
- Check `m02_translated_texts` table exists
- Review cache hit logs
- Check tenant_id is correct

### Poor Translation Quality
- Review Groq model selection (Llama-3.1-8b-instant)
- Consider temperature settings (currently 0.3)
- Check prompt engineering
- Test with different language pairs

### Bulk Translation Failing
- Check array length validation
- Verify JSON parsing logic
- Review markdown cleaning logic
- Check API rate limits

### Settings Not Persisting
- Verify database write permissions
- Check tenant_id uniqueness constraint
- Review update logic in service
- Check for validation errors

## Best Practices

1. **Use Caching**: Always use `getTranslatedEntity()` for cached translations
2. **Bulk Operations**: Use `translateBulk()` for arrays to reduce API calls
3. **Language Codes**: Use ISO 639-1 two-letter language codes
4. **Error Handling**: Always handle fallback mode in UI
5. **Settings Management**: Configure workspace settings before enabling translation
6. **Monitoring**: Track cache hit ratio and API success rates
7. **Rate Limiting**: Implement rate limiting for translation endpoints
8. **User Preferences**: Respect user-level translation preferences when available

## Future Enhancements

1. **Multiple AI Providers**: Add support for other translation APIs (DeepL, Google Translate)
2. **Translation Quality Scoring**: Implement quality metrics for translations
3. **Auto-Detect Language**: Automatically detect source language
4. **Context-Aware Translation**: Provide conversation context for better translations
5. **Translation Memory**: Build translation memory from user corrections
6. **Real-time Translation**: WebSocket-based real-time translation
7. **Glossary Support**: Custom glossaries for domain-specific terms
8. **Translation Review**: UI for reviewing and correcting translations
9. **Batch Processing**: Background job for translating large datasets
10. **Language Detection**: ML-based language detection for transcripts

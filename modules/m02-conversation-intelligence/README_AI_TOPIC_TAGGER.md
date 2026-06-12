# AI Topic Tagger - Intelligent Conversation Classification

## Overview
sujeevan
The AI Topic Tagger is an intelligent system that automatically analyzes sales conversation transcripts (calls and emails) to identify and classify discussion topics using Large Language Models (LLMs). It supports multiple AI providers with robust fallback mechanisms and provides confidence scoring, evidence extraction, and explanation generation for each detected topic.

## Architecture

### Components

1. **AiTopicTaggerService** - Core AI tagging logic
2. **TopicManagementService** - Topic taxonomy management
3. **TopicTaggingService** - Topic assignment orchestration
4. **TopicRepository** - Topic data persistence
5. **TopicManagementController** - API endpoints for topic management
6. **TopicTagController** - API endpoints for topic tagging

### Technology Stack

- **Primary AI**: Groq API (Llama-3.3-70b-versatile)
- **Fallback AI**: Google Gemini-2.0-flash
- **Final Fallback**: Keyword-based matching
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM

## How It Works

### Tagging Flow

```
Transcript Upload/Analysis Trigger
    ↓
Fetch Topic Models (Taxonomy)
    ↓
AiTopicTaggerService.tagTranscript()
    ↓
Try Groq API (Primary)
    ├─→ Build system prompt with taxonomy
    ├─→ Send transcript + prompt to Groq
    ├─→ Parse JSON response
    └─→ Return topic candidates
    ↓ (if Groq fails)
Try Gemini API (Fallback)
    ├─→ Build system prompt with taxonomy
    ├─→ Send transcript + prompt to Gemini
    ├─→ Parse JSON response
    └─→ Return topic candidates
    ↓ (if Gemini fails)
Keyword-Based Tagging (Final Fallback)
    ├─→ Match keywords from taxonomy
    ├─→ Calculate confidence based on match count
    └─→ Return topic candidates
    ↓
Deduplicate & Filter Topics
    ├─→ Remove duplicates
    ├─→ Filter by confidence threshold (default 0.70)
    └─→ Sort by confidence
    ↓
Save to Database (m02_topic_tags)
    ↓
Return Tagged Topics
```

### Key Features

1. **Multi-Provider Support**: Groq (primary) → Gemini (fallback) → Keywords (final)
2. **Confidence Scoring**: Each topic assigned 0.0-1.0 confidence score
3. **Evidence Extraction**: Direct quotes supporting topic detection
4. **Explanation Generation**: AI explains why topic was detected
5. **Topic Taxonomy**: Customizable topic definitions with descriptions
6. **Deduplication**: Removes duplicate topic assignments
7. **Threshold Filtering**: Only high-confidence topics stored
8. **Version Tracking**: Topics linked to specific conversation versions
9. **Multi-tenant**: Topic models and tags scoped by tenant_id

## Implementation Details

### 1. AiTopicTaggerService

**File**: `modules/m02-conversation-intelligence/services/ai-topic-tagger.service.ts`

This service handles the core AI tagging logic including API calls, prompt engineering, and response parsing.

#### Key Method: tagTranscript()

```typescript
async tagTranscript(
  transcriptText: string,
  topicDefinitions: TopicDefinition[]
): Promise<TopicTagCandidate[]> {
  if (!transcriptText || transcriptText.trim().length === 0) {
    this.logger.warn('Empty transcript provided for tagging');
    return [];
  }

  if (!topicDefinitions || topicDefinitions.length === 0) {
    this.logger.warn('No topic definitions provided for tagging');
    return [];
  }

  // Build taxonomy string from topic definitions
  const taxonomy = topicDefinitions.map(t =>
    t.description ? `${t.name}: ${t.description}` : t.name
  ).join(', ');

  // Try Groq first, then fallback to Gemini
  const result = await this.tryGroq(transcriptText, taxonomy, topicDefinitions);
  if (result && result.length > 0) {
    return result;
  }

  this.logger.warn('Groq failed, trying Gemini fallback');
  const geminiResult = await this.tryGemini(transcriptText, taxonomy, topicDefinitions);
  if (geminiResult && geminiResult.length > 0) {
    return geminiResult;
  }

  // Fallback to keyword-based matching when APIs are not configured
  this.logger.warn('Both AI APIs failed, using keyword-based fallback');
  return this.keywordBasedTagging(transcriptText, topicDefinitions);
}
```

#### Groq API Integration

```typescript
private async tryGroq(
  transcriptText: string,
  taxonomy: string,
  topicDefinitions: TopicDefinition[]
): Promise<TopicTagCandidate[]> {
  try {
    if (!process.env.GROQ_API_KEY) {
      this.logger.warn('GROQ_API_KEY not configured');
      return [];
    }

    const systemPrompt = `You are a sales conversation analyzer. Your task is to analyze the transcript and identify which topics from the following taxonomy are discussed.

Available topics: ${taxonomy}

For each topic detected, provide:
1. topicName: The exact name from the taxonomy
2. confidenceScore: A number between 0.0 and 1.0 indicating how confident you are
3. explanation: A brief 1-2 sentence explanation of why this topic was detected
4. evidenceSnippet: A direct quote from the transcript that supports this topic (max 100 characters)

Return ONLY a valid JSON array. Do not include markdown formatting or any additional text.

Example format:
[
  {
    "topicName": "pricing",
    "confidenceScore": 0.85,
    "explanation": "The customer asked about pricing tiers and discounts",
    "evidenceSnippet": "What are your pricing options for enterprise plans?"
  }
]`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcriptText }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq API error: ${response.status} ${response.statusText}`);
      this.logger.error(`Groq API error details: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      this.logger.warn('No content from Groq response');
      return [];
    }

    const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    const topicsArray = Array.isArray(parsed) ? parsed : (parsed.topics || []);

    return topicsArray.map((t: any) => ({
      topicName: this.normalizeTopicName(t.topicName, topicDefinitions),
      confidenceScore: this.normalizeConfidence(t.confidenceScore),
      source: 'aimodel' as const,
      explanation: t.explanation || '',
      evidenceSnippet: t.evidenceSnippet || ''
    }));
  } catch (error) {
    this.logger.error('Groq API call failed', error);
    return [];
  }
}
```

#### Gemini API Integration (Fallback)

```typescript
private async tryGemini(
  transcriptText: string,
  taxonomy: string,
  topicDefinitions: TopicDefinition[]
): Promise<TopicTagCandidate[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      this.logger.warn('GEMINI_API_KEY not configured');
      return [];
    }

    const systemPrompt = `You are a sales conversation analyzer. Your task is to analyze the transcript and identify which topics from the following taxonomy are discussed.

Available topics: ${taxonomy}

For each topic detected, provide:
1. topicName: The exact name from the taxonomy
2. confidenceScore: A number between 0.0 and 1.0 indicating how confident you are
3. explanation: A brief 1-2 sentence explanation of why this topic was detected
4. evidenceSnippet: A direct quote from the transcript that supports this topic (max 100 characters)

Return ONLY a valid JSON array. Do not include markdown formatting or any additional text.

Example format:
[
  {
    "topicName": "pricing",
    "confidenceScore": 0.85,
    "explanation": "The customer asked about pricing tiers and discounts",
    "evidenceSnippet": "What are your pricing options for enterprise plans?"
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemPrompt + '\n\nTranscript:\n' + transcriptText }] }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini API error: ${response.status} ${response.statusText}`);
      this.logger.error(`Gemini API error details: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      this.logger.warn('No content from Gemini response');
      return [];
    }

    const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    const topicsArray = Array.isArray(parsed) ? parsed : (parsed.topics || []);

    return topicsArray.map((t: any) => ({
      topicName: this.normalizeTopicName(t.topicName, topicDefinitions),
      confidenceScore: this.normalizeConfidence(t.confidenceScore),
      source: 'aimodel' as const,
      explanation: t.explanation || '',
      evidenceSnippet: t.evidenceSnippet || ''
    }));
  } catch (error) {
    this.logger.error('Gemini API call failed', error);
    return [];
  }
}
```

#### Keyword-Based Fallback

```typescript
private keywordBasedTagging(
  transcriptText: string,
  topicDefinitions: TopicDefinition[]
): TopicTagCandidate[] {
  const lowerTranscript = transcriptText.toLowerCase();
  const keywordMap: Record<string, string[]> = {
    'pricing': ['price', 'pricing', 'cost', 'discount', 'rate', 'fee', 'payment'],
    'sales objection': ['objection', 'concern', 'worry', 'hesitate', 'hesitation'],
    'promotions and discounts': ['promotion', 'discount', 'offer', 'deal', 'special'],
    'CRM solutions': ['crm', 'customer relationship management', 'salesforce', 'hubspot'],
    'ROI': ['roi', 'return on investment', 'value', 'benefit', 'payback'],
    'Salesforce solutions': ['salesforce', 'sf', 'crm integration', 'salesforce sync'],
    'Data security': ['security', 'gdpr', 'compliance', 'data protection', 'privacy'],
    'customer complaint': ['complaint', 'issue', 'problem', 'unhappy', 'dissatisfied']
  };

  const detectedTopics: TopicTagCandidate[] = [];

  for (const topic of topicDefinitions) {
    const keywords = keywordMap[topic.name.toLowerCase()] || [topic.name.toLowerCase()];
    const matchCount = keywords.filter(kw => lowerTranscript.includes(kw)).length;

    if (matchCount > 0) {
      // Find evidence snippet
      const keywordIndex = lowerTranscript.indexOf(keywords[0]);
      const start = Math.max(0, keywordIndex - 30);
      const end = Math.min(transcriptText.length, keywordIndex + 100);
      const evidence = transcriptText.substring(start, end).trim();

      detectedTopics.push({
        topicName: topic.name,
        confidenceScore: Math.min(0.9, 0.5 + (matchCount * 0.1)),
        source: 'aimodel',
        explanation: `Detected based on keyword matches: ${keywords.slice(0, 3).join(', ')}`,
        evidenceSnippet: evidence.substring(0, 100)
      });
    }
  }

  return detectedTopics;
}
```

#### Topic Deduplication & Filtering

```typescript
deduplicateAndFilterTopics(
  candidates: TopicTagCandidate[],
  threshold: number = 0.70
): TopicTagCandidate[] {
  const result: TopicTagCandidate[] = [];
  const seen = new Set<string>();

  // Sort by confidence descending
  const sorted = [...candidates].sort((a, b) => b.confidenceScore - a.confidenceScore);

  for (const item of sorted) {
    if (item.confidenceScore < threshold) {
      continue;
    }

    const normalized = item.topicName.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
    }
  }

  return result;
}
```

### 2. TopicManagementService

**File**: `modules/m02-conversation-intelligence/services/topic-management.service.ts`

This service manages topic models and taxonomies.

#### Key Methods

```typescript
async getTopicModels(tenantId: string): Promise<TopicModel[]> {
  return this.prisma.m02TopicModel.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' }
  });
}

async createTopicModel(
  tenantId: string,
  topics: TopicDefinition[],
  type: string = 'global'
): Promise<TopicModel> {
  return this.prisma.m02TopicModel.create({
    data: {
      tenantId,
      topics: topics as any,
      type,
      lastTrainedAt: new Date()
    }
  });
}

async updateTopicModel(
  id: string,
  tenantId: string,
  topics: TopicDefinition[]
): Promise<TopicModel> {
  return this.prisma.m02TopicModel.update({
    where: { id, tenantId },
    data: {
      topics: topics as any,
      lastTrainedAt: new Date()
    }
  });
}
```

### 3. TopicTaggingService

**File**: `modules/m02-conversation-intelligence/services/topic-tagging.service.ts`

This service orchestrates the topic tagging workflow.

```typescript
async tagConversation(
  conversationId: string,
  tenantId: string,
  channel: 'call' | 'email'
): Promise<TopicTag[]> {
  // 1. Fetch conversation
  const conversation = await this.repo.findConversationById(conversationId, tenantId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // 2. Get topic models
  const topicModels = await this.topicManagementService.getTopicModels(tenantId);
  const topicDefinitions = topicModels.flatMap((model: any) => model.topics || []);

  if (topicDefinitions.length === 0) {
    // Seed default topics
    await this.topicManagementService.createTopicModel(tenantId, this.getDefaultTopics(), 'global');
    const newModels = await this.topicManagementService.getTopicModels(tenantId);
    topicDefinitions.push(...newModels.flatMap((m: any) => m.topics || []));
  }

  // 3. Run AI tagging
  const transcript = conversation.transcript || conversation.body || '';
  const candidates = await this.aiTopicTaggerService.tagTranscript(transcript, topicDefinitions);

  // 4. Filter and deduplicate
  const filteredTopics = this.aiTopicTaggerService.deduplicateAndFilterTopics(candidates, 0.70);

  // 5. Save to database
  const savedTags = [];
  for (const topic of filteredTopics) {
    const tag = await this.topicRepository.createTopicTag({
      tenantId,
      callId: channel === 'call' ? conversationId : undefined,
      emailId: channel === 'email' ? conversationId : undefined,
      topicName: topic.topicName,
      source: topic.source,
      confidenceScore: topic.confidenceScore,
      explanation: topic.explanation,
      evidenceSnippet: topic.evidenceSnippet
    });
    savedTags.push(tag);
  }

  return savedTags;
}

private getDefaultTopics(): TopicDefinition[] {
  return [
    { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
    { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
    { name: 'promotions and discounts', description: 'Special offers, promotions, or discount discussions' },
    { name: 'CRM solutions', description: 'CRM software, tools, or integration discussions' },
    { name: 'ROI', description: 'Return on investment calculations or value discussions' },
    { name: 'Salesforce solutions', description: 'Salesforce-specific features, integrations, or comparisons' },
    { name: 'Data security', description: 'Security, compliance, GDPR, or data protection discussions' },
    { name: 'customer complaint', description: 'Customer complaints, issues, or negative feedback' }
  ];
}
```

### 4. TopicRepository

**File**: `modules/m02-conversation-intelligence/repositories/topic.repository.ts`

This repository handles topic tag persistence.

```typescript
async createTopicTag(data: {
  tenantId: string;
  callId?: string;
  emailId?: string;
  topicName: string;
  source: string;
  confidenceScore: number;
  explanation?: string;
  evidenceSnippet?: string;
}): Promise<TopicTag> {
  return this.prisma.m02TopicTag.create({
    data: {
      tenantId: data.tenantId,
      callId: data.callId,
      emailId: data.emailId,
      topicName: data.topicName,
      source: data.source,
      confidenceScore: data.confidenceScore,
      explanation: data.explanation,
      evidenceSnippet: data.evidenceSnippet
    }
  });
}

async getTagsForConversation(conversationId: string): Promise<TopicTag[]> {
  return this.prisma.m02TopicTag.findMany({
    where: {
      OR: [
        { callId: conversationId },
        { emailId: conversationId }
      ]
    },
    orderBy: { confidenceScore: 'desc' }
  });
}

async deleteTag(tagId: string): Promise<TopicTag> {
  return this.prisma.m02TopicTag.delete({
    where: { id: tagId }
  });
}
```

### 5. Integration with Upload Flow

**File**: `modules/m02-conversation-intelligence/services/m02.service.ts`

Topic tagging is automatically triggered during transcript upload.

```typescript
async uploadTranscript(body: any, tenantId: string) {
  const { type, title, transcript, agentName, customerName, channel } = body;

  // Step 1: Save transcript to database
  let savedConversation;
  if (type === 'call') {
    savedConversation = await this.repo.createCall({
      tenantId,
      title,
      transcript,
      agentName: agentName || 'Unknown',
      durationSeconds: body.durationSeconds || 600,
    });
  } else {
    savedConversation = await this.repo.createEmail({
      tenantId,
      subject: title,
      body: transcript,
      sender: agentName || 'unknown@company.com',
      recipient: customerName || 'customer@client.com',
    });
  }

  // Step 2: Run Vocabulary Correction
  const correctedTranscript = await this.vocabService.correctTranscript(savedConversation.id, type, tenantId);

  // Step 3: Get topic models
  const topicModels = await this.topicManagementService.getTopicModels(tenantId);
  let topicDefinitions: any[] = [];

  if (topicModels.length > 0) {
    topicDefinitions = topicModels.flatMap((model: any) => model.topics || []);
  } else {
    // Seed default topics
    await this.topicManagementService.createTopicModel(tenantId, [
      { name: 'pricing', description: 'Discussions about pricing, costs, discounts, or payment terms' },
      { name: 'sales objection', description: 'Customer objections or concerns about the product/service' },
      // ... more default topics
    ], 'global');
    const newTopicModels = await this.topicManagementService.getTopicModels(tenantId);
    topicDefinitions = newTopicModels.flatMap((model: any) => model.topics || []);
  }

  // Step 4: Run AI topic tagging
  const topicCandidates = await this.aiTopicTaggerService.tagTranscript(correctedTranscript || transcript, topicDefinitions);

  // Step 5: Filter and deduplicate topics
  const filteredTopics = this.aiTopicTaggerService.deduplicateAndFilterTopics(topicCandidates, 0.70);

  // Step 6: Save topic tags to database
  for (const topic of filteredTopics) {
    await this.topicRepository.createTopicTag({
      callId: savedConversation.id,
      tenantId,
      topicName: topic.topicName,
      source: topic.source,
      confidenceScore: topic.confidenceScore,
      explanation: topic.explanation,
      evidenceSnippet: topic.evidenceSnippet,
    });
  }

  // Step 7: Publish event
  await this.events.publish(type === 'call' ? 'call.transcription.completed' : 'email.received', {
    tenantId,
    recordId: savedConversation.id,
  });

  return {
    success: true,
    conversationId: savedConversation.id,
    topicsTagged: filteredTopics.length,
    topics: filteredTopics,
  };
}
```

## Database Schema

### m02_topic_models Table

Stores topic taxonomies and definitions.

```sql
CREATE TABLE m02_topic_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    type VARCHAR(50) NOT NULL DEFAULT 'global',
    last_trained_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_topic_models_tenant ON m02_topic_models(tenant_id);
CREATE INDEX idx_topic_models_type ON m02_topic_models(type);
```

**Topics JSONB Structure:**
```json
[
  {
    "name": "pricing",
    "description": "Discussions about pricing, costs, discounts, or payment terms"
  },
  {
    "name": "sales objection",
    "description": "Customer objections or concerns about the product/service"
  }
]
```

### m02_topic_tags Table

Stores AI-generated topic assignments for conversations.

```sql
CREATE TABLE m02_topic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID,
    email_id UUID,
    tenant_id UUID NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'aimodel',
    confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    explanation TEXT,
    evidence_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_topic_tags_call ON m02_topic_tags(call_id);
CREATE INDEX idx_topic_tags_email ON m02_topic_tags(email_id);
CREATE INDEX idx_topic_tags_tenant ON m02_topic_tags(tenant_id);
CREATE INDEX idx_topic_tags_topic ON m02_topic_tags(topic_name);
```

## API Endpoints

### Topic Management

#### Create Topic Model
```
POST /api/v1/conversation-intelligence/topic-models
```

**Request Body:**
```json
{
  "topics": [
    {
      "name": "pricing",
      "description": "Discussions about pricing, costs, discounts"
    },
    {
      "name": "ROI",
      "description": "Return on investment discussions"
    }
  ],
  "type": "global"
}
```

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "topics": [...],
  "type": "global",
  "lastTrainedAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get Topic Models
```
GET /api/v1/conversation-intelligence/topic-models
```

**Response:**
```json
[
  {
    "id": "uuid",
    "topics": [...],
    "type": "global",
    "lastTrainedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Update Topic Model
```
PUT /api/v1/conversation-intelligence/topic-models/:id
```

**Request Body:**
```json
{
  "topics": [
    {
      "name": "pricing",
      "description": "Updated description"
    }
  ]
}
```

#### Delete Topic Model
```
DELETE /api/v1/conversation-intelligence/topic-models/:id
```

### Topic Tagging

#### Get Topic Tags for Conversation
```
GET /api/v1/conversation-intelligence/conversations/:id/topics
```

**Response:**
```json
{
  "conversationId": "uuid",
  "tenantId": "uuid",
  "topics": [
    {
      "id": "uuid",
      "topicName": "pricing",
      "confidenceScore": 0.85,
      "explanation": "The customer asked about pricing tiers and discounts",
      "evidenceSnippet": "What are your pricing options for enterprise plans?",
      "source": "aimodel",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Add Manual Topic Tag
```
POST /api/v1/conversation-intelligence/conversations/:id/topics
```

**Request Body:**
```json
{
  "topicName": "custom topic",
  "confidenceScore": 1.0,
  "explanation": "Manually added by user",
  "source": "manual"
}
```

#### Delete Topic Tag
```
DELETE /api/v1/conversation-intelligence/topic-tags/:id
```

## Configuration

### Environment Variables

```env
# Groq API (Primary)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Gemini API (Fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Default Topics

The system seeds the following default topics when no topic models exist:

1. **pricing** - Discussions about pricing, costs, discounts, or payment terms
2. **sales objection** - Customer objections or concerns about the product/service
3. **promotions and discounts** - Special offers, promotions, or discount discussions
4. **CRM solutions** - CRM software, tools, or integration discussions
5. **ROI** - Return on investment calculations or value discussions
6. **Salesforce solutions** - Salesforce-specific features, integrations, or comparisons
7. **Data security** - Security, compliance, GDPR, or data protection discussions
8. **customer complaint** - Customer complaints, issues, or negative feedback

## Performance Considerations

1. **API Fallback**: Automatic fallback ensures reliability even if primary API fails
2. **Caching**: Topic models cached in memory for repeated access
3. **Batch Processing**: Multiple conversations can be tagged in parallel
4. **Threshold Filtering**: Low-confidence topics filtered before database write
5. **Indexing**: Database indexes on call_id, email_id, tenant_id for fast lookups

## Error Handling

### Groq API Failure
- Logs error details
- Automatically falls back to Gemini
- If Gemini fails, uses keyword-based matching
- Returns results from fallback mechanism

### Invalid JSON Response
- Attempts to clean markdown formatting
- Falls back to keyword matching if parsing fails
- Logs parsing errors for debugging

### Empty Transcript
- Returns empty array immediately
- Logs warning for monitoring
- No API calls made for empty input

## Testing

### Unit Tests

```typescript
describe('AiTopicTaggerService', () => {
  it('should tag transcript with Groq API', async () => {
    const transcript = "The customer asked about pricing and discounts.";
    const topics = [{ name: 'pricing', description: 'Pricing discussions' }];
    
    const result = await service.tagTranscript(transcript, topics);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].topicName).toBe('pricing');
    expect(result[0].confidenceScore).toBeGreaterThan(0);
  });

  it('should fallback to keyword matching when APIs fail', async () => {
    // Mock API failures
    process.env.GROQ_API_KEY = '';
    process.env.GEMINI_API_KEY = '';
    
    const transcript = "We discussed pricing and ROI.";
    const topics = [{ name: 'pricing', description: 'Pricing' }];
    
    const result = await service.tagTranscript(transcript, topics);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('aimodel');
  });

  it('should deduplicate topics', () => {
    const candidates = [
      { topicName: 'pricing', confidenceScore: 0.9 },
      { topicName: 'Pricing', confidenceScore: 0.8 },
      { topicName: 'ROI', confidenceScore: 0.7 }
    ];
    
    const filtered = service.deduplicateAndFilterTopics(candidates, 0.5);
    
    expect(filtered.length).toBe(2);
    expect(filtered[0].topicName).toBe('pricing');
  });
});
```

### Integration Tests

```typescript
describe('Topic Tagging API', () => {
  it('should create topic model', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/conversation-intelligence/topic-models')
      .send({
        topics: [{ name: 'test', description: 'Test topic' }],
        type: 'global'
      })
      .expect(201);
    
    expect(response.body.id).toBeDefined();
  });

  it('should get topic tags for conversation', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/conversation-intelligence/conversations/uuid/topics')
      .expect(200);
    
    expect(response.body.topics).toBeDefined();
  });
});
```

## Troubleshooting

### No Topics Detected
- Check if topic models exist for tenant
- Verify transcript is not empty
- Check API keys are configured
- Review confidence threshold (default 0.70)
- Check logs for API errors

### Low Confidence Scores
- Review topic descriptions for clarity
- Ensure taxonomy matches conversation content
- Consider lowering confidence threshold
- Check if keyword fallback is being used

### API Rate Limits
- Groq: Check rate limit status
- Gemini: Check quota limits
- Implement retry logic with exponential backoff
- Consider caching results for repeated transcripts

### Duplicate Topics
- Check deduplication logic
- Verify topic name normalization
- Review case sensitivity handling
- Check if multiple topic models have overlapping topics

## Future Enhancements

1. **Few-Shot Learning**: Provide examples in prompts for better accuracy
2. **Topic Hierarchy**: Support hierarchical topic structures
3. **Custom Thresholds**: Per-tenant confidence threshold configuration
4. **Topic Trends**: Track topic frequency over time
5. **Auto-Topic Discovery**: ML-based topic model training
6. **Multi-language**: Support topic tagging in multiple languages
7. **Real-time Tagging**: WebSocket-based real-time topic updates
8. **Topic Co-occurrence**: Analyze which topics appear together

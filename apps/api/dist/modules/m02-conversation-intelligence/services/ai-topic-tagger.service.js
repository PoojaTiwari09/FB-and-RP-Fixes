"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiTopicTaggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTopicTaggerService = void 0;
const common_1 = require("@nestjs/common");
let AiTopicTaggerService = AiTopicTaggerService_1 = class AiTopicTaggerService {
    logger = new common_1.Logger(AiTopicTaggerService_1.name);
    async tagTranscript(transcriptText, topicDefinitions) {
        if (!transcriptText || transcriptText.trim().length === 0) {
            this.logger.warn('Empty transcript provided for tagging');
            return [];
        }
        if (!topicDefinitions || topicDefinitions.length === 0) {
            this.logger.warn('No topic definitions provided for tagging');
            return [];
        }
        const taxonomy = topicDefinitions.map(t => t.description ? `${t.name}: ${t.description}` : t.name).join(', ');
        const result = await this.tryGroq(transcriptText, taxonomy, topicDefinitions);
        if (result && result.length > 0) {
            return result;
        }
        this.logger.warn('Groq failed, trying Gemini fallback');
        const geminiResult = await this.tryGemini(transcriptText, taxonomy, topicDefinitions);
        if (geminiResult && geminiResult.length > 0) {
            return geminiResult;
        }
        this.logger.warn('Both AI APIs failed, using keyword-based fallback');
        return this.keywordBasedTagging(transcriptText, topicDefinitions);
    }
    async tryGroq(transcriptText, taxonomy, topicDefinitions) {
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
            return topicsArray.map((t) => ({
                topicName: this.normalizeTopicName(t.topicName, topicDefinitions),
                confidenceScore: this.normalizeConfidence(t.confidenceScore),
                source: 'aimodel',
                explanation: t.explanation || '',
                evidenceSnippet: t.evidenceSnippet || ''
            }));
        }
        catch (error) {
            this.logger.error('Groq API call failed', error);
            return [];
        }
    }
    async tryGemini(transcriptText, taxonomy, topicDefinitions) {
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
            });
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
            return topicsArray.map((t) => ({
                topicName: this.normalizeTopicName(t.topicName, topicDefinitions),
                confidenceScore: this.normalizeConfidence(t.confidenceScore),
                source: 'aimodel',
                explanation: t.explanation || '',
                evidenceSnippet: t.evidenceSnippet || ''
            }));
        }
        catch (error) {
            this.logger.error('Gemini API call failed', error);
            return [];
        }
    }
    normalizeTopicName(detectedName, topicDefinitions) {
        if (!detectedName)
            return '';
        const detectedLower = detectedName.toLowerCase().trim();
        const exactMatch = topicDefinitions.find(t => t.name.toLowerCase() === detectedLower);
        if (exactMatch)
            return exactMatch.name;
        const partialMatch = topicDefinitions.find(t => detectedLower.includes(t.name.toLowerCase()) ||
            t.name.toLowerCase().includes(detectedLower));
        if (partialMatch)
            return partialMatch.name;
        return detectedName;
    }
    normalizeConfidence(score) {
        if (typeof score !== 'number' || isNaN(score))
            return 0.5;
        if (score < 0)
            return 0;
        if (score > 1)
            return 1;
        return score;
    }
    deduplicateAndFilterTopics(candidates, threshold = 0.70) {
        const result = [];
        const seen = new Set();
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
    keywordBasedTagging(transcriptText, topicDefinitions) {
        const lowerTranscript = transcriptText.toLowerCase();
        const keywordMap = {
            'pricing': ['price', 'pricing', 'cost', 'discount', 'rate', 'fee', 'payment', 'pricings'],
            'sales objection': ['objection', 'concern', 'worry', 'hesitate', 'hesitation'],
            'promotions and discounts': ['promotion', 'discount', 'offer', 'deal', 'special'],
            'CRM solutions': ['crm', 'customer relationship management', 'salesforce', 'hubspot'],
            'ROI': ['roi', 'return on investment', 'value', 'benefit', 'payback'],
            'Salesforce solutions': ['salesforce', 'sf', 'crm integration', 'salesforce sync'],
            'Data security': ['security', 'gdpr', 'compliance', 'data protection', 'privacy'],
            'customer complaint': ['complaint', 'issue', 'problem', 'unhappy', 'dissatisfied']
        };
        const detectedTopics = [];
        for (const topic of topicDefinitions) {
            const keywords = keywordMap[topic.name.toLowerCase()] || [topic.name.toLowerCase()];
            const matchCount = keywords.filter(kw => lowerTranscript.includes(kw)).length;
            if (matchCount > 0) {
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
    async analyzeSummaryAndCompetitors(transcriptText) {
        if (!transcriptText || transcriptText.trim().length === 0) {
            return { summary: 'No transcript available to summarize.', competitors: [] };
        }
        try {
            if (process.env.GROQ_API_KEY) {
                const result = await this.tryGroqAnalysis(transcriptText);
                if (result)
                    return result;
            }
            if (process.env.GEMINI_API_KEY) {
                this.logger.warn('Groq failed or not configured, trying Gemini fallback for analysis');
                const geminiResult = await this.tryGeminiAnalysis(transcriptText);
                if (geminiResult)
                    return geminiResult;
            }
            throw new Error('Both AI APIs failed to analyze transcript');
        }
        catch (e) {
            this.logger.error('Failed to analyze transcript', e);
            return {
                summary: `Call regarding ${transcriptText.substring(0, 50)}...`,
                competitors: []
            };
        }
    }
    async tryGroqAnalysis(transcriptText) {
        const systemPrompt = `You are a sales conversation analyzer. Your task is to generate a concise summary and detect any competitors mentioned in the transcript.

1. summary: A sharp and precise 2-3 sentence business summary of the content discussed in the conversation.
2. competitors: An array of competitor company names mentioned. If none, return an empty array.

Return ONLY a valid JSON object. Do not include markdown formatting or any additional text.

Example format:
{
  "summary": "The customer expressed interest in the enterprise tier but had concerns about the price. The agent offered a 15% discount if they sign this week.",
  "competitors": ["Acme Corp", "Tech Solutions"]
}`;
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
        if (!response.ok)
            return null;
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content)
            return null;
        try {
            const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        }
        catch (e) {
            return null;
        }
    }
    async tryGeminiAnalysis(transcriptText) {
        const systemPrompt = `You are a sales conversation analyzer. Your task is to generate a concise summary and detect any competitors mentioned in the transcript.

1. summary: A sharp and precise 2-3 sentence business summary of the content discussed in the conversation.
2. competitors: An array of competitor company names mentioned. If none, return an empty array.

Return ONLY a valid JSON object. Do not include markdown formatting or any additional text.

Example format:
{
  "summary": "The customer expressed interest in the enterprise tier but had concerns about the price. The agent offered a 15% discount if they sign this week.",
  "competitors": ["Acme Corp", "Tech Solutions"]
}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content)
            return null;
        try {
            const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        }
        catch (e) {
            return null;
        }
    }
};
exports.AiTopicTaggerService = AiTopicTaggerService;
exports.AiTopicTaggerService = AiTopicTaggerService = AiTopicTaggerService_1 = __decorate([
    (0, common_1.Injectable)()
], AiTopicTaggerService);
//# sourceMappingURL=ai-topic-tagger.service.js.map
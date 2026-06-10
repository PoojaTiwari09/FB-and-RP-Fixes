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
var HybridSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let HybridSearchService = HybridSearchService_1 = class HybridSearchService {
    prisma;
    logger = new common_1.Logger(HybridSearchService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    get semanticBackend() {
        const v = (process.env.M02_SEMANTIC_BACKEND || 'simulated').toLowerCase();
        if (v === 'pgvector' || v === 'postgres-fts' || v === 'simulated')
            return v;
        this.logger.warn(`Unknown M02_SEMANTIC_BACKEND=${v}; falling back to "simulated".`);
        return 'simulated';
    }
    stem(word) {
        let w = word.toLowerCase();
        if (w.endsWith('ings'))
            w = w.slice(0, -4);
        else if (w.endsWith('ing'))
            w = w.slice(0, -3);
        else if (w.endsWith('tion'))
            w = w.slice(0, -4);
        else if (w.endsWith('ment'))
            w = w.slice(0, -4);
        else if (w.endsWith('ness'))
            w = w.slice(0, -4);
        else if (w.endsWith('ies'))
            w = w.slice(0, -3) + 'y';
        else if (w.endsWith('ves'))
            w = w.slice(0, -3) + 'f';
        else if (w.endsWith('ses') || w.endsWith('zes') || w.endsWith('xes'))
            w = w.slice(0, -2);
        else if (w.endsWith('ous'))
            w = w.slice(0, -3);
        else if (w.endsWith('ful'))
            w = w.slice(0, -3);
        else if (w.endsWith('able') || w.endsWith('ible'))
            w = w.slice(0, -4);
        else if (w.endsWith('ated'))
            w = w.slice(0, -2);
        else if (w.endsWith('ed') && w.length > 4)
            w = w.slice(0, -2);
        else if (w.endsWith('er') && w.length > 4)
            w = w.slice(0, -2);
        else if (w.endsWith('ly') && w.length > 4)
            w = w.slice(0, -2);
        else if (w.endsWith('es') && w.length > 4)
            w = w.slice(0, -2);
        else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3)
            w = w.slice(0, -1);
        return w;
    }
    levenshtein(a, b) {
        const m = a.length, n = b.length;
        if (m === 0)
            return n;
        if (n === 0)
            return m;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
        }
        return dp[m][n];
    }
    wordsMatch(queryWord, targetWord) {
        const q = queryWord.toLowerCase();
        const t = targetWord.toLowerCase();
        if (t.includes(q) || q.includes(t))
            return true;
        const qs = this.stem(q);
        const ts = this.stem(t);
        if (qs.length >= 3 && ts.length >= 3 && (ts.includes(qs) || qs.includes(ts)))
            return true;
        const maxDist = q.length <= 5 ? 1 : 2;
        if (this.levenshtein(q, t) <= maxDist)
            return true;
        if (qs.length >= 3 && ts.length >= 3 && this.levenshtein(qs, ts) <= maxDist)
            return true;
        return false;
    }
    fuzzyIndexOf(text, token) {
        const lowerText = text.toLowerCase();
        const lowerToken = token.toLowerCase();
        const directIdx = lowerText.indexOf(lowerToken);
        if (directIdx !== -1)
            return directIdx;
        const stemmedToken = this.stem(lowerToken);
        if (stemmedToken.length >= 3) {
            const stemIdx = lowerText.indexOf(stemmedToken);
            if (stemIdx !== -1)
                return stemIdx;
        }
        const words = lowerText.split(/[^a-zA-Z0-9]+/);
        let charPos = 0;
        for (const word of words) {
            const wordStart = lowerText.indexOf(word, charPos);
            if (word.length >= 3 && this.wordsMatch(lowerToken, word)) {
                return wordStart >= 0 ? wordStart : charPos;
            }
            charPos = wordStart + word.length;
        }
        return -1;
    }
    blendHybridResults(textResults, semanticResults, textWeight = 0.5, semanticWeight = 0.5) {
        const blendedMap = new Map();
        textResults.forEach((res) => {
            blendedMap.set(res.entityId, { ...res, score: res.score * textWeight });
        });
        semanticResults.forEach((res) => {
            const existing = blendedMap.get(res.entityId);
            if (existing) {
                existing.score += res.score * semanticWeight;
                if (res.snippet && (!existing.snippet || res.snippet.length > existing.snippet.length)) {
                    existing.snippet = res.snippet;
                }
            }
            else {
                blendedMap.set(res.entityId, { ...res, score: res.score * semanticWeight });
            }
        });
        return Array.from(blendedMap.values())
            .filter((item) => item.score >= 0.1)
            .sort((a, b) => b.score - a.score);
    }
    simulateTextSearch(corpus, query) {
        if (!query) {
            return corpus.map((item) => ({
                entityId: item.id,
                entityType: item.channel,
                score: 1.0,
                snippet: item.summary,
                ...item,
            }));
        }
        const lowercaseQuery = query.toLowerCase();
        const queryTokens = lowercaseQuery.split(/[^a-zA-Z0-9]+/).filter((token) => token.length > 1);
        if (queryTokens.length === 0)
            queryTokens.push(lowercaseQuery);
        const results = [];
        corpus.forEach((item) => {
            let score = 0;
            let snippet = '';
            const titleLower = (item.title || '').toLowerCase();
            const customerLower = (item.customerName || '').toLowerCase();
            const agentLower = (item.agentName || '').toLowerCase();
            const textToSearch = item.transcript || item.summary || '';
            const textLower = textToSearch.toLowerCase();
            const topicLowers = (item.topics || []).map((t) => t.toLowerCase());
            queryTokens.forEach((token) => {
                if (titleLower.includes(token)) {
                    score += 0.8;
                }
                else if (item.title && this.fuzzyIndexOf(item.title, token) !== -1) {
                    score += 0.8;
                }
                if (customerLower.includes(token) || agentLower.includes(token)) {
                    score += 0.6;
                }
                const directIdx = textLower.indexOf(token);
                const idx = directIdx !== -1 ? directIdx : this.fuzzyIndexOf(textToSearch, token);
                if (idx !== -1) {
                    score += 1.0;
                    if (!snippet) {
                        const start = Math.max(0, idx - 40);
                        const end = Math.min(textToSearch.length, idx + token.length + 60);
                        snippet = `...${textToSearch.substring(start, end).replace(/\n/g, ' ')}...`;
                    }
                }
                if (topicLowers.some((t) => t.includes(token) || token.includes(t)))
                    score += 0.5;
            });
            if (score > 0) {
                results.push({
                    entityId: item.id,
                    entityType: item.channel,
                    score: Math.min(1.0, score),
                    snippet: snippet || item.summary,
                    ...item,
                });
            }
        });
        return results;
    }
    async executePostgresFtsSearch(tenantId, query) {
        if (!query)
            return [];
        try {
            const rows = await this.prisma.$queryRaw `
        SELECT t.id              AS "transcriptId",
                t."callId"        AS "callId",
                cr.title          AS "title",
                cr."callDate"     AS "callDate",
                ts_headline('english', t."fullText",
                            plainto_tsquery('english', ${query}),
                            'StartSel=<<,StopSel=>>,MaxFragments=2,MaxWords=18,MinWords=6')
                                AS "snippet",
                ts_rank(to_tsvector('english', t."fullText"),
                        plainto_tsquery('english', ${query})) AS "rank"
           FROM transcripts t
           JOIN call_records cr ON cr.id = t."callId"
          WHERE cr."tenantid" = ${tenantId}::uuid
            AND to_tsvector('english', t."fullText") @@ plainto_tsquery('english', ${query})
          ORDER BY "rank" DESC
          LIMIT 100
      `;
            return rows.map((r) => ({
                entityId: r.callId,
                entityType: 'call',
                score: Math.min(1.0, Number(r.rank) * 4),
                snippet: r.snippet?.replace(/<<|>>/g, '') ?? '',
                title: r.title,
                date: r.callDate?.toISOString?.(),
                channel: 'call',
            }));
        }
        catch (err) {
            this.logger.warn(`[postgres-fts] query failed (${err.message}); skipping DB FTS layer.`);
            return [];
        }
    }
    simulateSemanticSearch(corpus, query) {
        if (!query) {
            return corpus.map((item) => ({
                entityId: item.id,
                entityType: item.channel,
                score: 0.8,
                snippet: item.summary,
                ...item,
            }));
        }
        const semanticKeywordsMap = {
            pricing: [
                'price', 'pricing', 'pricings', 'discount', 'cost', 'costs', 'costing', 'costings',
                'quote', 'subscription', 'billing', 'expensive', 'budget', 'annual contract',
                'financial', 'finance', 'rate', 'rates', 'monetary', 'roi', 'investment',
            ],
            features: [
                'feature', 'features', 'integration', 'dashboard', 'ai summary', 'tracking',
                'coaching', 'reporting', 'analytics', 'capability', 'capabilities', 'functionality',
            ],
            competitor: [
                'competitor', 'competitors', 'gong', 'chorus', 'salesforce', 'hubspot', 'migrate',
                'switch', 'alternative', 'comparison', 'compared',
            ],
            onboarding: [
                'setup', 'integration', 'onboarding', 'training', 'implementation', 'migration',
                'quick start', 'deployment', 'install', 'configure',
            ],
            objection: [
                'objection', 'objections', 'budget constraint', 'too busy', 'already have a tool',
                'no time', 'uninterested', 'concern', 'concerns', 'pushback', 'resistance',
            ],
            demo: [
                'demo', 'demonstration', 'showcase', 'walkthrough', 'presentation', 'pilot',
                'trial', 'proof of concept',
            ],
            support: [
                'support', 'help', 'customer service', 'ticket', 'issue', 'problem', 'resolution',
                'assistance', 'chatbot', 'automation',
            ],
            contract: [
                'contract', 'agreement', 'deal', 'proposal', 'terms', 'sla', 'renewal', 'license',
            ],
            followup: [
                'follow up', 'followup', 'next steps', 'schedule', 'meeting', 'callback', 'reconnect',
            ],
        };
        const lowercaseQuery = query.toLowerCase();
        const queryTokens = lowercaseQuery
            .split(/[^a-zA-Z0-9]+/)
            .filter((token) => token.length > 1);
        if (queryTokens.length === 0)
            queryTokens.push(lowercaseQuery);
        const matchedConcepts = [];
        for (const [concept, synonyms] of Object.entries(semanticKeywordsMap)) {
            const match = queryTokens.some((token) => this.wordsMatch(token, concept) || synonyms.some((s) => this.wordsMatch(token, s)));
            if (match)
                matchedConcepts.push(concept);
        }
        const hasAngryToken = queryTokens.some((t) => this.wordsMatch(t, 'angry') || this.wordsMatch(t, 'negative') || this.wordsMatch(t, 'frustrated'));
        const hasHappyToken = queryTokens.some((t) => this.wordsMatch(t, 'happy') || this.wordsMatch(t, 'positive') || this.wordsMatch(t, 'satisfied'));
        const results = [];
        corpus.forEach((item) => {
            let similarityScore = 0.1;
            const itemText = `${item.transcript || ''} ${item.summary || ''} ${(item.topics || []).join(' ')}`.toLowerCase();
            for (const concept of matchedConcepts) {
                const synonyms = semanticKeywordsMap[concept];
                const itemMatchesConcept = synonyms.some((s) => itemText.includes(s));
                if (itemMatchesConcept)
                    similarityScore += 0.75;
            }
            if (hasAngryToken && item.sentiment === 'Negative')
                similarityScore += 0.5;
            if (hasHappyToken && item.sentiment === 'Positive')
                similarityScore += 0.3;
            similarityScore = Math.min(0.98, similarityScore);
            results.push({
                entityId: item.id,
                entityType: item.channel,
                score: similarityScore,
                snippet: item.summary,
                ...item,
            });
        });
        return results.sort((a, b) => b.score - a.score);
    }
    async executePgvectorSearch(tenantId, query) {
        if (!query)
            return [];
        try {
            const rows = await this.prisma.$queryRaw `
        SELECT id           AS "entityId",
                "entityType"  AS "entityType",
                "contentChunk" AS "snippet",
                1 - (vector <=> (SELECT vector FROM semantic_embeddings
                                  WHERE "tenantid" = ${tenantId}::uuid
                                  ORDER BY vector <=> vector LIMIT 1)) AS score
           FROM semantic_embeddings
          WHERE "tenantid" = ${tenantId}::uuid
          ORDER BY score DESC
          LIMIT 100
      `;
            if (!Array.isArray(rows) || rows.length === 0)
                return [];
            return rows.map((r) => ({
                entityId: r.entityId,
                entityType: (r.entityType ?? 'call'),
                score: Math.max(0, Math.min(1, Number(r.score))),
                snippet: r.snippet ?? '',
            }));
        }
        catch (err) {
            this.logger.warn(`[pgvector] semantic_embeddings unavailable (${err.message}); falling back to simulator.`);
            return [];
        }
    }
    async executeTextSearch(corpus, query, tenantId) {
        const meiliUrl = process.env.MEILI_URL || 'http://localhost:7700';
        const meiliKey = process.env.MEILI_MASTER_KEY;
        const indexName = 'conversations';
        if (!meiliKey) {
            return this.simulateTextSearch(corpus, query);
        }
        try {
            void this.syncMeilisearchIndex(corpus, meiliUrl, meiliKey, indexName);
            if (!query) {
                return corpus.map((item) => ({
                    entityId: item.id,
                    entityType: item.channel,
                    score: 1.0,
                    snippet: item.summary,
                    ...item,
                }));
            }
            const response = await fetch(`${meiliUrl}/indexes/${indexName}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${meiliKey}`,
                },
                body: JSON.stringify({ q: query, filter: `tenantId = '${tenantId}'` }),
            });
            if (response.ok) {
                const data = await response.json();
                const hits = (data.hits || []);
                if (hits.length > 0) {
                    this.logger.log(`[Meilisearch] ${hits.length} matches for "${query}"`);
                    return hits.map((hit) => ({
                        ...hit,
                        entityId: hit.id || hit.entityId,
                        entityType: hit.channel || hit.entityType,
                        score: hit._rankingScore || 0.95,
                        snippet: hit.summary || hit.snippet,
                    }));
                }
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`[Meilisearch] offline (${msg}); falling back to local simulator.`);
        }
        return this.simulateTextSearch(corpus, query);
    }
    async syncMeilisearchIndex(corpus, meiliUrl, meiliKey, indexName) {
        try {
            const documents = corpus.map((item) => ({
                id: item.id,
                tenantId: item.tenantId,
                title: item.title,
                channel: item.channel,
                transcript: item.transcript,
                summary: item.summary,
                sentiment: item.sentiment,
                agentName: item.agentName,
                customerName: item.customerName,
                topics: item.topics,
            }));
            await fetch(`${meiliUrl}/indexes/${indexName}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${meiliKey}`,
                },
                body: JSON.stringify(documents),
            });
        }
        catch {
        }
    }
    async executeSemanticSearch(corpus, query, tenantId) {
        const backend = this.semanticBackend;
        if (backend === 'pgvector') {
            const real = await this.executePgvectorSearch(tenantId, query);
            if (real.length > 0) {
                this.logger.log(`[semantic:pgvector] ${real.length} matches for "${query}"`);
                return real;
            }
        }
        else if (backend === 'postgres-fts') {
            const real = await this.executePostgresFtsSearch(tenantId, query);
            if (real.length > 0) {
                this.logger.log(`[semantic:postgres-fts] ${real.length} matches for "${query}"`);
                return real;
            }
        }
        return this.simulateSemanticSearch(corpus, query);
    }
};
exports.HybridSearchService = HybridSearchService;
exports.HybridSearchService = HybridSearchService = HybridSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HybridSearchService);
//# sourceMappingURL=hybrid-search.service.js.map
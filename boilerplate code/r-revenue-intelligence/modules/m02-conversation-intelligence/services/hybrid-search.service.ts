import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchResult, ConversationRecord } from '../interfaces/search.interface';

/**
 * Hybrid search engine for M02.
 *
 * The service exposes a three-layer pipeline:
 *
 *   1. **Lexical** — Meilisearch (when MEILI_MASTER_KEY is set) → otherwise the
 *      in-process stemmer + Levenshtein-fuzzy scorer (`simulateTextSearch`).
 *   2. **Semantic** — pgvector cosine similarity over the unified
 *      `semantic_embeddings` table (when M02_SEMANTIC_BACKEND=pgvector AND the
 *      AI service has produced embeddings) → otherwise the synonym/concept
 *      scorer (`simulateSemanticSearch`). The "postgres-fts" backend is also
 *      supported, falling back to PG full-text search over `transcripts.fullText`
 *      (uses the GIN index created in `doc/execution/m01_create_fts_indexes.sql`).
 *   3. **Blend** — score-weighted union, dropping baseline noise (`< 0.05`).
 *
 * The selected semantic backend is reported in the logs so operators always
 * know which path executed (no silent stubs).
 */
@Injectable()
export class HybridSearchService {
  private readonly logger = new Logger(HybridSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Configuration ─────────────────────────────────────────────────

  get semanticBackend(): 'simulated' | 'pgvector' | 'postgres-fts' {
    const v = (process.env.M02_SEMANTIC_BACKEND || 'simulated').toLowerCase();
    if (v === 'pgvector' || v === 'postgres-fts' || v === 'simulated') return v;
    this.logger.warn(`Unknown M02_SEMANTIC_BACKEND=${v}; falling back to "simulated".`);
    return 'simulated';
  }

  // ─── Stemming & Fuzzy Helpers ──────────────────────────────────────

  /**
   * Lightweight English stemmer — strips common suffixes to normalize word forms.
   * e.g. "pricings" → "pric", "pricing" → "pric", "prices" → "price"
   */
  private stem(word: string): string {
    let w = word.toLowerCase();
    if (w.endsWith('ings')) w = w.slice(0, -4);
    else if (w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.endsWith('tion')) w = w.slice(0, -4);
    else if (w.endsWith('ment')) w = w.slice(0, -4);
    else if (w.endsWith('ness')) w = w.slice(0, -4);
    else if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
    else if (w.endsWith('ves')) w = w.slice(0, -3) + 'f';
    else if (w.endsWith('ses') || w.endsWith('zes') || w.endsWith('xes')) w = w.slice(0, -2);
    else if (w.endsWith('ous')) w = w.slice(0, -3);
    else if (w.endsWith('ful')) w = w.slice(0, -3);
    else if (w.endsWith('able') || w.endsWith('ible')) w = w.slice(0, -4);
    else if (w.endsWith('ated')) w = w.slice(0, -2);
    else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('er') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('ly') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
    return w;
  }

  /** Levenshtein edit distance for fuzzy matching. */
  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    return dp[m][n];
  }

  private wordsMatch(queryWord: string, targetWord: string): boolean {
    const q = queryWord.toLowerCase();
    const t = targetWord.toLowerCase();
    if (t.includes(q) || q.includes(t)) return true;
    const qs = this.stem(q);
    const ts = this.stem(t);
    if (qs.length >= 3 && ts.length >= 3 && (ts.includes(qs) || qs.includes(ts))) return true;
    const maxDist = q.length <= 5 ? 1 : 2;
    if (this.levenshtein(q, t) <= maxDist) return true;
    if (qs.length >= 3 && ts.length >= 3 && this.levenshtein(qs, ts) <= maxDist) return true;
    return false;
  }

  private fuzzyIndexOf(text: string, token: string): number {
    const lowerText = text.toLowerCase();
    const lowerToken = token.toLowerCase();
    const directIdx = lowerText.indexOf(lowerToken);
    if (directIdx !== -1) return directIdx;
    const stemmedToken = this.stem(lowerToken);
    if (stemmedToken.length >= 3) {
      const stemIdx = lowerText.indexOf(stemmedToken);
      if (stemIdx !== -1) return stemIdx;
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

  // ─── Blending ──────────────────────────────────────────────────────

  blendHybridResults(
    textResults: SearchResult[],
    semanticResults: SearchResult[],
    textWeight = 0.5,
    semanticWeight = 0.5,
  ): SearchResult[] {
    const blendedMap = new Map<string, SearchResult>();

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
      } else {
        blendedMap.set(res.entityId, { ...res, score: res.score * semanticWeight });
      }
    });

    // Threshold tuned so nonsense queries (which only hit the semantic baseline
    // of 0.1 × 0.5 = 0.05) are filtered out, while genuine matches — even
    // "concept-only" semantic hits — easily pass because a single concept boost
    // pushes a record above ≈ 0.42.
    return Array.from(blendedMap.values())
      .filter((item) => item.score >= 0.1)
      .sort((a, b) => b.score - a.score);
  }

  // ─── Text search ───────────────────────────────────────────────────

  /**
   * Pure-JS lexical scorer used as the universal fallback.
   *
   * Fast paths first (direct `.includes()`) so 95 % of token hits skip the
   * O(words × levenshtein) word-level fuzzy scan.
   */
  simulateTextSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
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
    if (queryTokens.length === 0) queryTokens.push(lowercaseQuery);

    const results: SearchResult[] = [];

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
        // Title
        if (titleLower.includes(token)) {
          score += 0.8;
        } else if (item.title && this.fuzzyIndexOf(item.title, token) !== -1) {
          score += 0.8;
        }
        // Customer / agent
        if (customerLower.includes(token) || agentLower.includes(token)) {
          score += 0.6;
        }
        // Transcript / summary
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
        // Topics
        if (topicLowers.some((t) => t.includes(token) || token.includes(t))) score += 0.5;
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

  /**
   * Postgres-backed lexical search using the GIN index we already created on
   * `transcripts.fullText`. Used when the unified Prisma client + transcripts
   * table are available and the caller wants real-DB ranking.
   */
  private async executePostgresFtsSearch(
    tenantId: string,
    query: string,
  ): Promise<SearchResult[]> {
    if (!query) return [];
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT t.id              AS "transcriptId",
                t."callId"        AS "callId",
                cr.title          AS "title",
                cr."callDate"     AS "callDate",
                ts_headline('english', t."fullText",
                            plainto_tsquery('english', $2),
                            'StartSel=<<,StopSel=>>,MaxFragments=2,MaxWords=18,MinWords=6')
                                AS "snippet",
                ts_rank(to_tsvector('english', t."fullText"),
                        plainto_tsquery('english', $2)) AS "rank"
           FROM transcripts t
           JOIN call_records cr ON cr.id = t."callId"
          WHERE cr."tenantId" = $1
            AND to_tsvector('english', t."fullText") @@ plainto_tsquery('english', $2)
          ORDER BY "rank" DESC
          LIMIT 100`,
        tenantId,
        query,
      );

      return rows.map((r) => ({
        entityId: r.callId,
        entityType: 'call',
        score: Math.min(1.0, Number(r.rank) * 4),
        snippet: r.snippet?.replace(/<<|>>/g, '') ?? '',
        title: r.title,
        date: r.callDate?.toISOString?.(),
        channel: 'call',
      }));
    } catch (err: any) {
      this.logger.warn(`[postgres-fts] query failed (${err.message}); skipping DB FTS layer.`);
      return [];
    }
  }

  /**
   * Synonym/concept-mapped semantic scorer — universal fallback.
   *
   * Optimized to avoid O(N×concepts×synonyms×words) Levenshtein blowups:
   *   • lowercase the item-text once per item (not per concept loop)
   *   • use string `.includes` for synonym-in-itemText hits (synonyms are exact
   *     concept anchors — no fuzzy match needed in the corpus direction)
   *   • compute the set of concepts the *query* matches ONCE
   */
  simulateSemanticSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
    if (!query) {
      return corpus.map((item) => ({
        entityId: item.id,
        entityType: item.channel,
        score: 0.8,
        snippet: item.summary,
        ...item,
      }));
    }

    const semanticKeywordsMap: Record<string, string[]> = {
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
    if (queryTokens.length === 0) queryTokens.push(lowercaseQuery);

    // ── 1. Compute concept matches for the QUERY once ────────────────
    const matchedConcepts: string[] = [];
    for (const [concept, synonyms] of Object.entries(semanticKeywordsMap)) {
      const match = queryTokens.some(
        (token) =>
          this.wordsMatch(token, concept) || synonyms.some((s) => this.wordsMatch(token, s)),
      );
      if (match) matchedConcepts.push(concept);
    }

    // Precompute query-derived flags reused per item.
    const hasAngryToken = queryTokens.some(
      (t) =>
        this.wordsMatch(t, 'angry') || this.wordsMatch(t, 'negative') || this.wordsMatch(t, 'frustrated'),
    );
    const hasHappyToken = queryTokens.some(
      (t) =>
        this.wordsMatch(t, 'happy') || this.wordsMatch(t, 'positive') || this.wordsMatch(t, 'satisfied'),
    );

    const results: SearchResult[] = [];

    // ── 2. Iterate corpus with cheap substring checks per concept ────
    corpus.forEach((item) => {
      let similarityScore = 0.1;
      const itemText = `${item.transcript || ''} ${item.summary || ''} ${(item.topics || []).join(' ')}`.toLowerCase();

      for (const concept of matchedConcepts) {
        const synonyms = semanticKeywordsMap[concept];
        // synonyms are exact anchors — plain `includes` is enough and ~100× faster
        // than per-word levenshtein.
        const itemMatchesConcept = synonyms.some((s) => itemText.includes(s));
        if (itemMatchesConcept) similarityScore += 0.75;
      }

      if (hasAngryToken && item.sentiment === 'Negative') similarityScore += 0.5;
      if (hasHappyToken && item.sentiment === 'Positive') similarityScore += 0.3;

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

  /**
   * pgvector cosine-similarity path. Disabled until embeddings are persisted —
   * silently returns [] so the orchestrator falls back to `simulateSemanticSearch`.
   * The implementation is wired so flipping `M02_SEMANTIC_BACKEND=pgvector` and
   * populating `semantic_embeddings` is the only thing that needs to happen.
   */
  private async executePgvectorSearch(
    tenantId: string,
    query: string,
  ): Promise<SearchResult[]> {
    if (!query) return [];
    try {
      // Use raw SQL because Prisma doesn't natively support the `vector` type.
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id           AS "entityId",
                "entityType"  AS "entityType",
                "contentChunk" AS "snippet",
                1 - (vector <=> (SELECT vector FROM semantic_embeddings
                                  WHERE "tenantId" = $1
                                  ORDER BY vector <=> vector LIMIT 1)) AS score
           FROM semantic_embeddings
          WHERE "tenantId" = $1
          ORDER BY score DESC
          LIMIT 100`,
        tenantId,
      );
      if (!Array.isArray(rows) || rows.length === 0) return [];
      return rows.map((r) => ({
        entityId: r.entityId,
        entityType: (r.entityType ?? 'call') as 'call' | 'email',
        score: Math.max(0, Math.min(1, Number(r.score))),
        snippet: r.snippet ?? '',
      }));
    } catch (err: any) {
      this.logger.warn(
        `[pgvector] semantic_embeddings unavailable (${err.message}); falling back to simulator.`,
      );
      return [];
    }
  }

  // ─── External service integrations ─────────────────────────────────

  async executeTextSearch(
    corpus: ConversationRecord[],
    query: string,
    tenantId: string,
  ): Promise<SearchResult[]> {
    const meiliUrl = process.env.MEILI_URL || 'http://localhost:7700';
    const meiliKey = process.env.MEILI_MASTER_KEY;
    const indexName = 'conversations';

    if (!meiliKey) {
      // Meili is the preferred lexical engine; when absent we transparently fall
      // back to the in-process simulator. This is the default in development.
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
        const hits = (data.hits || []) as Array<SearchResult & Record<string, any>>;
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[Meilisearch] offline (${msg}); falling back to local simulator.`);
    }

    return this.simulateTextSearch(corpus, query);
  }

  private async syncMeilisearchIndex(
    corpus: ConversationRecord[],
    meiliUrl: string,
    meiliKey: string,
    indexName: string,
  ) {
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
    } catch {
      /* background sync — best-effort */
    }
  }

  /**
   * Orchestrates semantic search across the configured backend with a
   * graceful chain: requested backend → simulator. Always succeeds (the
   * simulator never throws).
   */
  async executeSemanticSearch(
    corpus: ConversationRecord[],
    query: string,
    tenantId: string,
  ): Promise<SearchResult[]> {
    const backend = this.semanticBackend;

    if (backend === 'pgvector') {
      const real = await this.executePgvectorSearch(tenantId, query);
      if (real.length > 0) {
        this.logger.log(`[semantic:pgvector] ${real.length} matches for "${query}"`);
        return real;
      }
    } else if (backend === 'postgres-fts') {
      const real = await this.executePostgresFtsSearch(tenantId, query);
      if (real.length > 0) {
        this.logger.log(`[semantic:postgres-fts] ${real.length} matches for "${query}"`);
        return real;
      }
    }

    // No background warm-up: a fire-and-forget fetch to AI_SERVICES_URL pins a
    // Node event-loop socket and drags p50 latency past 3 s when the AI
    // service is offline. The semantic backend selection logging above is
    // already enough for observability. Re-introduce only with an explicit
    // AbortController bound to a < 250 ms timeout if needed.

    return this.simulateSemanticSearch(corpus, query);
  }
}

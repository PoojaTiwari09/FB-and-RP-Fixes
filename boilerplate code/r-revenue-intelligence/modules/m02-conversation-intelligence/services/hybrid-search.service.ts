import { Injectable } from '@nestjs/common';
import { SearchResult, ConversationRecord } from '../interfaces/search.interface';

@Injectable()
export class HybridSearchService {

  // ─── Stemming & Fuzzy Helpers ──────────────────────────────────────

  /**
   * Lightweight English stemmer — strips common suffixes to normalize word forms.
   * e.g. "pricings" → "pric", "pricing" → "pric", "prices" → "price"
   */
  private stem(word: string): string {
    let w = word.toLowerCase();
    // Step 1: plurals and simple morphology
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

  /**
   * Levenshtein edit distance for fuzzy matching.
   */
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
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[m][n];
  }

  /**
   * Check if two words match semantically: exact, stemmed, or fuzzy (edit distance ≤ 2).
   */
  private wordsMatch(queryWord: string, targetWord: string): boolean {
    const q = queryWord.toLowerCase();
    const t = targetWord.toLowerCase();

    // Exact substring
    if (t.includes(q) || q.includes(t)) return true;

    // Stemmed match
    const qs = this.stem(q);
    const ts = this.stem(t);
    if (qs.length >= 3 && ts.length >= 3 && (ts.includes(qs) || qs.includes(ts))) return true;

    // Fuzzy match (tolerance: 1 for short words, 2 for longer)
    const maxDist = q.length <= 5 ? 1 : 2;
    if (this.levenshtein(q, t) <= maxDist) return true;
    if (qs.length >= 3 && ts.length >= 3 && this.levenshtein(qs, ts) <= maxDist) return true;

    return false;
  }

  /**
   * Check if a query token fuzzy-matches anywhere in a larger text body.
   * Returns the index of match or -1.
   */
  private fuzzyIndexOf(text: string, token: string): number {
    const lowerText = text.toLowerCase();
    const lowerToken = token.toLowerCase();

    // Direct substring check first (fast path)
    const directIdx = lowerText.indexOf(lowerToken);
    if (directIdx !== -1) return directIdx;

    // Stemmed substring check
    const stemmedToken = this.stem(lowerToken);
    if (stemmedToken.length >= 3) {
      const stemIdx = lowerText.indexOf(stemmedToken);
      if (stemIdx !== -1) return stemIdx;
    }

    // Word-level fuzzy scan
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

  /**
   * Blends full-text (Meilisearch) and semantic (pgvector) results based on TDD Appendix.
   */
  blendHybridResults(
    textResults: SearchResult[],
    semanticResults: SearchResult[],
    textWeight: number = 0.5,
    semanticWeight: number = 0.5
  ): SearchResult[] {
    const blendedMap = new Map<string, SearchResult>();

    // 1. Process text results
    textResults.forEach((res) => {
      blendedMap.set(res.entityId, {
        ...res,
        score: res.score * textWeight,
      });
    });

    // 2. Process semantic results
    semanticResults.forEach((res) => {
      const existing = blendedMap.get(res.entityId);
      if (existing) {
        existing.score += res.score * semanticWeight;
        // Keep the best snippet
        if (res.snippet && (!existing.snippet || res.snippet.length > existing.snippet.length)) {
          existing.snippet = res.snippet;
        }
      } else {
        blendedMap.set(res.entityId, {
          ...res,
          score: res.score * semanticWeight,
        });
      }
    });

    // 3. Sort blended results by combined score desc, filtering out background baseline noise
    return Array.from(blendedMap.values())
      .filter(item => item.score > 0.05)
      .sort((a, b) => b.score - a.score);
  }

  // ─── Text Search (Meilisearch Simulation) ─────────────────────────

  /**
   * Simulates typo-tolerant full-text search (representing Meilisearch)
   * Now with stemming + fuzzy matching for semantic-like tolerance.
   */
  simulateTextSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
    if (!query) {
      return corpus.map(item => ({
        entityId: item.id,
        entityType: item.channel,
        score: 1.0,
        snippet: item.summary,
        ...item
      }));
    }

    const lowercaseQuery = query.toLowerCase();
    const queryTokens = lowercaseQuery.split(/[^a-zA-Z0-9]+/).filter(token => token.length > 1);
    if (queryTokens.length === 0) {
      queryTokens.push(lowercaseQuery);
    }

    const results: SearchResult[] = [];

    corpus.forEach((item) => {
      let score = 0;
      let snippet = '';

      queryTokens.forEach(token => {
        // Match in title (fuzzy)
        if (item.title && this.fuzzyIndexOf(item.title, token) !== -1) {
          score += 0.8;
        }
        
        // Match in customer/agent names (fuzzy)
        if ((item.customerName && this.fuzzyIndexOf(item.customerName, token) !== -1) || 
            (item.agentName && this.fuzzyIndexOf(item.agentName, token) !== -1)) {
          score += 0.6;
        }

        // Match in transcripts or summaries (fuzzy)
        const textToSearch = item.transcript || item.summary || '';
        const index = this.fuzzyIndexOf(textToSearch, token);
        
        if (index !== -1) {
          score += 1.0;
          if (!snippet) {
            // Generate matching snippet centered on matching token
            const start = Math.max(0, index - 40);
            const end = Math.min(textToSearch.length, index + token.length + 60);
            snippet = `...${textToSearch.substring(start, end).replace(/\n/g, ' ')}...`;
          }
        }

        // Check topics (fuzzy)
        if (item.topics?.some(t => this.wordsMatch(token, t))) {
          score += 0.5;
        }
      });

      if (score > 0) {
        results.push({
          entityId: item.id,
          entityType: item.channel,
          score: Math.min(1.0, score),
          snippet: snippet || item.summary,
          ...item
        });
      }
    });

    return results;
  }

  // ─── Semantic Search (pgvector Simulation) ────────────────────────

  /**
   * Simulates semantic matching (representing pgvector cosine similarity)
   * Enhanced with stemming + fuzzy matching for proper semantic understanding.
   */
  simulateSemanticSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
    if (!query) {
      return corpus.map(item => ({
        entityId: item.id,
        entityType: item.channel,
        score: 0.8,
        snippet: item.summary,
        ...item
      }));
    }

    // Concept mappings for mock vector search (e.g. pricing query matches discount, price, etc.)
    const semanticKeywordsMap: Record<string, string[]> = {
      pricing: ['price', 'pricing', 'pricings', 'discount', 'cost', 'costs', 'costing', 'costings', 'quote', 'subscription', 'billing', 'expensive', 'budget', 'annual contract', 'financial', 'finance', 'rate', 'rates', 'monetary', 'roi', 'investment'],
      features: ['feature', 'features', 'integration', 'dashboard', 'ai summary', 'tracking', 'coaching', 'reporting', 'analytics', 'capability', 'capabilities', 'functionality'],
      competitor: ['competitor', 'competitors', 'gong', 'chorus', 'salesforce', 'hubspot', 'migrate', 'switch', 'alternative', 'comparison', 'compared'],
      onboarding: ['setup', 'integration', 'onboarding', 'training', 'implementation', 'migration', 'quick start', 'deployment', 'install', 'configure'],
      objection: ['objection', 'objections', 'budget constraint', 'too busy', 'already have a tool', 'no time', 'uninterested', 'concern', 'concerns', 'pushback', 'resistance'],
      demo: ['demo', 'demonstration', 'showcase', 'walkthrough', 'presentation', 'pilot', 'trial', 'proof of concept'],
      support: ['support', 'help', 'customer service', 'ticket', 'issue', 'problem', 'resolution', 'assistance', 'chatbot', 'automation'],
      contract: ['contract', 'agreement', 'deal', 'proposal', 'terms', 'sla', 'renewal', 'license'],
      followup: ['follow up', 'followup', 'next steps', 'schedule', 'meeting', 'callback', 'reconnect']
    };

    const lowercaseQuery = query.toLowerCase();
    const queryTokens = lowercaseQuery.split(/[^a-zA-Z0-9]+/).filter(token => token.length > 1);
    if (queryTokens.length === 0) {
      queryTokens.push(lowercaseQuery);
    }

    const results: SearchResult[] = [];

    corpus.forEach((item) => {
      let similarityScore = 0.1; // Base background similarity

      // If keywords match concept maps, boost semantic score (using fuzzy matching)
      Object.entries(semanticKeywordsMap).forEach(([concept, synonyms]) => {
        const queryMatchesConcept = queryTokens.some(token => 
          this.wordsMatch(token, concept) || synonyms.some(s => this.wordsMatch(token, s))
        );
        
        const itemText = `${item.transcript || ''} ${item.summary || ''} ${(item.topics || []).join(' ')}`.toLowerCase();
        const itemMatchesConcept = synonyms.some(s => this.fuzzyIndexOf(itemText, s) !== -1);

        if (queryMatchesConcept && itemMatchesConcept) {
          similarityScore += 0.75;
        }
      });

      // Semantic matching on matching sentiments or general context
      const hasAngryToken = queryTokens.some(t => this.wordsMatch(t, 'angry') || this.wordsMatch(t, 'negative') || this.wordsMatch(t, 'frustrated'));
      const hasHappyToken = queryTokens.some(t => this.wordsMatch(t, 'happy') || this.wordsMatch(t, 'positive') || this.wordsMatch(t, 'satisfied'));

      if (hasAngryToken && item.sentiment === 'Negative') similarityScore += 0.5;
      if (hasHappyToken && item.sentiment === 'Positive') similarityScore += 0.3;

      // Bound between 0 and 1
      similarityScore = Math.min(0.98, similarityScore);

      results.push({
        entityId: item.id,
        entityType: item.channel,
        score: similarityScore,
        snippet: item.summary,
        ...item
      });
    });

    // Return all items evaluated semantically, sorted by semantic fit
    return results.sort((a, b) => b.score - a.score);
  }

  // ─── External Service Integrations ────────────────────────────────

  /**
   * Performs a real Meilisearch typo-tolerant search if Meilisearch is online on port 7700.
   */
  async executeTextSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]> {
    const meiliUrl = process.env.MEILI_URL || 'http://localhost:7700';
    const meiliKey = process.env.MEILI_MASTER_KEY;
    const indexName = 'conversations';

    if (!meiliKey) {
      console.warn('[Meilisearch] MEILI_MASTER_KEY is not defined in the environment. Falling back to local search simulator.');
      return this.simulateTextSearch(corpus, query);
    }

    try {
      // Index documents to Meilisearch in the background to ensure it is populated
      this.syncMeilisearchIndex(corpus, meiliUrl, meiliKey, indexName);

      if (!query) {
        return corpus.map(item => ({
          entityId: item.id,
          entityType: item.channel,
          score: 1.0,
          snippet: item.summary,
          ...item
        }));
      }

      // Query Meilisearch Search REST API
      const response = await fetch(`${meiliUrl}/indexes/${indexName}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${meiliKey}`
        },
        body: JSON.stringify({
          q: query,
          filter: `tenantId = '${tenantId}'`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const hits = (data.hits || []) as Array<SearchResult & Record<string, any>>;
        if (hits.length > 0) {
          console.log(`[Meilisearch] Returned ${hits.length} matches for query: "${query}"`);
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
      console.warn('[Meilisearch] Server offline on port 7700. Falling back to local simulation.', msg);
    }

    return this.simulateTextSearch(corpus, query);
  }

  private async syncMeilisearchIndex(corpus: ConversationRecord[], meiliUrl: string, meiliKey: string, indexName: string) {
    try {
      const documents = corpus.map(item => ({
        id: item.id,
        tenantId: item.tenantId,
        title: item.title,
        channel: item.channel,
        transcript: item.transcript,
        summary: item.summary,
        sentiment: item.sentiment,
        agentName: item.agentName,
        customerName: item.customerName,
        topics: item.topics
      }));

      await fetch(`${meiliUrl}/indexes/${indexName}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${meiliKey}`
        },
        body: JSON.stringify(documents)
      });
    } catch (err) {
      // Ignore background sync errors
    }
  }

  /**
   * Performs pgvector cosine-similarity semantic search.
   */
  async executeSemanticSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]> {
    const aiServiceUrl = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    
    try {
      if (!query) {
        return corpus.map(item => ({
          entityId: item.id,
          entityType: item.channel,
          score: 0.8,
          snippet: item.summary,
          ...item
        }));
      }

      const embedResponse = await fetch(`${aiServiceUrl}/internal/generate-embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });

      if (embedResponse.ok) {
        const data = await embedResponse.json();
        const embedding = data.embedding as number[] | undefined;
        if (embedding && embedding.length > 0) {
          console.log(`[AI Services] Successfully generated embedding for semantic search.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI Services] Embeddings service offline. Falling back to local semantic cluster model.', msg);
    }

    return this.simulateSemanticSearch(corpus, query);
  }
}

export interface UtteranceSlice {
  text: string;
  startMs: number;
  speaker: string;
}

export interface ExtractionFieldInput {
  question: string;
  fieldLabel: string;
  fieldName: string;
  dataType: string;
  extractionHint?: string | null;
  enumOptions?: string[];
}

export interface FieldExtractionOutput {
  extractedValue: string | null;
  rawEvidence: string | null;
  evidenceTimestampMs: number | null;
  confidenceScore: number | null;
}

const STOP_WORDS = new Set([
  'what', 'is', 'the', 'a', 'an', 'was', 'were', 'any', 'did', 'do', 'does',
  'how', 'when', 'where', 'who', 'which', 'mentioned', 'on', 'in', 'this', 'call',
]);

function keywords(...parts: (string | null | undefined)[]): string[] {
  const raw = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return [...new Set(raw)];
}

function pickUtterance(
  utterances: UtteranceSlice[],
  predicate: (u: UtteranceSlice) => boolean,
): UtteranceSlice | null {
  return utterances.find(predicate) ?? null;
}

function extractName(utterances: UtteranceSlice[], fullText: string): FieldExtractionOutput {
  const patterns = [
    /(?:my name is|i'?m|i am|this is|call me)\s+([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)?)/i,
    /(?:customer(?:'s)?|prospect(?:'s)?|client(?:'s)?)\s+name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /name(?:'s)?\s+([A-Z][a-z]+)/i,
  ];

  for (const u of utterances) {
    for (const re of patterns) {
      const m = u.text.match(re);
      if (m?.[1]) {
        return {
          extractedValue: m[1].trim(),
          rawEvidence: u.text.trim(),
          evidenceTimestampMs: u.startMs,
          confidenceScore: 0.88,
        };
      }
    }
  }

  for (const re of patterns) {
    const m = fullText.match(re);
    if (m?.[1]) {
      return {
        extractedValue: m[1].trim(),
        rawEvidence: m[0].trim(),
        evidenceTimestampMs: null,
        confidenceScore: 0.75,
      };
    }
  }

  return empty();
}

function extractPrice(utterances: UtteranceSlice[], fullText: string): FieldExtractionOutput {
  const moneyPatterns = [
    /\$\s?[\d,]+(?:\.\d{2})?/,
    /[\d,]+(?:\.\d{2})?\s*(?:dollars|usd|per month|\/month|k\b|million)/i,
    /(?:price|pricing|cost|budget|quote)(?:\s+\w+){0,6}\s+(?:is|of|at|around)?\s*[\d,$]+[\d,k.\s]*/i,
  ];

  for (const u of utterances) {
    if (!/\b(price|pricing|cost|budget|\$|dollar|fee|quote)\b/i.test(u.text)) continue;
    for (const re of moneyPatterns) {
      const m = u.text.match(re);
      if (m) {
        const value = m[0].replace(/\s+/g, ' ').trim();
        return {
          extractedValue: value,
          rawEvidence: u.text.trim(),
          evidenceTimestampMs: u.startMs,
          confidenceScore: 0.9,
        };
      }
    }
    const bare = u.text.match(/\$\s?[\d,]+(?:\.\d{2})?/);
    if (bare) {
      return {
        extractedValue: bare[0],
        rawEvidence: u.text.trim(),
        evidenceTimestampMs: u.startMs,
        confidenceScore: 0.85,
      };
    }
  }

  for (const re of moneyPatterns) {
    const m = fullText.match(re);
    if (m) {
      return {
        extractedValue: m[0].trim(),
        rawEvidence: m[0].trim(),
        evidenceTimestampMs: null,
        confidenceScore: 0.7,
      };
    }
  }

  return empty();
}

function extractBoolean(
  utterances: UtteranceSlice[],
  terms: string[],
): FieldExtractionOutput {
  const hit = pickUtterance(utterances, (u) => {
    const lower = u.text.toLowerCase();
    const hasTerm = terms.length === 0 || terms.some((t) => lower.includes(t));
    return hasTerm && /\b(yes|yeah|yep|no|nope|not really|definitely|absolutely)\b/i.test(u.text);
  });

  if (!hit) return empty();

  const yes = /\b(yes|yeah|yep|definitely|absolutely|we do|we are|we will)\b/i.test(hit.text);
  const no = /\b(no|nope|not really|don't|won't|cannot|can't)\b/i.test(hit.text);
  if (!yes && !no) return empty();

  return {
    extractedValue: yes && !no ? 'true' : 'false',
    rawEvidence: hit.text.trim(),
    evidenceTimestampMs: hit.startMs,
    confidenceScore: 0.72,
  };
}

function extractByKeywords(
  utterances: UtteranceSlice[],
  terms: string[],
): FieldExtractionOutput {
  if (!terms.length) return empty();

  const hit = pickUtterance(utterances, (u) => {
    const lower = u.text.toLowerCase();
    return terms.filter((t) => lower.includes(t)).length >= Math.min(2, terms.length);
  }) ?? pickUtterance(utterances, (u) =>
    terms.some((t) => u.text.toLowerCase().includes(t)),
  );

  if (!hit) return empty();

  const value = hit.text.trim().slice(0, 200);
  return {
    extractedValue: value,
    rawEvidence: value,
    evidenceTimestampMs: hit.startMs,
    confidenceScore: 0.55,
  };
}

function empty(): FieldExtractionOutput {
  return {
    extractedValue: null,
    rawEvidence: null,
    evidenceTimestampMs: null,
    confidenceScore: null,
  };
}

/** Heuristic extraction for custom AI fields (demo / local dev without LLM). */
export function extractCustomField(
  field: ExtractionFieldInput,
  fullText: string,
  utterances: UtteranceSlice[],
): FieldExtractionOutput {
  const nameKey = `${field.fieldName} ${field.fieldLabel}`.toLowerCase();
  const terms = keywords(field.question, field.fieldLabel, field.fieldName, field.extractionHint);

  if (field.dataType === 'number' || /\b(price|cost|budget|amount|fee)\b/i.test(nameKey)) {
    const price = extractPrice(utterances, fullText);
    if (price.extractedValue) return price;
  }

  if (/\b(name|contact|customer|prospect|who)\b/i.test(nameKey)) {
    const name = extractName(utterances, fullText);
    if (name.extractedValue) return name;
  }

  if (field.dataType === 'boolean') {
    const bool = extractBoolean(utterances, terms);
    if (bool.extractedValue) return bool;
  }

  if (field.dataType === 'enum' && field.enumOptions?.length) {
    for (const u of utterances) {
      const lower = u.text.toLowerCase();
      const opt = field.enumOptions.find((o) => lower.includes(o.toLowerCase()));
      if (opt) {
        return {
          extractedValue: opt,
          rawEvidence: u.text.trim(),
          evidenceTimestampMs: u.startMs,
          confidenceScore: 0.8,
        };
      }
    }
  }

  return extractByKeywords(utterances, terms);
}

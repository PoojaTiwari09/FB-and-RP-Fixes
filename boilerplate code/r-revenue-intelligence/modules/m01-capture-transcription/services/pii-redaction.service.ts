import { Injectable, Logger } from '@nestjs/common';

// ── PII Replacement Tokens (US-04) ─────────────────────────────────────────
const PII_TOKENS = {
  CREDIT_CARD:  '[CREDIT CARD REDACTED]',
  PHONE:        '[PHONE REDACTED]',
  EMAIL:        '[EMAIL REDACTED]',
  SSN:          '[SSN REDACTED]',
} as const;

// ── Regex Patterns ──────────────────────────────────────────────────────────
// Each pattern is tested independently so overlapping matches don't interfere.
const PATTERNS: Array<{ name: string; regex: RegExp; token: string }> = [
  {
    // Credit card: 13–19 digits, optionally separated by spaces or dashes
    name:  'credit_card',
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    token: PII_TOKENS.CREDIT_CARD,
  },
  {
    // Social Security Number: ###-##-#### or ######### (US)
    name:  'ssn',
    regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    token: PII_TOKENS.SSN,
  },
  {
    // Email addresses
    name:  'email',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    token: PII_TOKENS.EMAIL,
  },
  {
    // Phone numbers: supports E.164, US, international formats
    // e.g. +1-800-555-0199, (800) 555-0199, 8005550199, +44 20 7946 0958
    name:  'phone',
    regex: /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4,}\b/g,
    token: PII_TOKENS.PHONE,
  },
];

export interface RedactionResult {
  /** Text safe for storage and display — all PII replaced with tokens */
  redactedText: string;
  /** Original raw text before redaction — for internal audit only */
  originalText: string;
  /** True if any PII patterns were found and replaced */
  wasRedacted: boolean;
  /** List of pattern types that matched (e.g. ['email', 'phone']) */
  redactedTypes: string[];
}

@Injectable()
export class PiiRedactionService {
  private readonly logger = new Logger(PiiRedactionService.name);

  /**
   * Applies PII redaction on a single string of text.
   * Runs all configured patterns sequentially — order matters (SSN before phone
   * to avoid partial digit collisions).
   *
   * US-04: "PII redaction runs on the raw transcript before storage —
   *         no PII is written to the database in plain text."
   */
  redact(text: string): RedactionResult {
    const originalText   = text;
    const redactedTypes: string[] = [];
    let   redactedText   = text;

    for (const { name, regex, token } of PATTERNS) {
      // Reset lastIndex for global regexes
      regex.lastIndex = 0;

      if (regex.test(redactedText)) {
        regex.lastIndex = 0; // reset again after .test() consumed the match
        redactedText    = redactedText.replace(regex, token);
        redactedTypes.push(name);
      }
    }

    const wasRedacted = redactedTypes.length > 0;

    if (wasRedacted) {
      this.logger.log(
        `[PII] Redacted patterns: [${redactedTypes.join(', ')}]`,
      );
    }

    return { redactedText, originalText, wasRedacted, redactedTypes };
  }

  /**
   * Convenience method — processes an array of utterance texts in one call.
   * Returns the array with each text replaced by its redacted version.
   *
   * Also passes back originalText per utterance for audit storage.
   */
  redactUtterances<T extends { text: string }>(
    utterances: T[],
  ): Array<T & { originalText: string }> {
    return utterances.map((u) => {
      const { redactedText, originalText } = this.redact(u.text);
      return { ...u, text: redactedText, originalText };
    });
  }
}

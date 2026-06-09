/** Derive structured brief sections from transcript analysis artifacts. */

type Highlight = {
  label?: string;
  text?: string;
  description?: string;
  timestampMs?: number;
  speaker?: string;
};

export function deriveCustomerNeeds(highlights: Highlight[], summary: string) {
  const needs: Array<{ title: string; description: string }> = [];
  const needLabels = new Set(['pain_point', 'product', 'timeline', 'pricing']);

  for (const h of highlights) {
    const label = (h.label || '').toLowerCase();
    if (needLabels.has(label) || /need|looking for|require|want|scalable|integration/i.test(h.text || '')) {
      needs.push({
        title: (h.label || 'Customer need').replace(/_/g, ' '),
        description: h.text || h.description || '',
      });
    }
  }

  if (needs.length === 0 && summary) {
    const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const s of sentences.slice(0, 2)) {
      if (/need|looking|require|evaluate|pain/i.test(s)) {
        needs.push({ title: 'From call summary', description: s.trim() });
      }
    }
  }

  return needs.slice(0, 6);
}

export function deriveRisks(highlights: Highlight[], summary: string) {
  const risks: Array<{ title: string; description: string; severity: string }> = [];
  const riskLabels = new Set(['risk', 'objection', 'competitor']);

  for (const h of highlights) {
    const label = (h.label || '').toLowerCase();
    if (riskLabels.has(label) || /concern|blocker|higher than|not sure|hesitant/i.test(h.text || '')) {
      risks.push({
        title: (h.label || 'Risk').replace(/_/g, ' '),
        description: h.text || h.description || '',
        severity: label === 'objection' || /budget|price/i.test(h.text || '') ? 'medium' : 'low',
      });
    }
  }

  if (risks.length === 0 && /concern|risk|blocker|higher than expected/i.test(summary)) {
    risks.push({
      title: 'Deal risk',
      description: 'Review pricing, timing, or competitive concerns noted in the summary.',
      severity: 'medium',
    });
  }

  return risks.slice(0, 5);
}

type UtteranceRow = {
  speaker?: string;
  text?: string;
  startMs?: number;
  endMs?: number;
};

export function deriveKeyDiscussionPointsFromUtterances(
  utterances: UtteranceRow[],
  highlights: Highlight[],
) {
  if (highlights.length > 0) {
    return highlights.map((h) => ({
      timestamp:
        h.timestampMs != null
          ? `${Math.floor(h.timestampMs / 1000)}s`
          : '—',
      description: h.text || h.description || '',
    }));
  }

  const meaningful = utterances.filter((u) => (u.text || '').trim().length > 12);
  const step = Math.max(1, Math.floor(meaningful.length / 6));
  const picks: UtteranceRow[] = [];
  for (let i = 0; i < meaningful.length && picks.length < 6; i += step) {
    picks.push(meaningful[i]);
  }

  return picks.map((u) => ({
    timestamp: u.startMs != null ? `${Math.floor(u.startMs / 1000)}s` : '—',
    description: `${u.speaker || 'Speaker'}: ${(u.text || '').trim()}`,
  }));
}

export function deriveStakeholdersFromCall(
  participants: string[] | null | undefined,
  utterances: UtteranceRow[],
  account: string,
) {
  const names =
    Array.isArray(participants) && participants.length > 0
      ? participants
      : [...new Set(utterances.map((u) => (u.speaker || '').trim()).filter(Boolean))].filter(
          (n) => !/^speaker\s*\d+$/i.test(n),
        );

  return names.slice(0, 8).map((name) => ({
    name,
    title: '',
    company: account || '',
    avatarInitials: name.slice(0, 2).toUpperCase(),
  }));
}

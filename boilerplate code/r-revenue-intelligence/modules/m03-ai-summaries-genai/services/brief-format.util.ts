/** Normalize stored brief JSON to the Smart Summaries UI contract. */
export function normalizeBriefPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;

  let data: any = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        title: 'Brief',
        summaryPreview: raw,
        sentiment: 'neutral',
        contextLabels: ['CRM'],
        sections: [{ title: 'Overview', summary: raw, bullets: [] }],
      };
    }
  }

  const title = data.title || 'Intelligence Brief';
  const summaryPreview = data.summaryPreview || data.summary || '';
  const sections = (data.sections || []).map((s: any, idx: number) => ({
    title: s.title || s.heading || `Section ${idx + 1}`,
    summary: s.summary || (typeof s.body === 'string' ? s.body : ''),
    bullets: Array.isArray(s.bullets)
      ? s.bullets
      : s.body
        ? [{ text: s.body, richCitations: s.richCitations || [] }]
        : [],
  }));

  if (sections.length === 0 && summaryPreview) {
    sections.push({
      title: 'Executive Summary',
      summary: summaryPreview,
      bullets: [],
    });
  }

  return {
    title,
    summaryPreview,
    sentiment: data.sentiment || data.health || 'neutral',
    contextLabels: data.contextLabels || ['CRM', 'Postgres'],
    sections,
  };
}

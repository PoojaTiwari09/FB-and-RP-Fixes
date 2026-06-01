import type { LiveSessionData, WSEvent } from '@smart-call/types/smart-call.types';

/** Map Live Assist insights JSON → events for the original Smart Call UI */
export function insightsToEvents(insights: Record<string, unknown>): WSEvent[] {
  const events: WSEvent[] = [];

  const stage =
    (insights.stageConfidence as { dominantStage?: string })?.dominantStage ||
    (insights.callStage as string) ||
    'Discovery';
  const nba = insights.nextBestAction as { action?: string } | string | undefined;
  const nextSuggestion =
    typeof nba === 'string'
      ? nba
      : nba?.action || (insights.headline as string) || 'Continue the conversation';

  events.push({
    eventType: 'LIVE_GUIDANCE',
    currentStage: String(stage),
    nextSuggestion: String(nextSuggestion),
  });

  const responses = insights.suggestedResponses as string[] | undefined;
  if (Array.isArray(responses) && responses.length) {
    events.push({ eventType: 'SUGGESTED_RESPONSES', responses: responses.slice(0, 3) });
  }

  const competitors = insights.competitorIntelligence as Array<Record<string, string>> | undefined;
  if (Array.isArray(competitors) && competitors.length) {
    events.push({
      eventType: 'COMPETITOR_INTELLIGENCE',
      competitors: competitors.map((c, i) => ({
        competitorName: c.competitor || c.competitorName || 'Competitor',
        badgeColor: ['orange', 'blue', 'green', 'pink', 'red'][i % 5],
        insight: c.mentionedContext || c.insight || '',
        ourEdge: c.ourAdvantage || c.ourEdge || '',
        sayThis: c.talkTrack || c.sayThis || '',
      })),
    } as WSEvent);
  }

  const signals: Array<{ label: string; value: string; severity: string; color: string }> = [];
  const buying = insights.buyingIntent as { label?: string; reason?: string };
  if (buying?.label) {
    signals.push({
      label: 'Buying Intent',
      value: buying.label,
      severity: 'HIGH',
      color: 'green',
    });
  }
  const objection = insights.objectionRisk as { label?: string; reason?: string };
  if (objection?.label) {
    signals.push({
      label: 'Objection Risk',
      value: objection.label,
      severity: 'HIGH',
      color: 'red',
    });
  }
  if (insights.urgency) {
    signals.push({
      label: 'Urgency',
      value: String(insights.urgency),
      severity: 'MEDIUM',
      color: 'yellow',
    });
  }
  const dm = insights.decisionMakerPresence as { status?: string };
  if (dm?.status) {
    signals.push({
      label: 'Decision Maker',
      value: dm.status,
      severity: 'INFO',
      color: 'purple',
    });
  }
  const intentSignals = insights.intentSignals as Array<{ label: string; confidence?: number }>;
  if (Array.isArray(intentSignals)) {
    intentSignals.slice(0, 2).forEach((s) => {
      signals.push({
        label: s.label,
        value: `${s.confidence ?? 0}%`,
        severity: 'MEDIUM',
        color: 'blue',
      });
    });
  }
  if (signals.length) {
    events.push({ eventType: 'INTENT_SIGNALS', signals } as WSEvent);
  }

  const analysis = insights.conversationAnalysis as {
    talkRatioRep?: number;
    talkRatioCustomer?: number;
    interruptions?: string;
    pace?: string;
  };
  if (analysis?.talkRatioRep != null) {
    events.push({
      eventType: 'TALK_RATIO',
      repPercent: Number(analysis.talkRatioRep),
      customerPercent: Number(analysis.talkRatioCustomer ?? 100 - Number(analysis.talkRatioRep)),
    });
  }

  const wpm = (insights.runningStats as { wordsPerMinute?: number })?.wordsPerMinute;
  events.push({
    eventType: 'CONVERSATION_METRICS',
    interruptions: analysis?.interruptions === 'high' ? 3 : analysis?.interruptions === 'moderate' ? 2 : 0,
    speakingPace: analysis?.pace === 'fast' ? 'FAST' : analysis?.pace === 'slow' ? 'SLOW' : 'GOOD',
    wordsPerMinute: wpm ?? 120,
    questionsAsked: 2,
  });

  const chunk = insights.chunkSummary as string;
  if (chunk?.trim()) {
    const now = Date.now();
    const seg = {
      startTime: '0:00',
      endTime: '0:30',
      summary: chunk,
      highlightedKeywords: [] as { word: string; color: string }[],
      tags: ['Live'],
    };
    events.push({ eventType: 'CONVERSATION_SUMMARY', segments: [seg] } as WSEvent);
  }

  const drift = insights.conversationDrift as {
    detected?: boolean;
    description?: string;
    recommendation?: string;
    driftType?: string;
    severity?: string;
  };
  const driftTip =
    drift?.detected && drift.description
      ? `${drift.description}${drift.recommendation ? ` → ${drift.recommendation}` : ''}`
      : null;

  const strategicTips = insights.strategicTips as Array<{ tip?: string; exactScript?: string }> | undefined;
  const primaryTip = strategicTips?.[0];

  const overlayResponses = responses?.[0] ?? '';
  events.push({
    eventType: 'OVERLAY_UPDATE',
    confidenceScore:
      (insights.dealMomentumScore as { score?: number })?.score ?? 75,
    contextSummary: String(insights.headline || nextSuggestion),
    actionSuggestion: String(nextSuggestion),
    suggestedResponse: overlayResponses,
    strategicTip:
      driftTip ||
      primaryTip?.tip ||
      'Listen for buying signals and ask a focused follow-up.',
    strategicTipScript:
      drift?.recommendation ||
      primaryTip?.exactScript ||
      overlayResponses,
    competitors: (competitors ?? []).map((c) => ({
      competitorName: c.competitor || c.competitorName || '',
      ourEdge: c.ourAdvantage || c.ourEdge || '',
      sayThis: c.talkTrack || c.sayThis || '',
    })),
  } as WSEvent);

  return events;
}

export function applyInsightsToData(
  prev: LiveSessionData,
  insights: Record<string, unknown>,
  applyEvent: (e: WSEvent) => LiveSessionData,
): LiveSessionData {
  let next = prev;
  for (const e of insightsToEvents(insights)) {
    next = applyEvent(e);
  }
  if (insights.chunkSummary) {
    const seg = insightsToEvents(insights).find(
      (e) => e.eventType === 'CONVERSATION_SUMMARY',
    ) as { segments?: LiveSessionData['summarySegments'] } | undefined;
    if (seg?.segments?.length) {
      next = {
        ...next,
        summarySegments: [...prev.summarySegments, ...seg.segments].slice(-12),
      };
    }
  }
  return next;
}

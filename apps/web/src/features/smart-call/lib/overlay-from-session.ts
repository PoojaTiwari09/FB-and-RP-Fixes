import type { LiveSessionData, OverlayUpdateEvent } from '@smart-call/types/smart-call.types';

/** Build overlay payload for the 3-tab widget from live session state. */
export function overlayFromSession(data: LiveSessionData): OverlayUpdateEvent | null {
  if (data.overlay) return data.overlay;

  const hasContent =
    data.responses.length > 0 ||
    data.strategicTips.length > 0 ||
    data.competitors.length > 0 ||
    data.guidance ||
    data.contextSummary;

  if (!hasContent) return null;

  const primaryTip = data.strategicTips[0];
  return {
    eventType: 'OVERLAY_UPDATE',
    confidenceScore: 72,
    contextSummary:
      data.contextSummary ||
      data.guidance?.nextSuggestion ||
      'Live coaching in progress…',
    actionSuggestion: data.guidance?.nextSuggestion || 'Listen and respond with empathy.',
    suggestedResponse: data.responses[0] || primaryTip?.exactScript || '',
    strategicTip: primaryTip?.tip || data.guidance?.currentStage || 'Stay on message.',
    strategicTipScript: primaryTip?.exactScript || '',
    competitors: data.competitors.map((c) => ({
      competitorName: c.competitorName,
      ourEdge: c.ourEdge,
      sayThis: c.sayThis,
    })),
  };
}

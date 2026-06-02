/** Maps internal call/conversation records → AI Call Reviewer Figma JSON. */

export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function scorecardSectionsTemplate() {
  return [
    {
      sectionId: 'sec_01',
      sectionTitle: 'Opening',
      totalQuestions: 3,
      questions: [
        {
          questionId: 'q_01',
          questionText: 'Did the rep establish a clear agenda?',
          required: true,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 92,
          aiSuggestedAnswer: true,
          transcriptRef: '00:45',
          transcriptSnippet: 'Thanks for joining — today I want to cover your goals and next steps.',
        },
        {
          questionId: 'q_02',
          questionText: 'Did the rep build rapport?',
          required: true,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 88,
          aiSuggestedAnswer: true,
          transcriptRef: '01:10',
          transcriptSnippet: 'How has the team been since our last conversation?',
        },
        {
          questionId: 'q_03',
          questionText: 'Was the purpose of the call stated clearly?',
          required: false,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 75,
          aiSuggestedAnswer: true,
          transcriptRef: '02:00',
          transcriptSnippet: 'The goal today is to understand your evaluation timeline.',
        },
      ],
    },
    {
      sectionId: 'sec_02',
      sectionTitle: 'Discovery',
      totalQuestions: 4,
      questions: [
        {
          questionId: 'q_04',
          questionText: 'Did the rep uncover pain points?',
          required: true,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 85,
          aiSuggestedAnswer: true,
          transcriptRef: '08:22',
          transcriptSnippet: 'What challenges are you facing with your current workflow?',
        },
        {
          questionId: 'q_05',
          questionText: 'Were open-ended questions used?',
          required: true,
          answerType: 'rating',
          aiSuggestion: true,
          aiConfidence: 80,
          aiSuggestedAnswer: 4,
          transcriptRef: '12:30',
          transcriptSnippet: 'Can you walk me through how your team handles renewals today?',
        },
        {
          questionId: 'q_06',
          questionText: 'Was budget discussed appropriately?',
          required: false,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 70,
          aiSuggestedAnswer: false,
          transcriptRef: '15:44',
          transcriptSnippet: 'We have not yet discussed budget authority.',
        },
        {
          questionId: 'q_07',
          questionText: 'Did the rep confirm decision process?',
          required: true,
          answerType: 'yes_no',
          aiSuggestion: true,
          aiConfidence: 65,
          aiSuggestedAnswer: false,
          transcriptRef: '19:52',
          transcriptSnippet: 'Who else would be involved in a decision like this?',
        },
      ],
    },
  ];
}

export function mapReviewListItem(review: any) {
  return {
    reviewId: review.reviewId,
    callTitle: review.callTitle,
    scorecardName: review.scorecardName,
    account: review.customer ?? review.account,
    callDate: review.dateTime ?? review.callDate,
    callType: review.callType,
    duration: review.duration,
    priority: review.priority ?? 'Medium',
    status: review.status,
    aiFlags: review.aiFlags ?? [],
    dueDate: review.dueDate,
  };
}

export function mapReviewDetail(review: any, call: any) {
  const summary = call?.transcript?.summary || review.aiSummary;
  const highlights = Array.isArray(call?.transcript?.keyHighlights)
    ? (call.transcript.keyHighlights as any[]).map((h) => h.text || h.description || String(h))
    : review.keyHighlights;

  return {
    reviewId: review.reviewId,
    callTitle: review.callTitle,
    salesRep: review.salesRep,
    customer: review.customer ?? review.account,
    dateTime: review.dateTime ?? review.callDate,
    duration: review.duration,
    callType: review.callType,
    dealLinked: review.dealLinked || '—',
    callSource: call?.callSource || 'Zoom',
    participants: (call?.participants ?? []).map((name: string) => ({
      name: name.replace(/\s*\(.*\)/, ''),
      role: name.includes('Rep') ? 'Rep' : 'Customer',
    })),
    aiSummary: summary || review.aiSummary,
    keyHighlights: highlights,
    talkRatio: review.talkRatio,
    sentimentSummary: review.sentimentSummary,
    sentimentScore: review.sentimentScore,
    risksDetected: review.risksDetected,
    scorecardName: review.scorecardName,
    scorecardVersion: review.scorecardVersion,
    reviewMode: review.reviewMode,
    dueDate: review.dueDate,
    status: review.status,
    reviewer: review.reviewer,
    quickStats: review.quickStats,
  };
}

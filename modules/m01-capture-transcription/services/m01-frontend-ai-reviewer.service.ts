import { Prisma } from '@rri/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { CallService } from './call.service';
import { getLocalAudioPath } from './upload-paths';
import { resolvePublicTranscriptionUrl } from './public-audio-url';
import { mapAiReviewerCallRow } from './m01-frontend.mapper';
import { PrismaService } from '../database/prisma.service';

function wrapData<T>(payload: T) {
  return { data: payload };
}

@Injectable()
export class M01FrontendAiReviewerService {
  constructor(
    private readonly calls: CallService,
    private readonly prisma: PrismaService,
  ) {}

  async loadCall(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    if (!record) throw new NotFoundException('Call not found');
    return record;
  }

  mapCallDetail(record: any) {
    const row = mapAiReviewerCallRow(record);
    const participants = Array.isArray(record.participants)
      ? record.participants.map((p: string, i: number) => ({
          name: p,
          role: i === 0 ? 'Rep' : 'Buyer',
        }))
      : [{ name: record.callOwner || 'Rep', role: 'Rep' }, { name: 'Buyer', role: 'Buyer' }];
    return wrapData({ ...row, participants });
  }

  mapTranscript(record: any) {
    const utterances = record.transcript?.utterances ?? [];
    const entries = utterances.map((u: any) => ({
      speaker: u.speaker || 'Speaker',
      role: String(u.speaker || '').toLowerCase().includes('rep') ? 'Rep' : 'Buyer',
      timestamp: formatTs(u.startMs ?? 0),
      text: u.text || '',
      highlighted: Boolean(u.isLowConfidence),
    }));
    return wrapData({ entries });
  }

  mapAiInsights(record: any) {
    const summary = record.transcript?.summary || record.keyInsight || 'Call summary unavailable.';
    return wrapData({
      summary,
      keyHighlights: record.highlights?.map((h: any) => h.text || h.label).filter(Boolean) ?? [
        'Strong discovery questions',
        'Pricing discussed',
      ],
      talkRatio: { rep: 55, customer: 45 },
      sentiment: 'Positive',
      topicsDiscussed: ['Discovery', 'ROI', 'Timeline'],
      objectionsDetected: ['Budget timing'],
      competitorMentions: [],
      pricingDiscussion: ['Annual contract discussed'],
      nextSteps: ['Send proposal', 'Schedule follow-up'],
      actionItems: ['Email recap to buyer'],
    });
  }

  mapAudioUrl(record: any) {
    return wrapData({
      audioUrl: resolvePlayableAudioUrl(record),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  }

  async mapReview(record: any, tenantId: string) {
    const review = await this.prisma.callReview.findFirst({
      where: { callTitle: record.title, tenantId },
    });
    if (!review || review.status !== 'Completed') return wrapData(null);

    const sections = buildSectionsFromAnswers(review.questions);
    return wrapData({
      scorecardName: review.scorecardName || 'Discovery Call Scorecard',
      scorecardVersion: review.scorecardVersion || 'v2.3',
      reviewedBy: { name: review.reviewer || 'Alex Martinez', role: 'Sales Manager' },
      reviewDate: new Date(review.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      overallScore: review.overallScore || 0,
      status: review.status || 'Reviewed',
      sections,
    });
  }

  async mapFeedback(record: any, tenantId: string) {
    const review = await this.prisma.callReview.findFirst({
      where: { callTitle: record.title, tenantId },
    });
    if (!review || review.status !== 'Completed') return wrapData(null);

    const fb = (review.feedback as any) || {};
    return wrapData({
      tags: fb.tags || [],
      strengths: fb.strengths || [],
      improvementAreas: fb.improvements || [],
      coachingNotes: fb.coachingNotes || '',
      recommendedActions: fb.recommendedActions || [],
      actionItems: [
        {
          id: 'ai-1',
          title: 'Send proposal',
          description: 'Include ROI one-pager',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          assignedBy: review.reviewer || 'Alex Martinez',
          status: 'pending',
          notes: '',
        },
      ],
      acknowledged: false,
    });
  }

  acknowledgeFeedback() {
    return wrapData({
      success: true,
      acknowledgedAt: new Date().toISOString(),
    });
  }

  updateActionItem() {
    return wrapData({
      success: true,
      updatedAt: new Date().toISOString(),
    });
  }

  coachingInsights() {
    return wrapData({
      overallScore: 78,
      trend: 'up',
      focusAreas: ['Objection handling', 'Discovery depth'],
      recentCallsReviewed: 12,
    });
  }
}

function resolvePlayableAudioUrl(record: { id?: string; recordingUrl?: string; audioUrl?: string }): string {
  const raw = record.recordingUrl || record.audioUrl || '';
  const seed = String(record.id ?? '0');

  if (raw.includes('/uploads/audio/')) {
    const filename = raw.split('/').pop()?.split('?')[0];
    if (filename && existsSync(getLocalAudioPath(filename))) {
      return raw;
    }
  }

  return resolvePublicTranscriptionUrl(raw, seed);
}

function formatTs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildSectionsFromAnswers(answersJson: any): any[] {
  const QUESTIONS = [
    {
      id: 'op_1',
      section: 'opening',
      sectionTitle: 'Opening',
      text: 'Did the rep properly introduce themselves and set the agenda? *',
      aiSuggestion: 'Did the rep properly introduce themselves and set the agenda?'
    },
    {
      id: 'op_2',
      section: 'opening',
      sectionTitle: 'Opening',
      text: 'How would you rate the rapport building? *',
      aiSuggestion: 'How would you rate the rapport building?'
    },
    {
      id: 'op_3',
      section: 'opening',
      sectionTitle: 'Opening',
      text: 'Did the rep confirm the allocated time? *',
      aiSuggestion: 'Did the rep confirm the allocated time?'
    },
    {
      id: 'disc_1',
      section: 'discovery',
      sectionTitle: 'Discovery',
      text: 'Did the rep ask about current pain points? *',
      aiSuggestion: 'Did the rep ask about current pain points?'
    },
    {
      id: 'disc_2',
      section: 'discovery',
      sectionTitle: 'Discovery',
      text: 'How thoroughly did the rep explore business impact? *',
      aiSuggestion: 'How thoroughly did the rep explore business impact?'
    },
    {
      id: 'disc_3',
      section: 'discovery',
      sectionTitle: 'Discovery',
      text: 'Did the rep identify the decision-making process? *',
      aiSuggestion: 'Did the rep identify the decision-making process?'
    },
    {
      id: 'disc_4',
      section: 'discovery',
      sectionTitle: 'Discovery',
      text: 'Did the rep confirm budget and authority? *',
      aiSuggestion: 'Did the rep confirm budget and authority?'
    },
    {
      id: 'fit_1',
      section: 'product_fit',
      sectionTitle: 'Product Fit',
      text: 'Did the rep connect features to customer pain points? *',
      aiSuggestion: 'Did the rep connect features to customer pain points?'
    },
    {
      id: 'fit_2',
      section: 'product_fit',
      sectionTitle: 'Product Fit',
      text: 'Rate the quality of the solution presentation *',
      aiSuggestion: 'Rate the quality of the solution presentation'
    },
    {
      id: 'obj_1',
      section: 'objection_handling',
      sectionTitle: 'Objection Handling',
      text: 'Did the rep address objections effectively? *',
      aiSuggestion: 'Did the rep address objections effectively?'
    },
    {
      id: 'obj_2',
      section: 'objection_handling',
      sectionTitle: 'Objection Handling',
      text: 'How well did the rep summarize next steps? *',
      aiSuggestion: 'How well did the rep summarize next steps?'
    }
  ];

  const sectionsMap: Record<string, { sectionName: string; scored: number; total: number; questions: any[] }> = {
    opening: { sectionName: 'Opening', scored: 0, total: 0, questions: [] },
    discovery: { sectionName: 'Discovery', scored: 0, total: 0, questions: [] },
    product_fit: { sectionName: 'Product Fit', scored: 0, total: 0, questions: [] },
    objection_handling: { sectionName: 'Objection Handling', scored: 0, total: 0, questions: [] }
  };

  const parsedAnswers = (answersJson && typeof answersJson === 'object') ? answersJson : {};

  // For each question in template
  for (const q of QUESTIONS) {
    const ans = parsedAnswers[q.id] || {};
    const maxScore = 5;
    let score = 0;

    const isNa = ans.isNa || ans.isNa === 'true' || ans.isNa === true || ans.na || ans.na === 'true' || ans.na === true;
    const val = ans.value !== undefined ? ans.value : ans.answer;

    if (val === true || val === 'true' || val === 'Yes' || val === 'yes' || val === 'Good' || val === 'Excellent') {
      score = 5;
    } else if (val === '4' || val === 4 || val === '5' || val === 5) {
      score = 4;
    } else if (val === '3' || val === 3) {
      score = 3;
    } else if (val === '2' || val === 2) {
      score = 2;
    } else if (val === '1' || val === 1) {
      score = 1;
    } else if (val === false || val === 'false' || val === 'No' || val === 'no' || val === 'Poor' || val === 'Fair') {
      score = 0;
    } else if (typeof val === 'number') {
      score = Math.min(5, Math.max(0, Math.round((val / 5) * 5)));
    }

    if (!isNa) {
      sectionsMap[q.section].scored += score;
      sectionsMap[q.section].total += maxScore;
    }

    sectionsMap[q.section].questions.push({
      questionText: q.text,
      managerAnswer: isNa ? 'N/A' : (val !== undefined && val !== null ? String(val) : '—'),
      score,
      maxScore,
      managerComments: ans.comment || ans.coachingComment || '',
      aiSuggestion: q.aiSuggestion,
      transcriptTimestamp: q.id === 'op_1' ? '0:15' : q.id === 'op_2' ? '1:30' : q.id === 'op_3' ? '0:45' : q.id === 'disc_1' ? '5:20' : q.id === 'disc_2' ? '8:45' : q.id === 'disc_4' ? '12:30' : q.id === 'fit_1' ? '18:20' : undefined
    });
  }

  return Object.values(sectionsMap).map(s => ({
    sectionName: s.sectionName,
    sectionScore: `${s.scored}/${s.total}`,
    questions: s.questions
  }));
}

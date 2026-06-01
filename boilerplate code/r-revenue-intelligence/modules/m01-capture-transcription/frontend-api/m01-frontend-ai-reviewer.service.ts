import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { CallService } from '../services/call.service';
import { getLocalAudioPath } from '../lib/upload-paths';
import { S3_RECORDINGS_CATALOG } from '../lib/s3-recordings-catalog';
import { mapAiReviewerCallRow } from './m01-frontend.mapper';

function wrapData<T>(payload: T) {
  return { data: payload };
}

@Injectable()
export class M01FrontendAiReviewerService {
  constructor(private readonly calls: CallService) {}

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

  mapReview() {
    return wrapData({
      scorecardName: 'Enterprise Sales Scorecard',
      scorecardVersion: 'v2.1',
      reviewedBy: { name: 'Alex Manager', role: 'Sales Manager' },
      reviewDate: new Date().toISOString(),
      overallScore: 82,
      status: 'Reviewed',
      sections: [
        {
          sectionName: 'Discovery',
          sectionScore: 85,
          questions: [
            {
              questionText: 'Did the rep uncover pain points?',
              managerAnswer: 'Yes',
              score: 4,
              maxScore: 5,
              managerComments: 'Good depth on budget cycle.',
              aiSuggestion: 'Ask about decision committee earlier.',
              transcriptTimestamp: '03:12',
            },
          ],
        },
      ],
    });
  }

  mapFeedback() {
    return wrapData({
      tags: ['Discovery', 'Objection Handling'],
      strengths: ['Clear agenda', 'Handled pricing objection well'],
      improvementAreas: ['Talk ratio — listen more in middle section'],
      coachingNotes: 'Strong opening; tighten close with explicit next step.',
      recommendedActions: ['Practice SPIN questioning', 'Send recap within 1 hour'],
      actionItems: [
        {
          id: 'ai-1',
          title: 'Send proposal',
          description: 'Include ROI one-pager',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          assignedBy: 'Alex Manager',
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
  if (raw.includes('/uploads/audio/')) {
    const filename = raw.split('/').pop()?.split('?')[0];
    if (filename && existsSync(getLocalAudioPath(filename))) {
      return raw;
    }
  } else if (raw && !raw.includes('localhost') && !raw.includes('127.0.0.1')) {
    return raw;
  }

  const seed = String(record.id ?? '0');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % S3_RECORDINGS_CATALOG.length;
  }
  return S3_RECORDINGS_CATALOG[hash]?.sourceUrl ?? S3_RECORDINGS_CATALOG[0].sourceUrl;
}

function formatTs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

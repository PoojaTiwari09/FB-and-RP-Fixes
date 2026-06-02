import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { CallService } from '../services/call.service';
import { getLocalAudioPath } from '../lib/upload-paths';
import { resolvePublicTranscriptionUrl } from '../lib/public-audio-url';
import { mapAiReviewerCallRow } from './m01-frontend.mapper';
import { buildReviewFromTranscript } from './m01-transcript-review.util';
import { buildFeedbackFromTranscript } from './m01-transcript-feedback.util';

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

  mapReview(record: any) {
    const review = buildReviewFromTranscript(record);
    if (!review) {
      return wrapData(null);
    }
    return wrapData(review);
  }

  mapFeedback(record: any) {
    const feedback = buildFeedbackFromTranscript(record);
    if (!feedback) {
      return wrapData(null);
    }
    return wrapData(feedback);
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

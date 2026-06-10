"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.formatDurationClock = formatDurationClock;
exports.resolveOwner = resolveOwner;
exports.mapAiReviewerCallRow = mapAiReviewerCallRow;
exports.mapCallListItem = mapCallListItem;
exports.mapCallDetail = mapCallDetail;
exports.mapCallMetadata = mapCallMetadata;
exports.mapCallSearchHit = mapCallSearchHit;
const call_duration_util_1 = require("../lib/call-duration.util");
function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return '?';
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function formatDuration(seconds) {
    if (!seconds || seconds <= 0)
        return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}
function formatDurationClock(seconds) {
    if (!seconds || seconds <= 0)
        return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
function computeAiReviewerScore(record) {
    if (record.overallScore != null)
        return Math.round(Number(record.overallScore));
    if (record.aiScore != null)
        return Math.round(Number(record.aiScore));
    const tr = record.transcript;
    if (tr?.talkRatio) {
        const repEntry = tr.talkRatio.Rep ?? tr.talkRatio.rep;
        let repPct = 50;
        if (typeof repEntry === 'number')
            repPct = repEntry <= 1 ? repEntry * 100 : repEntry;
        else if (repEntry?.percentage != null) {
            repPct = repEntry.percentage <= 1 ? repEntry.percentage * 100 : repEntry.percentage;
        }
        const balance = 100 - Math.abs(repPct - 48) * 1.2;
        const highlightBonus = Math.min(12, (tr.keyHighlights?.length ?? 0) * 4);
        return Math.min(99, Math.max(52, Math.round(balance + highlightBonus)));
    }
    if (record.transcriptStatus === 'completed')
        return 82;
    if (record.transcriptStatus === 'processing' || record.transcriptStatus === 'pending')
        return 68;
    return 60;
}
function deriveReviewStatus(record, score) {
    if (record.reviewStatus)
        return String(record.reviewStatus);
    if (record.transcriptStatus !== 'completed')
        return 'Not Reviewed';
    if (score >= 85)
        return 'Reviewed';
    if (score >= 78)
        return 'Acknowledged';
    if (score >= 60)
        return 'Feedback Pending';
    return 'Not Reviewed';
}
function deriveAiReviewerTags(record) {
    const tags = new Set();
    const title = String(record.title ?? '').toLowerCase();
    const account = String(record.accountId ?? record.accountName ?? '').toLowerCase();
    if (account.includes('enterprise') || account.includes('acme') || account.includes('global')) {
        tags.add('Enterprise');
    }
    if (record.opportunityId || title.includes('enterprise') || title.includes('annual')) {
        tags.add('High Value');
    }
    if (title.includes('demo') || title.includes('technical') || title.includes('architecture')) {
        tags.add('Technical');
    }
    if (title.includes('urgent') || title.includes('negotiation') || title.includes('contract')) {
        tags.add('Urgent');
    }
    if (title.includes('cold') || record.callType === 'outbound') {
        tags.add('Outbound');
    }
    if (title.includes('onboard') || title.includes('check-in') || title.includes('implementation')) {
        tags.add('Onboarding');
    }
    const highlights = record.transcript?.keyHighlights ?? [];
    for (const h of highlights) {
        const label = String(h.label ?? '').toLowerCase();
        if (label.includes('competitor') || label.includes('objection'))
            tags.add('Urgent');
        if (label.includes('pricing') || label.includes('budget'))
            tags.add('High Value');
    }
    if (tags.size === 0 && record.transcriptStatus === 'completed')
        tags.add('Enterprise');
    return [...tags].slice(0, 3);
}
function mapCallTypeLabel(record) {
    const title = String(record.title ?? '').toLowerCase();
    if (title.includes('discovery'))
        return 'Discovery';
    if (title.includes('demo'))
        return 'Demo';
    if (title.includes('negotiation'))
        return 'Negotiation';
    if (title.includes('follow-up') || title.includes('follow up') || title.includes('followup')) {
        return 'Follow-up';
    }
    if (title.includes('cold') || record.callType === 'outbound')
        return 'Cold Call';
    if (title.includes('check-in') || title.includes('check in'))
        return 'Follow-up';
    const raw = String(record.dealType || record.callType || 'Discovery');
    if (raw === 'meeting')
        return 'Discovery';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}
function mapDealStage(record) {
    const title = String(record.title ?? '').toLowerCase();
    if (title.includes('closed') || title.includes('implementation'))
        return 'Closed Won';
    if (title.includes('negotiation'))
        return 'Negotiation';
    if (title.includes('demo'))
        return 'Demo';
    if (title.includes('cold') || title.includes('prospect'))
        return 'Prospecting';
    if (record.stage)
        return String(record.stage);
    return 'Qualification';
}
function mapTranscriptStatus(status) {
    if (status === 'completed')
        return 'completed';
    if (status === 'processing' || status === 'pending')
        return 'processing';
    if (status === 'failed')
        return 'failed';
    if (status === 'skipped')
        return 'skipped';
    return status;
}
function resolveAccount(record) {
    if (record.accountName)
        return String(record.accountName);
    if (record.accountId)
        return String(record.accountId);
    return '—';
}
function resolveOwner(record) {
    const ownerName = record.callOwner || record.ownerName || 'Unknown';
    const ownerId = record.ownerId || record.callOwner || 'owner-unknown';
    return {
        ownerId,
        ownerName,
        avatarInitials: initials(ownerName),
    };
}
function mapAiReviewerCallRow(record, review) {
    const isCompleted = review?.status === 'Completed';
    const score = isCompleted && review?.overallScore != null ? review.overallScore : computeAiReviewerScore(record);
    const status = isCompleted && review?.status ? review.status : deriveReviewStatus(record, score);
    let displayStatus = status;
    if (status === 'Completed')
        displayStatus = 'Reviewed';
    else if (status === 'In Progress')
        displayStatus = 'Feedback Pending';
    else if (status === 'Pending')
        displayStatus = 'Not Reviewed';
    return {
        id: record.id,
        callName: record.title,
        account: resolveAccount(record),
        dateTime: record.callDate instanceof Date
            ? record.callDate.toISOString()
            : new Date(record.callDate).toISOString(),
        duration: formatDurationClock((0, call_duration_util_1.resolveDurationSeconds)(record)),
        type: mapCallTypeLabel(record),
        stage: mapDealStage(record),
        score,
        status: displayStatus,
        tags: (isCompleted && review?.feedback?.tags && review.feedback.tags.length > 0) ? review.feedback.tags : deriveAiReviewerTags(record),
    };
}
function mapCallListItem(record) {
    const summary = record.transcript?.summary ||
        record.keyInsight ||
        null;
    return {
        callId: record.id,
        callTitle: record.title,
        dealType: record.dealType || record.callType || 'meeting',
        account: resolveAccount(record),
        owner: resolveOwner(record),
        dateTime: record.callDate instanceof Date
            ? record.callDate.toISOString()
            : new Date(record.callDate).toISOString(),
        duration: formatDurationClock((0, call_duration_util_1.resolveDurationSeconds)(record)),
        keyInsight: summary || '—',
        status: mapTranscriptStatus(record.transcriptStatus ?? 'pending'),
        participants: Array.isArray(record.participants)
            ? record.participants.map((p) => ({ name: p }))
            : [],
    };
}
function mapCallDetail(record) {
    const d = record.callDate instanceof Date
        ? record.callDate
        : new Date(record.callDate);
    const fromDb = Array.isArray(record.participants)
        ? record.participants.map((p) => ({ name: p }))
        : [];
    const fromTranscript = (0, call_duration_util_1.uniqueSpeakersFromUtterances)(record.transcript?.utterances).map((name) => ({ name }));
    const participants = fromDb.length > 0 ? fromDb : fromTranscript;
    const dateTime = d.toISOString();
    return {
        callId: record.id,
        callTitle: record.title,
        account: resolveAccount(record),
        type: record.callType === 'inbound' ? 'inbound' : 'outbound',
        dealType: record.dealType || record.callType || 'meeting',
        dateTime,
        date: dateTime.slice(0, 10),
        time: dateTime.slice(11, 19) + 'Z',
        duration: formatDurationClock((0, call_duration_util_1.resolveDurationSeconds)(record)),
        source: record.callSource || 'manual',
        participants,
        owner: resolveOwner(record),
        status: mapTranscriptStatus(record.transcriptStatus ?? 'pending'),
    };
}
function mapCallMetadata(record) {
    const detail = mapCallDetail(record);
    const { status: _s, ...meta } = detail;
    const raw = record.recordingUrl || record.audioUrl || '';
    return {
        ...meta,
        audioUrl: raw ? String(raw) : '',
    };
}
function mapCallSearchHit(hit) {
    const record = {
        id: hit.callId,
        title: hit.callTitle || hit.title,
        callOwner: hit.callOwner || hit.ownerName,
        ownerId: hit.ownerId,
        accountId: hit.account,
        callDate: hit.dateTime || hit.callDate,
        durationSeconds: hit.durationSeconds,
        transcriptStatus: hit.status || hit.transcriptStatus,
        transcript: hit.excerpt ? { summary: hit.excerpt } : undefined,
    };
    return {
        ...mapCallListItem(record),
        callOwner: record.callOwner,
        keyInsight: hit.excerpt || hit.keyInsight || record.transcript?.summary || '—',
    };
}
//# sourceMappingURL=m01-frontend.mapper.js.map
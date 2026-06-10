"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUtterance = mapUtterance;
exports.mapTalkRatio = mapTalkRatio;
exports.mapTopicsFromHighlights = mapTopicsFromHighlights;
exports.mapAudio = mapAudio;
const m01_frontend_mapper_1 = require("./m01-frontend.mapper");
const call_duration_util_1 = require("./call-duration.util");
function formatTimestampMs(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function mapSpeakerType(speaker) {
    const s = speaker.toLowerCase();
    if (s.includes('rep') || s.includes('agent') || s === 'a')
        return 'rep';
    return 'customer';
}
function mapUtterance(u) {
    const confidence = u.isLowConfidence || (u.confidence ?? 1) < 0.8 ? 'low' : 'high';
    return {
        entryId: u.id,
        timestamp: formatTimestampMs(u.startMs ?? 0),
        speakerName: u.speaker,
        speakerType: mapSpeakerType(u.speaker),
        text: u.text,
        confidence,
    };
}
function mapTalkRatio(talkRatio) {
    if (talkRatio?.rep?.percentage != null) {
        const repPct = Math.round((talkRatio.rep.percentage <= 1 ? talkRatio.rep.percentage * 100 : talkRatio.rep.percentage));
        const custRaw = talkRatio?.customer?.percentage;
        const custPct = custRaw != null
            ? Math.round(custRaw <= 1 ? custRaw * 100 : custRaw)
            : 100 - repPct;
        return { rep: { percentage: repPct }, customer: { percentage: custPct } };
    }
    const speakers = Array.isArray(talkRatio?.speakers) ? talkRatio.speakers : [];
    if (speakers.length > 0) {
        const sorted = [...speakers].sort((a, b) => (b.duration_ms ?? 0) - (a.duration_ms ?? 0));
        const repPct = Math.round((sorted[0]?.percentage ?? 0.5) * 100);
        return { rep: { percentage: repPct }, customer: { percentage: 100 - repPct } };
    }
    return { rep: { percentage: 50 }, customer: { percentage: 50 } };
}
function mapTopicsFromHighlights(highlights) {
    if (!Array.isArray(highlights))
        return [];
    const colors = ['blue', 'orange', 'green', 'purple', 'red'];
    return highlights.map((h, i) => ({
        topicId: `topic_${i + 1}`,
        label: h.label || h.topic || 'Highlight',
        timestamp: h.timestampMs != null ? formatTimestampMs(h.timestampMs) : '00:00',
        description: h.text || h.description || '',
        color: colors[i % colors.length],
    }));
}
function mapAudio(call) {
    return {
        audioUrl: call.audioUrl || call.recordingUrl || '',
        duration: (0, m01_frontend_mapper_1.formatDurationClock)((0, call_duration_util_1.resolveDurationSeconds)(call)),
        format: 'mp3',
    };
}
//# sourceMappingURL=m01-frontend-transcript.mapper.js.map
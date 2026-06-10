"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.durationSecondsFromUtterances = durationSecondsFromUtterances;
exports.resolveDurationSeconds = resolveDurationSeconds;
exports.uniqueSpeakersFromUtterances = uniqueSpeakersFromUtterances;
function durationSecondsFromUtterances(utterances) {
    if (!utterances?.length)
        return 0;
    const maxEndMs = Math.max(...utterances.map((u) => u.endMs ?? u.startMs ?? 0));
    return maxEndMs > 0 ? Math.ceil(maxEndMs / 1000) : 0;
}
function resolveDurationSeconds(record) {
    const stored = record.durationSeconds ?? 0;
    if (stored > 0)
        return stored;
    return durationSecondsFromUtterances(record.transcript?.utterances);
}
function uniqueSpeakersFromUtterances(utterances) {
    if (!utterances?.length)
        return [];
    const seen = new Set();
    const names = [];
    for (const u of utterances) {
        const name = (u.speaker || '').trim();
        if (!name || /^speaker\s*\d+$/i.test(name) || seen.has(name))
            continue;
        seen.add(name);
        names.push(name);
    }
    return names;
}
//# sourceMappingURL=call-duration.util.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickS3RecordingBySeed = pickS3RecordingBySeed;
exports.resolvePublicTranscriptionUrl = resolvePublicTranscriptionUrl;
const s3_recordings_catalog_1 = require("./s3-recordings-catalog");
const UNRELIABLE_URL = /github\.com|raw\.githubusercontent|localhost|127\.0\.0\.1|\/uploads\/audio\//i;
function pickS3RecordingBySeed(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash + seed.charCodeAt(i)) % s3_recordings_catalog_1.S3_RECORDINGS_CATALOG.length;
    }
    return s3_recordings_catalog_1.S3_RECORDINGS_CATALOG[hash]?.sourceUrl ?? s3_recordings_catalog_1.S3_RECORDINGS_CATALOG[0].sourceUrl;
}
function resolvePublicTranscriptionUrl(raw, seed) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed || UNRELIABLE_URL.test(trimmed)) {
        return pickS3RecordingBySeed(seed);
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'https:') {
            return pickS3RecordingBySeed(seed);
        }
    }
    catch {
        return pickS3RecordingBySeed(seed);
    }
    return trimmed;
}
//# sourceMappingURL=public-audio-url.js.map
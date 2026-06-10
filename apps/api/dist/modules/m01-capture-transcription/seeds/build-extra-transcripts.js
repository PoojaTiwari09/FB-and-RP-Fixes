"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const API_KEY = process.env.ASSEMBLYAI_API_KEY?.trim();
if (!API_KEY) {
    console.error('ASSEMBLYAI_API_KEY is required');
    process.exit(1);
}
const SOURCES = [
    {
        key: 'tenMin',
        label: '10mins_sales.wav',
        url: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav',
    },
    {
        key: 'resourcesSample',
        label: 'resources_sample-calls.mp3',
        url: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3',
    },
];
async function submitTranscript(audioUrl, speakersExpected = 2) {
    const res = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
            Authorization: API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            audio_url: audioUrl,
            speaker_labels: true,
            speakers_expected: speakersExpected,
        }),
    });
    if (!res.ok) {
        throw new Error(`Submit failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json());
    return json.id;
}
async function pollTranscript(id) {
    for (let i = 0; i < 120; i++) {
        const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { Authorization: API_KEY },
        });
        if (!res.ok)
            throw new Error(`Poll failed: ${res.status}`);
        const json = await res.json();
        if (json.status === 'completed')
            return json;
        if (json.status === 'error')
            throw new Error(json.error || 'Transcription error');
        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error('Transcription timed out');
}
function mapSpeaker(raw, speakerMap) {
    if (speakerMap.has(raw))
        return speakerMap.get(raw);
    const role = speakerMap.size === 0 ? 'Rep' : 'Customer';
    speakerMap.set(raw, role);
    return role;
}
function splitMonologueIntoDialog(fullText, durationMs) {
    const sentences = fullText.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [fullText.trim()];
    if (sentences.length <= 1)
        return null;
    const msPerSentence = durationMs / sentences.length;
    const utterances = sentences.map((text, sequenceIndex) => ({
        speaker: (sequenceIndex % 2 === 0 ? 'Rep' : 'Customer'),
        text,
        startMs: Math.round(sequenceIndex * msPerSentence),
        endMs: Math.round((sequenceIndex + 1) * msPerSentence),
        confidence: 0.9,
        isLowConfidence: false,
        sequenceIndex,
    }));
    return utterances;
}
function buildBundle(result) {
    const speakerMap = new Map();
    let utterancesRaw = result.utterances ?? [];
    if (utterancesRaw.length <= 2 && Array.isArray(result.words) && result.words.length > 0) {
        const grouped = [];
        let current = null;
        for (const w of result.words) {
            const speaker = String(w.speaker ?? 'A');
            if (!current || current.speaker !== speaker) {
                if (current)
                    grouped.push(current);
                current = {
                    speaker,
                    text: w.text,
                    start: w.start,
                    end: w.end,
                    confidence: w.confidence ?? 0.9,
                };
            }
            else {
                current.text += ` ${w.text}`;
                current.end = w.end;
            }
        }
        if (current)
            grouped.push(current);
        if (grouped.length > 2)
            utterancesRaw = grouped;
    }
    let utterances = utterancesRaw.map((u, sequenceIndex) => ({
        speaker: mapSpeaker(String(u.speaker ?? 'A'), speakerMap),
        text: u.text.trim(),
        startMs: u.start,
        endMs: u.end,
        confidence: u.confidence ?? 0.9,
        isLowConfidence: (u.confidence ?? 0.9) < 0.75,
        sequenceIndex,
    }));
    const durationMs = Math.max(result.audio_duration ? result.audio_duration * 1000 : 0, utterances[utterances.length - 1]?.endMs ?? 0);
    if (utterances.length <= 2 && (result.text?.length ?? 0) > 400) {
        const split = splitMonologueIntoDialog(result.text, durationMs || 600000);
        if (split && split.length > 2)
            utterances = split;
    }
    const repMs = utterances
        .filter((u) => u.speaker === 'Rep')
        .reduce((sum, u) => sum + (u.endMs - u.startMs), 0);
    const custMs = utterances
        .filter((u) => u.speaker === 'Customer')
        .reduce((sum, u) => sum + (u.endMs - u.startMs), 0);
    const total = repMs + custMs || 1;
    const last = utterances[utterances.length - 1];
    const durationSeconds = last
        ? Math.ceil(last.endMs / 1000)
        : Math.ceil((result.audio_duration ?? 0));
    return {
        fullText: result.text ?? utterances.map((u) => u.text).join(' '),
        durationSeconds,
        utterances,
        talkRatio: {
            Rep: { durationMs: repMs, percentage: repMs / total },
            Customer: { durationMs: custMs, percentage: custMs / total },
        },
        count: utterances.length,
    };
}
async function main() {
    const bundlePath = (0, path_1.join)(__dirname, 'demo-transcript-bundle.json');
    const existing = JSON.parse((0, fs_1.readFileSync)(bundlePath, 'utf8'));
    for (const src of SOURCES) {
        console.log(`\nTranscribing ${src.label}...`);
        const id = await submitTranscript(src.url);
        console.log(`  job ${id}`);
        const result = await pollTranscript(id);
        console.log(`\n  done — ${result.utterances?.length ?? 0} raw utterances, ${Math.ceil(result.audio_duration ?? 0)}s audio`);
        existing[src.key] = buildBundle(result);
    }
    (0, fs_1.writeFileSync)(bundlePath, JSON.stringify(existing, null, 2));
    console.log('\nWrote', bundlePath);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=build-extra-transcripts.js.map
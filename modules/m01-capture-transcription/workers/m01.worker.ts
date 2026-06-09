import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger }               from '@nestjs/common';
import { Job }                  from 'bullmq';
import * as fs                  from 'fs';
import { CallService }          from '../services/call.service';
import { getLocalAudioPath }    from '../lib/upload-paths';
import { uploadAudioToAssemblyAI } from '../lib/assemblyai-upload';

interface TranscribeJobData {
  callId:   string;
  audioUrl: string;
  tenantId: string;
}

@Processor('m01-queue', {
  // US-08: Maximum 3 retry attempts per job — no more
  // Exponential backoff: 5s → 25s → 125s between retries
  concurrency: 2,
})
export class M01CaptureTranscriptionWorker extends WorkerHost {
  private readonly logger = new Logger(M01CaptureTranscriptionWorker.name);

  constructor(private readonly callService: CallService) {
    super();
  }

  async process(job: Job<TranscribeJobData>): Promise<void> {
    const { callId, audioUrl, tenantId } = job.data;
    this.logger.log(`[M01 Worker] Starting job ${job.id} for call ${callId}`);

    // ── Step 1: Validate API key ──────────────────────────────────────
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    this.logger.log(`[M01 Worker] ASSEMBLYAI_API_KEY present: ${!!apiKey} (length: ${apiKey?.length ?? 0})`);

    if (!apiKey) {
      const reason = 'ASSEMBLYAI_API_KEY is not set in environment';
      await this.callService.onTranscriptionFailed(callId, tenantId, reason);
      throw new Error(reason);
    }

    try {
      // ── Step 2: Load AssemblyAI via require (avoids pnpm import issues) ──
      this.logger.log(`[M01 Worker] Loading AssemblyAI SDK...`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const assemblyaiModule = require('assemblyai');
      const AssemblyAI = assemblyaiModule.AssemblyAI ?? assemblyaiModule.default?.AssemblyAI ?? assemblyaiModule.default;

      if (!AssemblyAI || typeof AssemblyAI !== 'function') {
        throw new Error(`AssemblyAI SDK failed to load. Got: ${typeof AssemblyAI} — keys: ${Object.keys(assemblyaiModule).join(', ')}`);
      }

      this.logger.log(`[M01 Worker] AssemblyAI SDK loaded OK.`);
      const client = new AssemblyAI({ apiKey });
      this.logger.log(`[M01 Worker] Client created OK.`);

      // ── Step 3: Resolve audio source ─────────────────────────────────
      let audioSource: string;

      if (audioUrl.includes('localhost') || audioUrl.includes('127.0.0.1')) {
        const filename = audioUrl.split('/').pop()!.split('?')[0];
        const localPath = getLocalAudioPath(filename);
        const stat = fs.existsSync(localPath) ? fs.statSync(localPath) : null;
        this.logger.log(`[M01 Worker] Local file path: ${localPath}`);
        this.logger.log(`[M01 Worker] File exists: ${!!stat}, size: ${stat?.size ?? 0} bytes`);

        if (!stat || stat.size === 0) {
          throw new Error(
            stat ? `Audio file is empty: ${localPath}` : `Audio file not found on disk: ${localPath}`,
          );
        }

        this.logger.log(`[M01 Worker] Uploading ${filename} (${stat.size} bytes) to AssemblyAI...`);
        audioSource = await uploadAudioToAssemblyAI(apiKey, filename);
        this.logger.log(`[M01 Worker] File uploaded. CDN URL: ${audioSource}`);
      } else {
        audioSource = audioUrl;
        this.logger.log(`[M01 Worker] Using public URL: ${audioSource}`);
      }

      // ── Step 4: Transcribe ────────────────────────────────────────────
      this.logger.log(`[M01 Worker] Submitting transcription request...`);
      const transcript = await client.transcripts.transcribe({
        audio:          audioSource,
        speaker_labels: true,
        speech_models:  ['universal-2'],
      });

      this.logger.log(`[M01 Worker] Transcription status: ${transcript.status}`);

      if (transcript.status === 'error') {
        throw new Error(`AssemblyAI returned error: ${transcript.error ?? 'no error message'}`);
      }

      // ── Step 5: Map utterances with speaker label normalization (US-03) ──
      //
      // AssemblyAI returns raw labels: "A", "B", "C" ...
      // US-03: "Speaker 1/2" fallback when identity cannot be determined.
      // Named labels (Rep/Customer) are applied downstream by the AI extractor.

      const speakerLabelMap = new Map<string, string>();
      let   speakerCounter  = 1;

      const normalizeSpeaker = (rawLabel: string): string => {
        const label = rawLabel ?? 'Unknown';
        if (!speakerLabelMap.has(label)) {
          speakerLabelMap.set(label, `Speaker ${speakerCounter++}`);
        }
        return speakerLabelMap.get(label)!;
      };

      const utterances = (transcript.utterances ?? []).map((u: any, index: number) => ({
        speaker:       normalizeSpeaker(u.speaker ?? 'Unknown'), // ✅ US-03 normalized
        text:          u.text ?? '',
        startMs:       u.start ?? 0,
        endMs:         u.end   ?? 0,
        confidence:    u.confidence ?? 1,
        sequenceIndex: index,
      }));

      this.logger.log(
        `[M01 Worker] Speaker map: ${JSON.stringify(Object.fromEntries(speakerLabelMap))}`,
      );

      const fullText = transcript.text ?? '';
      const audioDurationSec =
        typeof transcript.audio_duration === 'number' && transcript.audio_duration > 0
          ? Math.ceil(transcript.audio_duration)
          : 0;

      this.logger.log(
        `[M01 Worker] ✅ Done! ${utterances.length} utterances, ${fullText.length} chars, audio ${audioDurationSec}s`,
      );

      // ── Step 6: Persist ───────────────────────────────────────────────
      await this.callService.onTranscriptionCompleted(callId, tenantId, {
        fullText,
        utterances,
        assemblyAiJobId: transcript.id,
        audioDurationSec,
      });

    } catch (err: unknown) {
      // Full raw dump so we can always see what went wrong
      console.error('[M01 Worker] ===== RAW ERROR DUMP =====');
      console.error('[M01 Worker] Error object:', err);
      console.error('[M01 Worker] Type:', Object.prototype.toString.call(err));
      if (err instanceof Error) {
        console.error('[M01 Worker] name:', err.name);
        console.error('[M01 Worker] message:', err.message);
        console.error('[M01 Worker] stack:', err.stack);
      } else {
        console.error('[M01 Worker] stringified:', JSON.stringify(err));
      }
      console.error('[M01 Worker] ===========================');

      const reason =
        err instanceof Error
          ? (err.message || err.name || err.stack || 'Error with no message')
          : (String(err) || JSON.stringify(err) || 'Unknown failure');

      this.logger.error(`[M01 Worker] Transcription failed for call ${callId}: ${reason}`);
      await this.callService.onTranscriptionFailed(callId, tenantId, reason || 'Transcription failed');
      throw err;
    }
  }
}

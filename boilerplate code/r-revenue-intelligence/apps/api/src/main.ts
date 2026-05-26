import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule }   from './app.module';

// ─── Upload directory ─────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Multer setup ─────────────────────────────────────────────────────────────
const multerFn = (multer as any).default ?? multer;
const upload   = multerFn({
  storage: multerFn.diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
    filename:    (_req: any, file: any, cb: any) => {
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext    = path.extname(file.originalname) || '.mp3';
      cb(https://github.com/santhoshraajrelanto/r-revenue-intelligence-monorepo/pull/38/conflict?name=boilerplate%2Bcode%252Fr-revenue-intelligence%252Fapps%252Fapi%252Fsrc%252Fmain.ts&ancestor_oid=a877b1720873891b4e6eadefa97f59da94f3cc1b&base_oid=e67a4c9bd655fd662a18d9d0d293e368582a86c4&head_oid=ae0bda236c975ee76419674ac27d39bd39db4f9anull, `call-${suffix}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const ALLOWED_AUDIO = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/ogg',  'audio/webm', 'audio/mp4', 'audio/m4a',
  'audio/x-m4a', 'audio/flac', 'audio/aac',
];

// ─── Local fallback: generate insights without API calls ──────────────────────
function localFallbackExtraction(
  fullText: string,
  utterances: Array<{ speaker: string; text: string; startMs: number; endMs: number }>,
) {
  // --- Summary: first 3 meaningful sentences from the transcript ---
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [];
  const meaningful = sentences.filter(s => s.trim().length > 20).slice(0, 5);
  const summary = meaningful.length > 0
    ? `This call covers: ${meaningful.map(s => s.trim()).join(' ')}`
    : `Sales call with ${new Set(utterances.map(u => u.speaker)).size} participants discussing key topics over ${utterances.length} exchanges.`;

  // --- Key Highlights: keyword detection ---
  const patterns: { label: string; keywords: RegExp }[] = [
    { label: 'pricing',    keywords: /price|pricing|cost|budget|discount|fee|rate|afford|invoice|payment|subscription|plan/i },
    { label: 'objection',  keywords: /concern|issue|problem|hesitat|not sure|don.t think|worry|risk|challenge|difficult|expensive/i },
    { label: 'competitor', keywords: /competitor|alternative|other vendor|switch|compared|comparison|salesforce|hubspot|zoho/i },
    { label: 'next_step',  keywords: /follow.?up|next step|schedule|meeting|demo|call back|send over|action item|deadline|by (monday|tuesday|wednesday|thursday|friday|next week)/i },
    { label: 'risk',       keywords: /cancel|churn|leave|unhappy|dissatisf|frustrat|delay|block|stopper|deal.?break/i },
  ];

  const keyHighlights: any[] = [];
  for (const u of utterances) {
    for (const p of patterns) {
      if (p.keywords.test(u.text) && keyHighlights.filter(h => h.label === p.label).length < 2) {
        keyHighlights.push({
          label:       p.label,
          text:        u.text.substring(0, 120) + (u.text.length > 120 ? '…' : ''),
          speaker:     u.speaker,
          timestampMs: u.startMs,
        });
      }
    }
  }

  // --- Next steps: any utterance mentioning follow-up actions ---
  const nextStepPattern = /(?:follow.?up|next step|let.s|i.ll|we.ll|schedule|send|action|please)\s.{10,80}/gi;
  const nextSteps: string[] = [];
  for (const u of utterances) {
    const matches = u.text.match(nextStepPattern);
    if (matches && nextSteps.length < 5) {
      nextSteps.push(...matches.map(m => m.trim()).slice(0, 2));
    }
  }

  return { summary, keyHighlights, nextSteps: [...new Set(nextSteps)].slice(0, 5) };
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
  console.log('✅ API running on port 3001');
  console.log('✅ Upload: POST /api/v1/capture-transcription/calls/upload');
  console.log('✅ Next Steps: CRUD /api/v1/capture-transcription/calls/:id/next-steps');
  console.log('✅ AI Extractor: CRUD /api/v1/ai-extractor/fields + /calls/:id/extract');
  console.log('✅ Standalone worker listening on m01-queue');
}

bootstrap();

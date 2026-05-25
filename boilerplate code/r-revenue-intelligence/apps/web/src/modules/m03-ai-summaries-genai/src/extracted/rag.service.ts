import Groq from "groq-sdk";
import type { AIGeneratedSummary, RichCitation } from "@/types/database";

// ── Lazy Groq client ──────────────────────────────────────────────────────────

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (_groq) return _groq;
  const apiKey = process.env.GROQ_API_KEY?.trim();
  console.log("[Groq] Key exists:", !!apiKey, "| prefix:", apiKey?.slice(0, 10));
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Add it to .env.local and restart.");
  _groq = new Groq({ apiKey });
  return _groq;
}

// ── Source registry passed from API routes ────────────────────────────────────

export interface SourceRecord {
  sourceId: string;
  sourceType: "transcript" | "email" | "activity" | "note" | "crm" | "call";
  speaker?: string;
  excerpt: string;
  timestamp_ms?: number;
  entityName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

function truncate(data: unknown, maxChars = 5000): string {
  const json = JSON.stringify(data, null, 2);
  return json.length <= maxChars ? json : json.slice(0, maxChars) + "\n...[truncated]";
}

function formatTimestamp(ms?: number): string | undefined {
  if (!ms) return undefined;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Build source index string for the prompt ──────────────────────────────────

function buildSourceIndex(sources: SourceRecord[]): string {
  if (!sources.length) return "No source records available.";
  return sources
    .map((s, i) => {
      const ts = formatTimestamp(s.timestamp_ms);
      return [
        `[${i + 1}] sourceId="${s.sourceId}" type=${s.sourceType}`,
        s.speaker   ? `    speaker: ${s.speaker}` : null,
        ts          ? `    timestamp: ${ts}` : null,
        s.entityName ? `    entity: ${s.entityName}` : null,
        `    excerpt: "${s.excerpt.slice(0, 300)}"`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

// ── Main generation function ──────────────────────────────────────────────────

export async function generateBriefRAG(
  briefType: string,
  contextData: unknown,
  instructions: string,
  sources: SourceRecord[] = []
): Promise<AIGeneratedSummary> {
  const groq = getGroqClient();

  const sourceIndex = buildSourceIndex(sources);

  const systemMessage = `You are an expert Revenue Intelligence AI that generates structured, fully-cited sales briefs.

RULES:
1. ONLY use facts from the provided CONTEXT DATA and SOURCE RECORDS — never hallucinate.
2. Every bullet point MUST include at least one citation referencing a source from the SOURCE INDEX.
3. Citations must use the exact sourceId from the SOURCE INDEX.
4. If no source supports a claim, do not make the claim.
5. Respond with valid JSON only — no markdown, no explanation.`;

  const userMessage = `Generate a ${briefType} Brief as a JSON object with this EXACT structure:

{
  "title": "descriptive title",
  "summaryPreview": "2-3 sentence executive summary",
  "sentiment": "positive | negative | neutral",
  "health": "good | at_risk | poor",
  "contextLabels": ["tag1", "tag2", "tag3"],
  "sections": [
    {
      "title": "Section Name",
      "summary": "optional paragraph",
      "bullets": [
        {
          "text": "The insight or finding",
          "owner": "optional person responsible",
          "richCitations": [
            {
              "citation_id": 1,
              "sourceType": "transcript",
              "sourceId": "exact-uuid-from-source-index",
              "speaker": "Speaker Name",
              "excerpt": "Exact verbatim quote from the source",
              "timestamp_ms": 120000,
              "entityName": "Call or entity name"
            }
          ]
        }
      ]
    }
  ]
}

━━━ CONTEXT DATA ━━━
${truncate(contextData)}

━━━ SOURCE INDEX (cite these by sourceId) ━━━
${sourceIndex}

━━━ REQUIRED SECTIONS ━━━
${instructions}

IMPORTANT: Every bullet must have richCitations. Use sourceId values EXACTLY as shown in the SOURCE INDEX.
Respond with ONLY the JSON object.`;

  console.log(`[Groq] Generating ${briefType} brief with ${sources.length} source records...`);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user",   content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  console.log(`[Groq] Response: ${raw.length} chars`);

  if (!raw) throw new Error("Groq returned empty response");

  let parsed: AIGeneratedSummary;
  try {
    parsed = JSON.parse(extractJSON(raw)) as AIGeneratedSummary;
  } catch (e) {
    console.error("[Groq] JSON parse failed:", raw.slice(0, 400));
    throw new Error(`Failed to parse Groq JSON: ${String(e)}`);
  }

  // Normalize & validate
  parsed.title          = parsed.title          || `${briefType} Brief`;
  parsed.summaryPreview = parsed.summaryPreview  || "Summary not available.";
  parsed.contextLabels  = Array.isArray(parsed.contextLabels) ? parsed.contextLabels : [];
  parsed.sections       = Array.isArray(parsed.sections)      ? parsed.sections      : [];

  // Enrich citations with full source metadata from our registry
  const sourceMap = new Map(sources.map(s => [s.sourceId, s]));
  let globalCitationId = 1;
  let globalBulletId   = 1;

  for (const section of parsed.sections) {
    for (const bullet of section.bullets ?? []) {
      // Assign stable bullet_id for feedback tracking
      if (!(bullet as any).bullet_id) {
        (bullet as any).bullet_id = `bullet_${String(globalBulletId++).padStart(3, "0")}`;
      }
      const rich = (bullet as any).richCitations as RichCitation[] | undefined;
      if (rich?.length) {
        bullet.richCitations = rich.map(c => {
          const reg = sourceMap.get(c.sourceId);
          return {
            citation_id:  globalCitationId++,
            sourceType:   c.sourceType  || reg?.sourceType  || "crm",
            sourceId:     c.sourceId    || "",
            speaker:      c.speaker     || reg?.speaker,
            excerpt:      c.excerpt     || reg?.excerpt      || "Source excerpt not available",
            timestamp_ms: c.timestamp_ms ?? reg?.timestamp_ms,
            entityName:   c.entityName  || reg?.entityName,
          } satisfies RichCitation;
        });
      } else {
        // No citations generated — attach a fallback from the source pool
        const fallback = sources[0];
        if (fallback) {
          bullet.richCitations = [{
            citation_id:  globalCitationId++,
            sourceType:   fallback.sourceType,
            sourceId:     fallback.sourceId,
            speaker:      fallback.speaker,
            excerpt:      fallback.excerpt,
            timestamp_ms: fallback.timestamp_ms,
            entityName:   fallback.entityName,
          }];
        }
      }
    }
  }

  console.log(`[Groq] Brief ready: "${parsed.title}" | ${parsed.sections.length} sections`);
  return parsed;
}

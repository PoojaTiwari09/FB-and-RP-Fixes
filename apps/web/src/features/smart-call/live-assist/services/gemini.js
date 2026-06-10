// ── Groq API Service ────────────────────────────────────────

// Using Groq's OpenAI-compatible API with high-speed inference.
// Models:
//   llama-3.1-8b-instant → Fast, efficient LLM for chat ✅
//   whisper-large-v3     → Audio transcription ✅

export const AVAILABLE_MODELS = [
  { id: "auto", label: "Auto (Recommended)", provider: "Smart Routing" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "OpenRouter" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "OpenRouter" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5", provider: "OpenRouter" }
];

const CHAT_MODEL = "llama-3.1-8b-instant";
const TRANSCRIBE_MODEL = "whisper-large-v3";
let liveAssistSchemaMode = "unknown";
const groqClientByKey = new Map();

export function normalizeApiKey(apiKey) {
  if (!apiKey) return null;
  const raw = String(apiKey).trim();
  // Strip quotes and 'Bearer ' prefix (case-insensitive)
  let key = raw.replace(/^['"]|['"]$/g, "").replace(/^Bearer\s+/i, "").trim();
  // Strip all whitespace
  key = key.replace(/\s+/g, "");
  
  if (!key || key.toLowerCase() === "null" || key.toLowerCase() === "undefined") {
    return null;
  }
  return key;
}

function getGroqClient(apiKey) {
  const normalizedKey = normalizeApiKey(apiKey);
  if (!normalizedKey) {
    throw new Error("Missing API key. Please provide a valid Groq API key.");
  }

  if (groqClientByKey.has(normalizedKey)) {
    return groqClientByKey.get(normalizedKey);
  }

  // Create a minimal client-mimicking object that performs direct HTTP requests
  const client = {
    chat: {
      completions: {
        create: async (body) => {
          const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${normalizedKey}`
            },
            body: JSON.stringify(body)
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw { error: { message: err.error?.message || `Status ${resp.status}` } };
          }
          return resp.json();
        }
      }
    },
    audio: {
      transcriptions: {
        create: async (body) => {
          const formData = new FormData();
          formData.append("file", body.file);
          formData.append("model", body.model);
          if (body.response_format) formData.append("response_format", body.response_format);
          if (body.language) formData.append("language", body.language);
          if (body.temperature !== undefined) formData.append("temperature", String(body.temperature));
          if (body.prompt) formData.append("prompt", body.prompt);

          const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${normalizedKey}`
            },
            body: formData
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw { error: { message: err.error?.message || `Status ${resp.status}` } };
          }
          return resp.json();
        }
      }
    }
  };
  groqClientByKey.set(normalizedKey, client);
  return client;
}

function buildSystemPrompt(contextChunks, chartHint) {
  const contextStr = contextChunks.map(c => {
    if (c.type === "deal") {
      const d = c.data;
      return `DEAL: ${d.name} | Stage: ${d.stage} | Value: $${d.value.toLocaleString()} | Probability: ${d.probability}% | Owner: ${d.owner} | Days in Stage: ${d.daysInStage} | Close: ${d.closeDate} | Notes: ${d.notes} | Activities: ${d.activities.join(", ")} | Tags: ${d.tags.join(", ")}`;
    }
    if (c.type === "call") {
      const cl = c.data;
      return `CALL: ${cl.type} for Deal ${cl.deal} | Date: ${cl.date} | Duration: ${cl.duration} | Rep: ${cl.rep} | Sentiment: ${cl.sentiment} | Outcome: ${cl.outcome} | Summary: ${cl.summary} | Objections: ${cl.objections.join(", ")} | Next Steps: ${cl.nextSteps.join(", ")}`;
    }
    if (c.type === "metrics") {
      const m = c.data;
      return `METRICS: Total Pipeline: $${m.totalPipeline.toLocaleString()} | Closed Won: $${m.closedWon.toLocaleString()} | Win Rate: ${m.winRate}% | Avg Deal Size: $${m.avgDealSize.toLocaleString()} | Avg Sales Cycle: ${m.avgSalesCycle} days | Quota Attainment: ${m.quotaAttainment}%`;
    }
    if (c.type === "transcript") {
      return `CALL TRANSCRIPT TO ANALYZE:\n${c.data}\n`;
    }
    return "";
  }).join("\n");

  const chartInstruction = chartHint
    ? [
        "CHART REQUIRED: At the very end of your response, after all text, output the chart JSON in EXACTLY this format:",
        "```chart",
        '{"type":"bar","title":"My Chart","labels":["A","B","C"],"datasets":[{"label":"Value","data":[1,2,3]}]}',
        "```",
        "Replace the example with real data from the CRM. Valid types: bar, line, doughnut, pie.",
        "CRITICAL: The opening ``` must be on its own line. The JSON must be on its own line. The closing ``` must be on its own line.",
        "Do NOT inline the JSON on the same line as the backticks.",
      ].join("\n")
    : "Do NOT output any chart JSON or code blocks.";

  return `You are DealsIQX, an expert AI sales analyst embedded in a CRM. You help sales reps understand their pipeline, analyze call recordings, summarize deals, and provide strategic recommendations.

PERSONALITY: Concise, sharp, data-driven. You sound like a seasoned sales coach — direct but supportive. No filler words.

FORMATTING RULES:
- Use **bold** for deal names, companies, dollar amounts, and key metrics.
- Use bullet points for lists of recommendations or action items.
- Use numbered lists for ranked/ordered items.
- Keep responses focused and scannable — sales reps are busy.
- If asked for a summary, lead with the most critical insight.
- When you detect risk (stalled deals, negative sentiment, lost), flag it clearly.

CHART INSTRUCTIONS:
${chartInstruction}

RETRIEVED CRM DATA (use this as your knowledge base):
${contextStr || "No specific records matched. Use general sales knowledge and the overall context."}

OVERALL PIPELINE SUMMARY:
- 8 total deals, $746K total pipeline
- Win rate: 42%, Quota attainment: 68%
- Top reps: Priya S. (3 deals), Raj M. (2 deals), Amir K. (2 deals)
- At-risk deals: LogiChain (stalled 18 days), Acme (negotiation risk)

Always answer based on the retrieved data above. If data is insufficient, say so clearly.`;
}

export function parseJsonFromText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  // 1. Try direct JSON parse first (fastest path — happens when response_format: json_object is used)
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }

  // 2. Try to extract from a fenced code block (```json ... ``` or ``` ... ```)
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch { /* fall through — don't short-circuit, keep trying */ }
  }

  // 3. Brace extraction — find the first { and last } and try that substring
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch { /* fall through */ }
  }

  return null;
}

function formatStructuredResponse(data) {
  if (!data || typeof data !== "object") return "";

  const lines = [];

  const addLine = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    lines.push(`**${label}:** ${value}`);
  };

  addLine("Headline", data.headline);
  addLine("Summary", data.summary);
  addLine("Next Best Action", data.nextBestAction);
  addLine("Transcript Window", data.transcriptWindow);

  const coreFields = [
    ["Deal Value", data.deal_value],
    ["Timeline", data.timeline],
    ["Client Name", data.client_name],
    ["Decision Maker", data.decision_maker],
    ["Sentiment", data.sentiment],
    ["Deal Score", data.deal_score],
  ];

  const coreFieldLines = coreFields
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `**${label}:** ${value}`);

  if (coreFieldLines.length) {
    lines.push(coreFieldLines.join("\n"));
  }

  if (Array.isArray(data.risks) && data.risks.length) {
    lines.push(`**Risks:** ${data.risks.join("; ")}`);
  }
  if (Array.isArray(data.next_steps) && data.next_steps.length) {
    lines.push(`**Next Steps:** ${data.next_steps.join("; ")}`);
  }
  if (Array.isArray(data.alerts) && data.alerts.length) {
    lines.push(`**Alerts:** ${data.alerts.join("; ")}`);
  }
  if (Array.isArray(data.strategicTips) && data.strategicTips.length) {
    lines.push(`**Strategic Tips:** ${data.strategicTips.join("; ")}`);
  }
  if (Array.isArray(data.suggestedResponses) && data.suggestedResponses.length) {
    lines.push(`**Suggested Responses:** ${data.suggestedResponses.join("; ")}`);
  }

  return lines.join("\n\n").trim();
}

let groqCooldownUntil = 0;

async function tryModel(keys, messages, options = {}) {
  // --- LOUD DEBUGGING START ---
  const groqKey = typeof keys === "string" ? keys : keys?.groq;
  const openRouterKey = typeof keys === "string" ? null : keys?.openrouter;
  const normGroq = normalizeApiKey(groqKey);
  const normOR = normalizeApiKey(openRouterKey);

  console.log("%c[DEBUG] tryModel Invoked", "background: #222; color: #bada55; font-size: 14px; padding: 4px;");
  
  const normalizedOpenRouterKey = normOR;
  let groqErr = null;
  let provider = "Groq";
  const targetModelId = options.model || CHAT_MODEL;
  const targetModelDef = AVAILABLE_MODELS.find(m => m.id === targetModelId);
  const targetProvider = targetModelDef ? targetModelDef.provider : "Groq";

  const isGroqCoolingDown = Date.now() < groqCooldownUntil;
  
  if (targetProvider === "Groq") {
    if (isGroqCoolingDown && normalizedOpenRouterKey) {
       const remaining = Math.ceil((groqCooldownUntil - Date.now()) / 1000);
       console.log(`%c[CIRCUIT BREAKER] Groq is cooling down for ${remaining}s. Bypassing directly to OpenRouter.`, "color: #ef4444; font-weight: bold;");
    }

    if (normGroq && !isGroqCoolingDown) {
      const client = getGroqClient(normGroq);
      let attempts = 0;
      const maxAttempts = 2; // Try once, retry once on 429
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          const data = await client.chat.completions.create({
            model: targetModelId,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 1024,
            ...(options.response_format ? { response_format: options.response_format } : {})
          });

          console.log(`[Groq API] Attempt ${attempts} successful using ${targetModelId}`);
          const content = data.choices?.[0]?.message?.content;
          const text = Array.isArray(content)
            ? content.map(p => typeof p === "string" ? p : (p.text || p.content || "")).join("\n").trim()
            : content;
          if (!text) throw new Error("Empty response from model");
          return { text, provider, modelUsed: targetModelId };
        } catch (err) {
          const msg = String(err?.error?.message || err?.message || "");
          if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
            if (normalizedOpenRouterKey) {
               console.warn(`[Groq] Rate limit hit. Triggering 60-second cooldown and falling back to OpenRouter...`);
               groqCooldownUntil = Date.now() + 60000; // 60 seconds cooldown
               groqErr = err;
               break; // Break immediately to fallback to OpenRouter without retrying Groq
            } else if (attempts < maxAttempts) {
              console.warn(`[Groq] Rate limit hit. Retrying in 2 seconds...`);
              await new Promise(r => setTimeout(r, 2000));
              continue;
            }
          }
          groqErr = err;
          break; // break loop on non-429 error
        }
      }
    }
  }

  // Fallback to OpenRouter OR Direct to OpenRouter if targetProvider is OpenRouter
  if (normalizedOpenRouterKey && (targetProvider === "OpenRouter" || groqErr || isGroqCoolingDown)) {
    if (targetProvider !== "OpenRouter") {
      console.warn(`[Fallback] Using OpenRouter.`);
    } else {
      console.log(`[OpenRouter API] Using selected model ${targetModelId}`);
    }
    
    provider = "OpenRouter";
    let fallbackModel = targetProvider === "OpenRouter" ? targetModelId : "meta-llama/llama-3.3-70b-instruct";
    
    // Detect OpenAI keys (sk-proj- or sk- but not sk-or-)
    const isOpenAIKey = normalizedOpenRouterKey.startsWith("sk-proj-") || 
                       (normalizedOpenRouterKey.startsWith("sk-") && !normalizedOpenRouterKey.startsWith("sk-or-"));
    
    const endpoint = isOpenAIKey 
      ? "https://api.openai.com/v1/chat/completions" 
      : "https://openrouter.ai/api/v1/chat/completions";

    if (isOpenAIKey) {
      provider = "OpenAI";
      // Map to a valid OpenAI model if we're using an OpenAI key
      if (fallbackModel.includes("llama") || fallbackModel.includes("deepseek") || fallbackModel.includes("anthropic")) {
        fallbackModel = "gpt-4o-mini"; 
      }
      if (fallbackModel.startsWith("openai/")) {
        fallbackModel = fallbackModel.replace("openai/", "");
      }
      console.log(`[OpenAI API] Routing to direct OpenAI endpoint using model ${fallbackModel}`);
    } else {
      console.log(`[OpenRouter API] Using ${targetProvider === "OpenRouter" ? "selected" : "fallback"} model ${fallbackModel}`);
    }

    try {
      const authHeader = `Bearer ${normalizedOpenRouterKey}`;
      
      // LOUD DEBUG LOG
      const keyStart = normalizedOpenRouterKey.substring(0, 8);
      const keyEnd = normalizedOpenRouterKey.substring(normalizedOpenRouterKey.length - 4);
      console.log(`%c[AUTH DEBUG] Provider: ${provider} | KeyLength: ${normalizedOpenRouterKey.length} | Format: ${keyStart}...${keyEnd}`, "color: #fbbf24; font-weight: bold; font-size: 12px;");

      const headers = {
        "Content-Type": "application/json",
        "Authorization": authHeader
      };

      // Add OpenRouter-specific headers only for OpenRouter
      if (!isOpenAIKey) {
        headers["HTTP-Referer"] = window.location.origin || "http://localhost:3000";
        headers["X-Title"] = "DealsIQX";
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: fallbackModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1024,
          ...(options.response_format ? { response_format: options.response_format.type === "json_object" ? { type: "json_object" } : options.response_format } : {})
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const apiError = errorData.error?.message || `Status ${resp.status}`;
        throw new Error(`${provider} API error: ${apiError}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty response from ${provider}`);
      return { text, provider, modelUsed: fallbackModel };
    } catch (err) {
      console.error(`[${provider} Error]`, err);
      throw new Error(`Fallback failed. (Groq: ${groqErr?.message || "Error"}. ${provider}: ${err.message})`);
    }
  }

  if (groqErr) {
    const msg = groqErr?.error?.message || groqErr?.message || "Failed to call Groq chat completions";
    if (String(msg).toLowerCase().includes("unauthorized") || String(msg).includes("401")) {
      throw new Error("Unauthorized (401): invalid Groq API key.");
    }
    throw new Error(msg);
  }

  throw new Error("No API keys provided for analysis.");
}

function autoSelectModel(userMessage, keys) {
  const text = (userMessage || "").toLowerCase();
  
  // If complex analysis or reasoning needed
  if (text.includes("analyze") || text.includes("why") || text.includes("compare") || text.includes("deep") || text.includes("strategy") || text.includes("calculate") || text.includes("reason") || text.includes("evaluate") || text.includes("think")) {
    return keys.groq ? "llama-3.3-70b-versatile" : "deepseek/deepseek-r1";
  }
  
  // If fast/simple query or chart
  if (text.includes("chart") || text.includes("quick") || text.includes("summarize") || text.includes("overview")) {
    return keys.groq ? "llama-3.1-8b-instant" : "meta-llama/llama-3.3-70b-instruct";
  }

  // Default to a versatile model
  return keys.groq ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct";
}

export async function queryGemini(keys, userMessage, contextChunks, chatHistory, chartHint, modelOverride = null) {
  let finalModel = modelOverride;
  if (!finalModel || finalModel === "auto") {
    finalModel = autoSelectModel(userMessage, keys);
  }

  const systemPrompt = buildSystemPrompt(contextChunks, chartHint);

  // Convert to OpenAI format for Groq API
  const messages = [];
  messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "assistant", content: "Understood. I am DealsIQX, ready to analyze your pipeline." });

  chatHistory.forEach(msg => {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    });
  });

  messages.push({ role: "user", content: userMessage });

  try {
    const { text: rawText, modelUsed } = await tryModel(keys, messages, { model: finalModel });
    const chart = parseChartFromResponse(rawText);
    const structured = parseJsonFromText(rawText);
    const content = structured && !chart ? formatStructuredResponse(structured) || rawText : stripChartBlock(rawText);

    return {
      rawText,
      content,
      chart,
      structured,
      modelUsed,
    };
  } catch (err) {
    throw new Error(err.message || "Failed to get response from Groq API");
  }
}

// ── Chart parsing — handles all Gemini output variations ──────
export function parseChartFromResponse(text) {
  if (!text) return null;
  const rawText = String(text);

  // Strategy 1: Fenced code blocks with chart, json, or no tag
  const patterns = [
    /```chart\s*([\s\S]*?)```/i,
    /```json\s*([\s\S]*?)```/i,
    /```\s*([\s\S]*?)```/i,
  ];

  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());
        // Validate it's actually a chart config, not random JSON
        if (parsed.type && Array.isArray(parsed.labels) && Array.isArray(parsed.datasets)) {
          return parsed;
        }
      } catch { /* try next pattern */ }
    }
  }

  // Strategy 2: Brace extraction — search for first { and last }
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
      if (parsed.type && Array.isArray(parsed.labels) && Array.isArray(parsed.datasets)) {
        return parsed;
      }
    } catch { /* fall through */ }
  }

  return null;
}

export function stripChartBlock(text) {
  if (!text) return "";
  let cleaned = String(text);

  // 1. Remove ```chart ... ```
  cleaned = cleaned.replace(/```chart\s*[\s\S]*?```/gi, "");

  // 2. Remove ```json ... ``` ONLY if it is a chart
  cleaned = cleaned.replace(/```json\s*([\s\S]*?)```/gi, (match, content) => {
    try {
      const parsed = JSON.parse(content.trim());
      if (parsed.type && Array.isArray(parsed.labels) && Array.isArray(parsed.datasets)) {
        return "";
      }
    } catch {}
    return match;
  });

  // 3. Remove ``` ... ``` ONLY if it is a chart
  cleaned = cleaned.replace(/```\s*([\s\S]*?)```/gi, (match, content) => {
    try {
      const parsed = JSON.parse(content.trim());
      if (parsed.type && Array.isArray(parsed.labels) && Array.isArray(parsed.datasets)) {
        return "";
      }
    } catch {}
    return match;
  });

  // 4. Remove raw JSON at the end/anywhere if it parses to a chart
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      if (parsed.type && Array.isArray(parsed.labels) && Array.isArray(parsed.datasets)) {
        cleaned = cleaned.slice(0, firstBrace) + cleaned.slice(lastBrace + 1);
      }
    } catch {}
  }

  return cleaned.trim();
}

// ── Competitor Flash Analysis ──────────────────────────────────
// Called IMMEDIATELY when local engine detects a competitor mention.
// Uses Groq Llama 3.1 8B for sub-2 second response.
// Delivers specific battle card: their weakness → our advantage → exact talk track.
export async function analyzeCompetitorThreat(groqKey, competitorTriggerWord, transcriptContext) {
  if (!groqKey || !competitorTriggerWord) return null;

  const system = [
    `You are a competitive sales expert. A competitive trigger ("${competitorTriggerWord}") was just detected on a live sales call.`,
    "Return ONLY valid JSON with NO markdown or code fences.",
    "",
    "OUTPUT this exact JSON shape:",
    "{",
    '  "competitor": "<EXTRACT THE ACTUAL COMPANY NAME from the transcript, e.g. Google, Acme Corp. Do NOT just say \'compared to\'>",',
    '  "mentionedContext": "<1 sentence: how/why they were mentioned based on transcript>",',
    '  "theirWeakness": "<their most relevant weakness in this context>",',
    '  "ourAdvantage": "<our specific advantage that counters their weakness>",',
    '  "talkTrack": "<exact sentence the rep can say verbatim right now to reframe>",',
    '  "battleCard": "<2-3 bullet points: key differentiators the rep should stress immediately>",',
    '  "urgency": "<low|medium|high>"',
    "}",
    "",
    "CRITICAL:",
    "If the trigger word is a generic phrase like 'alternative', 'other vendor', or 'compared to', you MUST read the transcript to find the ACTUAL company name the customer is talking about.",
    "Be SPECIFIC to the conversation context. No generic answers.",
    "talkTrack must be a complete sentence the rep can say immediately."
  ].join("\n");

  const messages = [
    { role: "system", content: system },
    { role: "user", content: `LIVE TRANSCRIPT CONTEXT (last 30s):\n${transcriptContext || "(no context)"}\n\nAnalyze this competitor mention and provide the battle card.` }
  ];

  try {
    const { text } = await tryModel({ groq: groqKey }, messages, {
      model: FAST_RESPONSE_MODEL,
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });
    return safeJsonParse(text);
  } catch (err) {
    console.error("[Competitor Flash] Failed:", err.message);
    return null;
  }
}

// ── Local Whisper server endpoint ─────────────────────────────
const LOCAL_WHISPER_URL = "http://127.0.0.1:8787/transcribe";
let useLocalWhisper = true; // Will flip to false if local server is unreachable

export async function transcribeAudioBlob(apiKey, audioBlob) {
  const fileName = `live-${Date.now()}.webm`;

  const cleanTranscript = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/<\|.*?\|>/g, "") // Remove all <|...|> tokens like <|en|>, <|endoftext|>
      .replace(/\[(?:inaudible|crosstalk|silence|music)\]/gi, "")
      .replace(/Amara\.org/gi, "") // common whisper hallucination
      .replace(/Sous-titres/gi, "")
      .trim();
  };

  // ── Try local Whisper server first ──
  if (useLocalWhisper) {
    try {
      const formData = new FormData();
      formData.append("file", new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" }));

      const resp = await fetch(LOCAL_WHISPER_URL, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Local Whisper returned ${resp.status}`);
      }

      const data = await resp.json();
      const text = cleanTranscript(data.text);
      console.log("[Whisper] Local transcription:", text.slice(0, 60));
      return {
        text,
        duration: Number(data.duration || 0),
        segments: Array.isArray(data.segments) ? data.segments : []
      };
    } catch (err) {
      // If it's a network error (server not running), fall back to Groq
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError") || err.message?.includes("ECONNREFUSED")) {
        console.warn("[Whisper] Local server unreachable, falling back to Groq. Start the local server: cd whisper_server && python server.py");
        useLocalWhisper = false;
      } else {
        // Server is up but returned an error — still try to use it next time
        console.warn("[Whisper] Local transcription error:", err.message);
        throw new Error(`Local transcription failed: ${err.message}`);
      }
    }
  }

  // ── Fallback: Groq cloud Whisper ──
  console.log("[Whisper] Using Groq cloud fallback");
  const client = getGroqClient(apiKey);
  const file = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });

  let data;
  try {
    data = await client.audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
      response_format: "verbose_json",
      language: "en",
      temperature: 0,
      prompt: "This is a professional sales call between a representative and a customer. Use clean, verbatim transcription."
    });
  } catch (err) {
    const msg = err?.error?.message || err?.message || "Transcription failed";
    const code = err?.error?.code ? ` (${err.error.code})` : "";
    if (String(msg).toLowerCase().includes("unauthorized") || String(msg).includes("401")) {
      throw new Error("Transcription failed: Unauthorized (401). Use a valid Groq API key and do not prefix it with 'Bearer '.");
    }
    throw new Error(`Transcription failed: ${msg}${code}`);
  }

  const text = cleanTranscript(data.text);
  return {
    text,
    duration: Number(data.duration || 0),
    segments: Array.isArray(data.segments) ? data.segments : []
  };
}

function safeJsonParse(text) {
  if (text && typeof text === "object") {
    return text;
  }

  const direct = String(text || "").trim();
  if (!direct) return null;

  try {
    return JSON.parse(direct);
  } catch {
    const blockMatch = direct.match(/```json\s*([\s\S]*?)```/i) || direct.match(/```\s*([\s\S]*?)```/);
    if (!blockMatch) return null;
    try {
      return JSON.parse(blockMatch[1].trim());
    } catch {
      return null;
    }
  }
}

function pickFirst(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const text = pickFirst(item, ["text", "label", "title", "value", "message"], "");
        return String(text || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeIntentSignals(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") {
        return { label: item.trim(), confidence: 65, evidence: "" };
      }
      if (!item || typeof item !== "object") return null;
      const label = String(pickFirst(item, ["label", "intent", "signal", "name"], "")).trim();
      const confidence = Number(pickFirst(item, ["confidence", "score", "probability"], 65));
      const evidence = String(pickFirst(item, ["evidence", "reason", "context", "quote"], "")).trim();
      if (!label) return null;
      return {
        label,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 65,
        evidence,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeRiskSignals(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") {
        return { label: item.trim(), severity: "medium", evidence: "" };
      }
      if (!item || typeof item !== "object") return null;
      const label = String(pickFirst(item, ["label", "risk", "signal", "name"], "")).trim();
      const severityRaw = String(pickFirst(item, ["severity", "level", "priority"], "medium")).toLowerCase();
      const severity = ["low", "medium", "high"].includes(severityRaw) ? severityRaw : "medium";
      const evidence = String(pickFirst(item, ["evidence", "reason", "context", "quote"], "")).trim();
      if (!label) return null;
      return { label, severity, evidence };
    })
    .filter(Boolean)
    .slice(0, 4);
}

const LIVE_ASSIST_JSON_SCHEMA = {
  name: "live_assist_payload",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      transcriptWindow: { type: "string" },
      headline: { type: "string" },
      speakerIdentification: {
        type: "object",
        additionalProperties: false,
        properties: {
          salesRepName: { type: "string" },
          clientName: { type: "string" },
          confidence: { type: "string" }
        },
        required: ["salesRepName", "clientName", "confidence"]
      },
      intentSignals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            confidence: { type: "number" },
            evidence: { type: "string" }
          },
          required: ["label", "confidence", "evidence"]
        }
      },
      riskSignals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] },
            evidence: { type: "string" }
          },
          required: ["label", "severity", "evidence"]
        }
      },
      conversationAnalysis: {
        type: "object",
        additionalProperties: false,
        properties: {
          talkRatioRep: { type: "number" },
          talkRatioCustomer: { type: "number" },
          interruptions: { type: "string", enum: ["none", "low", "moderate", "high"] },
          pace: { type: "string", enum: ["slow", "balanced", "fast"] }
        },
        required: ["talkRatioRep", "talkRatioCustomer", "interruptions", "pace"]
      },
      suggestedResponses: {
        type: "array",
        items: { type: "string" }
      },
      competitorIntelligence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            competitor: { type: "string" },
            mentionedContext: { type: "string" },
            ourAdvantage: { type: "string" },
            talkTrack: { type: "string" }
          },
          required: ["competitor", "mentionedContext", "ourAdvantage", "talkTrack"]
        }
      },
      strategicTips: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            tip: { type: "string" },
            exactScript: { type: "string" },
            reasoning: { type: "string" }
          },
          required: ["tip", "exactScript", "reasoning"]
        }
      },
      alerts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            message: { type: "string" },
            level: { type: "string", enum: ["critical", "important", "informational"] }
          },
          required: ["message", "level"]
        }
      },
      nextBestAction: { type: "string" },
      chunkSummary: { type: "string" },
      buyingIntent: {
        type: "object",
        additionalProperties: false,
        properties: { label: { type: "string" }, reason: { type: "string" } },
        required: ["label", "reason"]
      },
      objectionRisk: {
        type: "object",
        additionalProperties: false,
        properties: { label: { type: "string" }, reason: { type: "string" } },
        required: ["label", "reason"]
      },
      urgency: { type: "string" },
      decisionMakerPresence: {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          reason: { type: "array", items: { type: "string" } }
        },
        required: ["status", "confidence", "reason"]
      },
      dealMomentumScore: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "number" },
          drivers: { type: "array", items: { type: "string" } }
        },
        required: ["score", "drivers"]
      },
      callStage: { type: "string", enum: ["discovery", "demo", "negotiation", "closing", "unknown"] },
      objectionTimeline: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
             time: { type: "string" },
             objection: { type: "string" },
             status: { type: "string", enum: ["raised", "addressed", "unresolved"] }
          },
          required: ["time", "objection", "status"]
        }
      }
    },
    required: [
      "transcriptWindow",
      "headline",
      "speakerIdentification",
      "intentSignals",
      "riskSignals",
      "conversationAnalysis",
      "suggestedResponses",
      "competitorIntelligence",
      "strategicTips",
      "alerts",
      "nextBestAction",
      "chunkSummary",
      "buyingIntent",
      "objectionRisk",
      "urgency",
      "decisionMakerPresence",
      "dealMomentumScore",
      "callStage",
      "objectionTimeline"
    ]
  }
};

/**
 * Recursively search an object tree for values matching a set of key names.
 * Returns the first non-null/non-undefined value found at any depth.
 */
function deepFind(obj, keys, maxDepth = 4) {
  if (!obj || typeof obj !== "object" || maxDepth <= 0) return undefined;
  // Check direct keys first
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  // Then recurse into nested objects
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const found = deepFind(val, keys, maxDepth - 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * Unwrap a response that may be nested under various wrapper keys.
 * Groq's llama model returns wildly different structures each call, e.g.:
 *   { coachingOutput: { suggestion: "..." } }
 *   { output: { intentSignals: [...] } }
 *   { live_assist_payload: { ... } }
 * This flattens all nested object values into a single merged object so
 * field lookup works regardless of nesting.
 */
function unwrapResponse(raw) {
  if (!raw || typeof raw !== "object") return {};

  const wrapperKeys = [
    "live_assist_payload", "payload", "coachingOutput", "coaching_output",
    "output", "result", "data", "analysis", "response", "coaching",
    "liveAssist", "live_assist", "insights", "salesCoaching"
  ];

  let best = raw;
  for (const key of wrapperKeys) {
    if (raw[key] && typeof raw[key] === "object" && !Array.isArray(raw[key])) {
      best = raw[key];
      // Check one more level deep
      for (const key2 of wrapperKeys) {
        if (best[key2] && typeof best[key2] === "object" && !Array.isArray(best[key2])) {
          best = best[key2];
          break;
        }
      }
      break;
    }
  }

  // Merge the wrapper and the unwrapped so we catch fields at both levels
  const merged = { ...raw };
  if (best !== raw) {
    Object.assign(merged, best);
  }
  return merged;
}

/**
 * Coerce a value that might be a string, array, or nested object into an array of strings.
 * Handles cases like: "single suggestion" → ["single suggestion"]
 */
function coerceToArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (value && typeof value === "object") {
    // Might be { 0: "...", 1: "..." } or similar
    const vals = Object.values(value).filter(v => typeof v === "string" && v.trim());
    if (vals.length) return vals;
  }
  return [];
}

function normalizeLiveInsights(raw, transcriptFallback) {
  const safe = unwrapResponse(raw);

  console.log("[LiveAssist] normalizeLiveInsights unwrapped:", safe);

  const toPercent = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  // --- Transcript window ---
  const twRaw = deepFind(safe, ["transcriptWindow", "transcript_window", "window", "recentTranscript"]);
  const transcriptWindow = typeof twRaw === "string" ? twRaw.trim()
    : (transcriptFallback || "");

  // --- Headline ---
  const hlRaw = deepFind(safe, ["headline", "title", "summary", "mainInsight", "main_insight", "coaching_headline"]);
  const headline = (typeof hlRaw === "string" && hlRaw.trim()) ? hlRaw.trim() : "Live coaching update";

  // --- Next best action ---
  const nbaRaw = deepFind(safe, [
    "nextBestAction", "next_best_action", "recommendedAction", "next_action",
    "recommendation", "action", "suggested_action"
  ]);
  // Handle both string (old) and object (new structured) shapes
  const nextBestAction = (nbaRaw && typeof nbaRaw === "object")
    ? {
        action: String(nbaRaw.action || nbaRaw.text || "").trim() || "Keep the customer engaged with one focused follow-up question.",
        confidence: String(nbaRaw.confidence || "medium").trim(),
        reasoning: String(nbaRaw.reasoning || "").trim(),
        supportingSignals: Array.isArray(nbaRaw.supportingSignals) ? nbaRaw.supportingSignals.map(s => String(s)) : []
      }
    : { action: (typeof nbaRaw === "string" && nbaRaw.trim()) ? nbaRaw.trim() : "Keep the customer engaged with one focused follow-up question.", confidence: "medium", reasoning: "", supportingSignals: [] };

  // --- Suggested responses: search deep, coerce strings to arrays ---
  const sugRaw = deepFind(safe, [
    "suggestedResponses", "suggested_responses", "responses", "replySuggestions",
    "suggestions", "suggestion", "recommended_responses", "reply_suggestions"
  ]);
  const suggestedResponses = toStringArray(coerceToArray(sugRaw)).slice(0, 3);


  // --- Alerts ---
  const alertsRawObj = deepFind(safe, ["alerts", "warnings", "flags", "warning", "alert", "red_flags"]);
  const alertsArr = Array.isArray(alertsRawObj) ? alertsRawObj : coerceToArray(alertsRawObj);
  const alerts = alertsArr.map(item => {
    if (typeof item === "string") return { message: item.trim(), level: "informational" };
    if (item && typeof item === "object") {
      const msg = String(item.message || item.text || item.title || "").trim();
      if (!msg) return null;
      let lvl = String(item.level || "informational").toLowerCase();
      if (!["critical", "important", "informational"].includes(lvl)) lvl = "informational";
      return { message: msg, level: lvl };
    }
    return null;
  }).filter(Boolean).slice(0, 4);

  // --- Intent signals ---
  const intentRaw = deepFind(safe, [
    "intentSignals", "intent_signals", "intent", "intentInsights",
    "buyer_intent", "buyerIntent", "intents"
  ]);
  const intentSignals = normalizeIntentSignals(coerceToArray(intentRaw));

  // --- Risk signals ---
  const riskRaw = deepFind(safe, [
    "riskSignals", "risk_signals", "risks", "riskInsights",
    "risk_factors", "riskFactors", "concerns"
  ]);
  const riskSignals = normalizeRiskSignals(coerceToArray(riskRaw));

  // --- Conversation analysis (search deep) ---
  const convRaw = deepFind(safe, [
    "conversationAnalysis", "conversation_analysis", "analysis", "metrics",
    "callAnalysis", "call_analysis", "conversation_metrics"
  ]);
  const conv = (convRaw && typeof convRaw === "object" && !Array.isArray(convRaw)) ? convRaw : {};

  const repRatio = deepFind(conv, ["talkRatioRep", "talk_ratio_rep", "repTalkRatio", "rep_ratio"]);
  const customerRatio = deepFind(conv, ["talkRatioCustomer", "talk_ratio_customer", "customerTalkRatio", "customer_ratio"]);
  const interruptionsVal = deepFind(conv, ["interruptions", "interruption_level", "interruption"]);
  const paceVal = deepFind(conv, ["pace", "speaking_pace", "speed"]);

  const interruptionsStr = String(interruptionsVal || "").toLowerCase();
  const paceStr = String(paceVal || "").toLowerCase();

  // --- Speaker identification (with per-speaker confidence) ---
  const speakerRaw = deepFind(safe, ["speakerIdentification", "speaker_identification", "speakers"]);
  const speakerIdentification = (speakerRaw && typeof speakerRaw === "object") ? {
    salesRepName: String(speakerRaw.salesRepName || speakerRaw.sales_rep_name || speakerRaw.repName || "Sales Rep").trim(),
    clientName: String(speakerRaw.clientName || speakerRaw.client_name || speakerRaw.customerName || "Client").trim(),
    speakerConfidence: (speakerRaw.speakerConfidence && typeof speakerRaw.speakerConfidence === "object")
      ? { rep: Number(speakerRaw.speakerConfidence.rep ?? 0.5), client: Number(speakerRaw.speakerConfidence.client ?? 0.5) }
      : { rep: 0.5, client: 0.5 },
    // Legacy compatibility
    confidence: String(speakerRaw.confidence || (speakerRaw.speakerConfidence?.rep > 0.75 ? "high" : speakerRaw.speakerConfidence?.rep > 0.5 ? "medium" : "low")).trim()
  } : { salesRepName: "Sales Rep", clientName: "Client", speakerConfidence: { rep: 0.5, client: 0.5 }, confidence: "low" };

  // --- Competitor intelligence ---
  const compRaw = deepFind(safe, ["competitorIntelligence", "competitor_intelligence", "competitors", "competitorInsights"]);
  const competitorIntelligence = Array.isArray(compRaw) ? compRaw.map(c => {
    if (!c || typeof c !== "object") return null;
    return {
      competitor: String(c.competitor || c.name || "").trim(),
      mentionedContext: String(c.mentionedContext || c.mentioned_context || c.context || "").trim(),
      ourAdvantage: String(c.ourAdvantage || c.our_advantage || c.advantage || "").trim(),
      talkTrack: String(c.talkTrack || c.talk_track || c.script || "").trim()
    };
  }).filter(c => c && c.competitor) : [];

  // --- Enhanced strategic tips (with exact scripts) ---
  const tipsRawObj = deepFind(safe, [
    "strategicTips", "strategic_tips", "tips", "coachingTips", "coaching_tips",
    "tacticalTips", "tactical_tips", "advice", "coaching_advice"
  ]);
  const strategicTipsArr = coerceToArray(tipsRawObj);
  const strategicTips = strategicTipsArr.map(item => {
    if (typeof item === "string") return { tip: item.trim(), exactScript: "", reasoning: "" };
    if (item && typeof item === "object") {
      return {
        tip: String(item.tip || item.title || item.text || item.label || "").trim(),
        exactScript: String(item.exactScript || item.exact_script || item.script || item.talkTrack || "").trim(),
        reasoning: String(item.reasoning || item.reason || item.why || "").trim()
      };
    }
    return null;
  }).filter(Boolean).slice(0, 4);

  // --- Chunk summary ---
  const chunkSummaryRaw = deepFind(safe, ["chunkSummary", "chunk_summary", "summary", "periodSummary"]);
  const chunkSummary = (typeof chunkSummaryRaw === "string" && chunkSummaryRaw.trim()) ? chunkSummaryRaw.trim() : "";

  // --- New fields mapping ---
  const buyingIntentRaw = deepFind(safe, ["buyingIntent", "buying_intent", "intent"]);
  const buyingIntent = (buyingIntentRaw && typeof buyingIntentRaw === "object") 
    ? { label: String(buyingIntentRaw.label || ""), reason: String(buyingIntentRaw.reason || "") } 
    : { label: String(buyingIntentRaw || ""), reason: "" };

  const objectionRiskRaw = deepFind(safe, ["objectionRisk", "objection_risk", "objection"]);
  const objectionRisk = (objectionRiskRaw && typeof objectionRiskRaw === "object") 
    ? { label: String(objectionRiskRaw.label || ""), reason: String(objectionRiskRaw.reason || "") } 
    : { label: String(objectionRiskRaw || ""), reason: "" };

  const urgency = String(deepFind(safe, ["urgency"]) || "").trim();

  const dmpRaw = deepFind(safe, ["decisionMakerPresence", "decision_maker_presence", "decisionMaker"]);
  const decisionMakerPresence = (dmpRaw && typeof dmpRaw === "object") 
    ? { 
        status: String(dmpRaw.status || ""), 
        confidence: String(dmpRaw.confidence || "medium"), 
        reason: Array.isArray(dmpRaw.reason) ? dmpRaw.reason.map(r => String(r)) : [String(dmpRaw.reason || "")] 
      } 
    : { status: String(dmpRaw || ""), confidence: "medium", reason: [] };

  const dmsRaw = deepFind(safe, ["dealMomentumScore", "deal_momentum_score", "momentumScore"]);
  const dealMomentumScore = (dmsRaw && typeof dmsRaw === "object")
    ? {
        score: Number(dmsRaw.score ?? 50),
        trendDirection: String(dmsRaw.trendDirection || "stable"),
        trendStrength: Number(dmsRaw.trendStrength ?? 0),
        drivers: Array.isArray(dmsRaw.drivers) ? dmsRaw.drivers.map(d => String(d)) : [],
        weightedFactors: (dmsRaw.weightedFactors && typeof dmsRaw.weightedFactors === "object") ? dmsRaw.weightedFactors : {}
      }
    : { score: Number(dmsRaw || 50), trendDirection: "stable", trendStrength: 0, drivers: [], weightedFactors: {} };

  const callStageRaw = String(deepFind(safe, ["callStage", "call_stage", "stage"]) || "").toLowerCase();
  let callStage = ["discovery", "demo", "negotiation", "closing", "unknown"].includes(callStageRaw) ? callStageRaw : "Likely Negotiation";
  if (callStage === "unknown") callStage = "Likely Negotiation";

  // stageConfidence — new structured breakdown from fast path
  const scRaw = deepFind(safe, ["stageConfidence", "stage_confidence"]);
  const stageConfidence = (scRaw && typeof scRaw === "object")
    ? {
        dominantStage: String(scRaw.dominantStage || callStage).replace("unknown", "Likely Negotiation"),
        confidence: String(scRaw.confidence || "medium"),
        breakdown: (scRaw.breakdown && typeof scRaw.breakdown === "object") ? scRaw.breakdown : {}
      }
    : { dominantStage: callStage, confidence: "medium", breakdown: {} };

  const objRaw = deepFind(safe, ["objectionTimeline", "objection_timeline", "objections"]);
  const objectionTimeline = Array.isArray(objRaw) ? objRaw.map(o => ({
      time: String(o.time || o.timestamp || "").trim(),
      objection: String(o.objection || o.issue || "").trim(),
      status: String(o.status || "raised").trim(),
      severity: String(o.severity || "medium").trim(),
      minutesUnresolved: Number(o.minutesUnresolved || 0)
  })).filter(o => o.objection) : [];

  // conversationDrift — handle both old string and new object shape
  const driftRaw = deepFind(safe, ["conversationDrift", "conversation_drift", "drift"]);
  const conversationDrift = (driftRaw && typeof driftRaw === "object")
    ? {
        detected: Boolean(driftRaw.detected),
        driftType: String(driftRaw.driftType || "none"),
        severity: String(driftRaw.severity || "none"),
        durationMinutes: Number(driftRaw.durationMinutes || 0),
        description: String(driftRaw.description || ""),
        recommendation: String(driftRaw.recommendation || "")
      }
    : (typeof driftRaw === "string" && driftRaw.trim())
      ? { detected: true, driftType: "feature_drift", severity: "medium", durationMinutes: 0, description: driftRaw.trim(), recommendation: "" }
      : { detected: false, driftType: "none", severity: "none", durationMinutes: 0, description: "", recommendation: "" };

  const result = {
    transcriptWindow,
    headline,
    speakerIdentification,
    intentSignals,
    riskSignals,
    conversationAnalysis: {
      talkRatioRep: repRatio !== undefined ? toPercent(repRatio, null) : null,
      talkRatioCustomer: customerRatio !== undefined ? toPercent(customerRatio, null) : null,
      interruptions: ["none", "low", "moderate", "high"].includes(interruptionsStr) ? interruptionsStr : null,
      pace: ["slow", "balanced", "fast"].includes(paceStr) ? paceStr : null
    },
    suggestedResponses,
    competitorIntelligence,
    strategicTips,
    alerts,
    nextBestAction,
    chunkSummary,
    buyingIntent,
    objectionRisk,
    urgency,
    decisionMakerPresence,
    dealMomentumScore,
    callStage,
    stageConfidence,
    objectionTimeline,
    conversationDrift
  };

  console.log("[LiveAssist] normalizeLiveInsights result:", result);
  return result;
}

// ── Model Routing Constants ────────────────────────────────────
// Whisper transcription → Groq (ultra fast, handled in transcribeAudioBlob)
// Suggested responses  → Groq Llama 3.1 8B (low latency)
// Strategic reasoning  → GPT-4o-mini via OpenRouter (stronger reasoning)
const FAST_RESPONSE_MODEL = "llama-3.1-8b-instant";       // Groq
const REASONING_MODEL = "meta-llama/llama-3.3-70b-instruct"; // OpenRouter Llama 3.3 70B (Strong reasoning)

export async function generateLiveAssistInsights(keys, payload) {
  const { recentTranscript, dealContext, runningStats, fullTranscriptTail, previousSummaries, requestType, callElapsedSeconds, conversationMemory } = payload;
  // keys can be a string (groq only) or { groq, openrouter }
  const groqKey = typeof keys === "string" ? keys : keys?.groq;
  const openrouterKey = typeof keys === "string" ? null : keys?.openrouter;

  const summaryContext = previousSummaries && previousSummaries.length > 0
    ? previousSummaries.map((s) => `[${s.time_start}-${s.time_end}] ${s.summary_text}`).join("\n")
    : "(no previous summaries yet — this is the start of the call)";

  const dealLine = dealContext
    ? `DEAL: ${dealContext.company || 'Unknown'} | Stage: ${dealContext.stage || 'Unknown'} | Value: $${(dealContext.value || 0).toLocaleString()}`
    : "";

  const elapsed = callElapsedSeconds || 0;
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = Math.floor(elapsed % 60);
  const timeLabel = `${elapsedMin}m ${elapsedSec}s`;

  // Build structured memory context for the LLM
  let memoryBlock = "";
  if (conversationMemory) {
    const parts = [];
    if (conversationMemory.objections?.length) {
      parts.push("TRACKED OBJECTIONS: " + conversationMemory.objections.map(o => `[${o.status}] "${o.matched}" (severity: ${o.severity}, mentions: ${o.mentionCount})`).join("; "));
    }
    if (conversationMemory.unresolvedObjections?.length) {
      parts.push("⚠ UNRESOLVED: " + conversationMemory.unresolvedObjections.map(o => `"${o.matched}"`).join(", "));
    }
    if (conversationMemory.competitors?.length) {
      parts.push("COMPETITORS MENTIONED: " + conversationMemory.competitors.map(c => c.name).join(", "));
    }
    if (conversationMemory.commitments?.length) {
      parts.push("COMMITMENTS: " + conversationMemory.commitments.map(c => `"${c.commitment}" [${c.status}]`).join("; "));
    }
    if (conversationMemory.momentumTrend) {
      const mt = conversationMemory.momentumTrend;
      parts.push(`MOMENTUM TREND: ${mt.trendDirection} (strength: ${mt.trendStrength}%, recent avg: ${mt.avgRecent})`);
    }
    if (conversationMemory.buyingSignals?.length) {
      parts.push("BUYING SIGNALS: " + conversationMemory.buyingSignals.map(b => `"${b.text}"`).join(", "));
    }
    if (parts.length) memoryBlock = "\n\nSTRUCTURED MEMORY (use for reasoning):\n" + parts.join("\n");
  }

  const transcriptBlock = [
    `CALL ELAPSED TIME: ${timeLabel}`,
    "",
    "CONVERSATION MEMORY (earlier in the call — use this for context continuity):",
    summaryContext,
    "",
    "LIVE TRANSCRIPT (last 30s — the rep needs to respond to THIS now):",
    recentTranscript || "(no speech yet)"
  ];

  if (fullTranscriptTail && fullTranscriptTail !== recentTranscript) {
    transcriptBlock.push("", "EXTENDED CONTEXT (last ~60s):", fullTranscriptTail);
  }
  if (dealLine) transcriptBlock.push("", dealLine);
  if (runningStats) {
    transcriptBlock.push("", `STATS: ${runningStats.totalWords} words | ${runningStats.segmentCount} segments | Rep ~${runningStats.estimatedTalkRatioRep}% / Customer ~${runningStats.estimatedTalkRatioCustomer}%`);
  }

  const transcriptText = transcriptBlock.join("\n") + memoryBlock;

  // ─────────────────────────────────────────────────────────────────
  // FAST PATH → Groq Llama 3.1 8B: Suggested Responses + Speaker ID
  // ─────────────────────────────────────────────────────────────────

  // Determine the coaching posture based on call elapsed time
  let stageGuidance;
  if (elapsed < 15) {
    stageGuidance = [
      "CALL JUST STARTED (< 15 seconds). The rep has minimal context.",
      "Generate generic but professional opening responses:",
      "  - A warm greeting + purpose of call",
      "  - An open-ended discovery question like 'What prompted you to look into this?'",
      "  - A rapport-building statement",
      "Do NOT reference specific topics since none have been discussed yet."
    ].join("\n");
  } else if (elapsed < 120) {
    stageGuidance = [
      "EARLY CALL (Rapport & Discovery phase, 15s-2min).",
      "The rep should be LISTENING and asking discovery questions.",
      "Generate responses that:",
      "  - Probe for pain points: 'What's the biggest bottleneck in your current process?'",
      "  - Explore business impact: 'How is that affecting your team's output?'",
      "  - Qualify: 'Who else is involved in evaluating solutions?'",
      "Reference SPECIFIC details the client just mentioned. Do NOT ask for info already provided."
    ].join("\n");
  } else if (elapsed < 300) {
    stageGuidance = [
      "MID-CALL (Qualification / Objection / Demo phase, 2-5min).",
      "The client has shared context. The rep should be building value and handling concerns.",
      "Generate responses that:",
      "  - Connect features to the client's SPECIFIC pain points from earlier in the call",
      "  - Handle objections with evidence: 'Many teams with that concern found that...'",
      "  - Advance the conversation: 'Based on what you described about [X], let me show you...'",
      "ALWAYS reference earlier conversation context from CONVERSATION MEMORY."
    ].join("\n");
  } else {
    stageGuidance = [
      "LATE CALL (Commercial / Closing / Next Steps phase, 5min+).",
      "The rep should be driving toward commitment.",
      "Generate responses that:",
      "  - Ask for commitment: 'Based on everything we discussed, shall we move forward with a pilot?'",
      "  - Summarize value: 'So to recap, we solve [pain 1] and [pain 2] which saves your team...'",
      "  - Establish next steps: 'I can send the proposal by Friday — does that timeline work?'",
      "  - Address any unresolved objections from CONVERSATION MEMORY."
    ].join("\n");
  }

  const fastSystemPrompt = [
    "You are a real-time AI sales co-pilot embedded in a live call. Return ONLY valid JSON, NO markdown.",
    "",
    "OUTPUT exactly this JSON shape:",
    "{",
    '  "suggestedResponses": ["<verbatim sentence 1>", "<verbatim sentence 2>", "<verbatim sentence 3>"],',
    '  "nextBestAction": {"action": "<exact sentence rep says RIGHT NOW>", "confidence": "<low|medium|high>", "reasoning": "<why this action now>", "supportingSignals": ["<signal 1>", "<signal 2>"]},',
    '  "speakerIdentification": {"salesRepName": "<name or Sales Rep>", "clientName": "<name or Client>", "speakerConfidence": {"rep": <0.0-1.0>, "client": <0.0-1.0>}},',
    '  "stageConfidence": {"dominantStage": "<stage>", "confidence": "<low|medium|high>", "breakdown": {"discovery": <0-1>, "qualification": <0-1>, "demo": <0-1>, "objection": <0-1>, "negotiation": <0-1>, "closing": <0-1>}}',
    "}",
    "",
    "── STAGE CONTEXT ──",
    stageGuidance,
    "",
    "── CRITICAL RULES ──",
    "1. EXACTLY 3 suggested responses. Each is a COMPLETE sentence the rep reads VERBATIM.",
    "2. Each response MUST reference something SPECIFIC from the transcript or conversation memory.",
    "   BAD: 'Can you tell me about your needs?' (generic)",
    "   GOOD: 'You mentioned your team spends 3 hours on manual data entry — how many people are affected?' (contextual)",
    "3. PREDICT what the client is likely to say/ask next and prepare responses proactively.",
    "   If client said 'We're worried about onboarding speed', ANTICIPATE the follow-up and suggest:",
    "   'We typically onboard enterprise teams in under 2 weeks with a dedicated success manager.'",
    "4. DO NOT repeat information the client already provided. If they told you the car model, do NOT ask for it.",
    "5. DO NOT use these generic phrases: 'Would you like to hear more', 'Can I help', 'That's a great question', 'I understand your concern', 'Tell me more about that'.",
    "6. nextBestAction.confidence: 'high' if 2+ supporting signals exist, 'medium' if 1, 'low' if inferred.",
    "7. speakerIdentification: assign confidence 0.0-1.0 per speaker. Use 0.5 if name is unknown. Increase for explicit name mentions.",
    "8. stageConfidence.breakdown: all 6 values MUST sum to approximately 1.0. Normalize them.",
    "9. Read the CONVERSATION MEMORY section carefully — reference earlier parts of the call to show continuity."
  ].join("\n");

  // ─────────────────────────────────────────────────────────────────
  // REASONING PATH → Llama 3.3 70B: Strategic Coaching + Momentum
  // ─────────────────────────────────────────────────────────────────
  const reasoningSystemPrompt = [
    "You are a senior sales strategist analyzing a live call. Return ONLY valid JSON with NO markdown.",
    "",
    "OUTPUT exactly this JSON shape:",
    "{",
    '  "headline": "<one-line tactical insight about what just happened>",',
    '  "intentSignals": [{"label": "<signal>", "confidence": <0-100>, "evidence": "<exact quote from transcript>"}],',
    '  "riskSignals": [{"label": "<risk>", "severity": "<low|medium|high>", "evidence": "<exact quote>"}],',
    '  "conversationAnalysis": {"talkRatioRep": <0-100>, "talkRatioCustomer": <0-100>, "interruptions": "<none|low|moderate|high>", "pace": "<slow|balanced|fast>"},',
    '  "competitorIntelligence": [{"competitor": "<name>", "mentionedContext": "<context>", "ourAdvantage": "<weakness mapping>", "talkTrack": "<tactical response>"}],',
    '  "strategicTips": [{"tip": "<tip>", "exactScript": "<full sentence>", "reasoning": "<why>"}],',
    '  "chunkSummary": "<2 sentence summary: what happened and what it means for the deal>",',
    '  "buyingIntent": {"label": "<intent level>", "reason": "<evidence-based reasoning from transcript>"},',
    '  "objectionRisk": {"label": "<objection type>", "reason": "<evidence-based reasoning from transcript>"},',
    '  "urgency": "<detected urgency or empty string>",',
    '  "decisionMakerPresence": {"status": "<absent|present>", "confidence": "<low|medium|high>", "reason": ["<evidence>"]},',
    '  "dealMomentumScore": {',
    '    "score": <0-100>,',
    '    "trendDirection": "<rising|stable|declining>",',
    '    "trendStrength": <0-100>,',
    '    "drivers": ["+ <positive driver with evidence>", "- <friction point with evidence>"],',
    '    "weightedFactors": {"objectionPersistence": <-30 to 0>, "buyingAcceleration": <0 to 30>, "commitmentReinforcement": <0 to 20>, "stakeholderEngagement": <0 to 15>, "conversationVelocity": <-10 to 10>}',
    '  },',
    '  "conversationDrift": {',
    '    "detected": <true|false>,',
    '    "driftType": "<feature_drift|discovery_starvation|objection_avoidance|premature_closing|over_talking|technical_deep_dive|none>",',
    '    "severity": "<low|medium|high|none>",',
    '    "durationMinutes": <number or 0>,',
    '    "description": "<human-readable description of the drift>",',
    '    "recommendation": "<exact rep action to recover>"',
    '  },',
    '  "objectionTimeline": [{"time": "<timestamp>", "objection": "<issue>", "status": "<raised|partially_addressed|resolved|recurring>", "severity": "<low|medium|high>", "minutesUnresolved": <number>}]',
    "}",
    "",
    "MOMENTUM SCORING RULES (CRITICAL):",
    "- Base score: 50 (neutral).",
    "- objectionPersistence: -5 per unresolved objection from memory. Max -30.",
    "- buyingAcceleration: +8 per strong buying signal (timeline ask, contract mention). Max +30.",
    "- commitmentReinforcement: +7 per commitment made (follow-up agreed, proposal accepted). Max +20.",
    "- stakeholderEngagement: +5 if decision maker is present/confirmed. Max +15.",
    "- conversationVelocity: +5 if pace is accelerating toward close, -5 if stalling.",
    "- NEVER invent signals. Base ALL adjustments on transcript evidence or STRUCTURED MEMORY.",
    "",
    "DRIFT DETECTION RULES:",
    "- feature_drift: Rep spending 5+ minutes on features without qualifying business need.",
    "- discovery_starvation: Rep asked <2 discovery questions in 8+ minutes.",
    "- objection_avoidance: 2+ objections raised, none directly addressed.",
    "- premature_closing: Rep pushing close before budget/authority/need confirmed.",
    "- over_talking: Rep talk ratio >70% for 5+ minutes.",
    "- technical_deep_dive: Conversation locked on implementation/API details before value established.",
    "",
    "OTHER RULES:",
    "- COMPETITOR INTEL: Only include if a competitor is explicitly mentioned. Map their weakness to our advantage.",
    "- STRATEGIC TIPS: 2-3 tips max. Be EXTREMELY decisive and tactical. Describe exactly what behavior the rep should change based on specific client phrasing (e.g. 'Client paused after pricing. Shift from urgency to ROI justification.'). Provide a strong tactical script.",
    "- CHUNK SUMMARY: Must show SEMANTIC PROGRESSION. Describe what changed, shifted, or escalated (e.g. 'Customer shifted from gathering info to purchase readiness'). Do NOT just repeat 'Customer is interested'.",
    "- Return empty arrays [] for fields with no evidence — never fabricate data."
  ].join("\n");

  const fastMessages = [
    { role: "system", content: fastSystemPrompt },
    { role: "user", content: transcriptText }
  ];

  const reasoningMessages = [
    { role: "system", content: reasoningSystemPrompt },
    { role: "user", content: transcriptText }
  ];

  const insightRequestType = requestType || "full";
  const runFast = insightRequestType !== "summary_only";
  const runReasoning = insightRequestType !== "tactical_only";

  const [fastResult, reasoningResult] = await Promise.allSettled([
    // Fast path: Groq Llama 3.1 8B (skipped for summary_only)
    (runFast && groqKey)
      ? tryModel({ groq: groqKey }, fastMessages, {
          model: FAST_RESPONSE_MODEL,
          temperature: 0.4,
          max_tokens: 400,
          response_format: { type: "json_object" }
        })
      : Promise.reject(new Error("Skipped fast path")),

    // Reasoning path (SKIPPED on tactical_only)
    (runReasoning && openrouterKey)
      ? tryModel({ openrouter: openrouterKey }, reasoningMessages, {
          model: REASONING_MODEL,
          temperature: 0.3,
          max_tokens: 900,
          response_format: { type: "json_object" }
        })
      : (runReasoning && groqKey)
        ? tryModel({ groq: groqKey }, reasoningMessages, {
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 900,
            response_format: { type: "json_object" }
          })
        : Promise.reject(new Error("Skipped reasoning path"))
  ]);

  // Parse fast path result
  const fastParsed = fastResult.status === "fulfilled"
    ? (safeJsonParse(fastResult.value.text) || {})
    : {};

  // Parse reasoning path result
  const reasoningParsed = reasoningResult.status === "fulfilled"
    ? (safeJsonParse(reasoningResult.value.text) || {})
    : {};

  if (
    !fastParsed.suggestedResponses &&
    !reasoningParsed.headline &&
    !reasoningParsed.chunkSummary
  ) {
    const err = fastResult.reason || reasoningResult.reason;
    throw new Error(err?.message || "Both LLM paths failed");
  }

  // Merge: fast path fields override their slots, reasoning fills the rest
  const merged = { ...reasoningParsed, ...fastParsed };

  const providerFast = fastResult.status === "fulfilled" ? (fastResult.value.provider || "Groq") : "—";
  const providerReasoning = reasoningResult.status === "fulfilled" ? (reasoningResult.value.provider || "OpenRouter") : "—";

  const result = normalizeLiveInsights(merged, recentTranscript);
  result._provider = openrouterKey ? `${providerFast} + ${providerReasoning}` : providerFast;
  return result;
}

/**
 * ── Strategic Post-Call Summary Engine ─────────────────────────────
 * Centralized service for the final call analysis.
 * Uses tryModel to handle Groq rate limits (429) with automatic 
 * circuit breakers and OpenRouter fallbacks.
 * 
 * Enhanced: Accepts conversation memory and insights snapshot for
 * richer, stateful analysis with deal evolution narrative.
 */
export async function generateStrategicSummary(keys, payload) {
  const {
    repName, clientName, duration, chunkTexts,
    talkRatioRep, talkRatioCustomer,
    conversationMemory, insightsSnapshot
  } = payload;

  // Build conversation memory context string
  let memoryContext = '';
  if (conversationMemory) {
    const parts = [];
    if (conversationMemory.objections?.length > 0) {
      parts.push(`DETECTED OBJECTIONS:\n${conversationMemory.objections.map(o => `- "${o.text || o.matched}" (status: ${o.status}, severity: ${o.severity}, mentioned ${o.mentionCount}x)`).join('\n')}`);
    }
    if (conversationMemory.unresolvedObjections?.length > 0) {
      parts.push(`⚠ UNRESOLVED OBJECTIONS: ${conversationMemory.unresolvedObjections.map(o => `"${o.text || o.matched}"`).join(', ')}`);
    }
    if (conversationMemory.competitors?.length > 0) {
      parts.push(`COMPETITORS MENTIONED: ${conversationMemory.competitors.map(c => c.name).join(', ')}`);
    }
    if (conversationMemory.buyingSignals?.length > 0) {
      parts.push(`BUYING SIGNALS: ${conversationMemory.buyingSignals.map(b => `"${b.text}"`).join(', ')}`);
    }
    if (conversationMemory.commitments?.length > 0) {
      parts.push(`COMMITMENTS MADE: ${conversationMemory.commitments.map(c => `"${c.commitment}" (${c.status})`).join(', ')}`);
    }
    if (conversationMemory.momentumTrend) {
      const mt = conversationMemory.momentumTrend;
      parts.push(`MOMENTUM TREND: ${mt.trendDirection} (avg recent: ${mt.avgRecent}, avg prev: ${mt.avgPrev})`);
    }
    memoryContext = parts.length > 0 ? `\n\nSTRUCTURED CONVERSATION MEMORY (accumulated throughout the call):\n${parts.join('\n\n')}` : '';
  }

  // Build insights snapshot context
  let insightsContext = '';
  if (insightsSnapshot) {
    const parts = [];
    if (insightsSnapshot.buyingIntent?.label) parts.push(`Buying Intent: ${insightsSnapshot.buyingIntent.label} — ${insightsSnapshot.buyingIntent.reason || ''}`);
    if (insightsSnapshot.objectionRisk?.label) parts.push(`Objection Risk: ${insightsSnapshot.objectionRisk.label} — ${insightsSnapshot.objectionRisk.reason || ''}`);
    if (insightsSnapshot.dealMomentumScore?.score != null) {
      parts.push(`Deal Momentum: ${insightsSnapshot.dealMomentumScore.score}/100 (${insightsSnapshot.dealMomentumScore.trendDirection})`);
      if (insightsSnapshot.dealMomentumScore.drivers?.length > 0) {
        parts.push(`Momentum Drivers: ${insightsSnapshot.dealMomentumScore.drivers.join('; ')}`);
      }
    }
    if (insightsSnapshot.stageConfidence?.dominantStage) {
      parts.push(`Call Stage: ${insightsSnapshot.stageConfidence.dominantStage} (${insightsSnapshot.stageConfidence.confidence})`);
    }
    insightsContext = parts.length > 0 ? `\n\nFINAL INSIGHTS SNAPSHOT:\n${parts.join('\n')}` : '';
  }

  const systemPrompt = `You are a staff-level Enterprise Sales Analyst producing a premium post-call intelligence report. Do not just summarize—ANALYZE deeply. Provide actionable strategic insights.

Include the following sections strictly:
1. CALL OVERVIEW: (Participants, duration, context, deal stage)
2. DEAL EVOLUTION NARRATIVE: (A chronological story arc explaining how the deal progressed, shifted, weakened, or strengthened during the call. Reference specific moments. e.g., "Began as exploratory discovery, transitioned to active evaluation at minute 3 when pricing was discussed, momentum declined at minute 5 due to unresolved budget concern.")
3. RISK ASSESSMENT MATRIX: (Categorized risks: Deal Risk, Relationship Risk, Competitive Risk, Timeline Risk — each with severity and mitigation recommendation)
4. KEY DISCUSSION POINTS: (Tactical summary of major topics with client sentiment per topic)
5. OBJECTION ANALYSIS: (Each objection detected, whether it was resolved, and how effectively)
6. COMMITMENTS & NEXT STEPS: (Clear action items with ownership and timeline)
7. COACHING HEATMAP: (Identify strongest and weakest rep moments. INTERPRET the talk ratio in context. Flag specific phrases or behaviors. e.g., "Rep dominated the pricing discussion (78% talk time) which may have suppressed client objections. However, discovery phase showed excellent listening ratio at 40/60.")
8. STRATEGIC RECOMMENDATION: (One clear recommendation for the next interaction)

Use the exact names: ${repName} (Rep) and ${clientName} (Client).
Be extremely decisive, analytical, and specific. Reference actual content from the conversation.`;

  const userPrompt = `Call Duration: ${duration}
Talk Ratio: Rep ${talkRatioRep}%, Client ${talkRatioCustomer}%

Chunk-by-chunk summaries from the call (analyze progression, do NOT just repeat these):
${chunkTexts}${memoryContext}${insightsContext}

Generate a premium, synthesized call intelligence report with deep ANALYTICAL INSIGHTS, Deal Evolution Narrative, Risk Assessment Matrix, Coaching Heatmap, and Strategic Recommendation.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  // Uses tryModel: 2 attempts on Groq, 60s cooldown on 429, auto-fallback to OpenRouter
  // Upgraded to llama-3.3-70b-versatile for better reasoning on the final summary
  const result = await tryModel(keys, messages, {
    model: "llama-3.3-70b-versatile",
    temperature: 0.35,
    max_tokens: 2000
  });

  return result;
}

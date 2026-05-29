# ⚡ Live Call Assist (Co-Pilot) Endpoint Reference

This document isolates the specific endpoints and backend dependencies used exclusively by the **Live Call Assist (Sales Co-Pilot)** feature within Module 2. 

The Live Call Assist system operates primarily via a **client-side engine** (`localEventEngine.js`) that directly calls external AI APIs for zero-latency coaching. It also relies on a subset of the M02 backend API for broader document analysis and RAG tasks.

---

## 🤖 1. Client-Side AI API Integrations (Direct from Browser)

These endpoints are called directly from the user's browser (via `gemini.js`) to achieve sub-second latency during live calls.

| Feature | External Endpoint | Method | Auth Needed | Provider |
|:---|:---|:---|:---|:---|
| **Audio Transcription** | `https://api.groq.com/openai/v1/audio/transcriptions` | **POST** | `Bearer <GROQ_KEY>` | Groq (Whisper `large-v3`) |
| **Tactical Coaching** <br>*(Quick Tips, Competitor Flash)* | `https://api.groq.com/openai/v1/chat/completions` | **POST** | `Bearer <GROQ_KEY>` | Groq (`llama-3.1-8b-instant`) |
| **Deep Analysis** <br>*(BANT, Deal Summaries)* | `https://openrouter.ai/api/v1/chat/completions` | **POST** | `Bearer <OPENROUTER_KEY>` | OpenRouter (`deepseek-r1`, `llama-3.3-70b-instruct`) |

*(Note: Live Assist previously integrated with Supabase for persistent live session recording. The feature has been refactored to hold state in-memory during the call, eliminating the direct Supabase API dependencies.)*

---

## 🚀 2. Backend Fallback & RAG Integrations (`api-client.js`)

When Live Assist needs to pull CRM data, perform document comparisons, or run Heavy RAG operations, it proxies these requests through the **M02 NestJS API**, which optionally falls back to a FastAPI backend.

These are routed via `http://localhost:3002/api/v1` (NestJS).

| Client Function | Target Path | Method | Description |
|:---|:---|:---|:---|
| **Health Check** | `/health` | **GET** | Verifies if NestJS (and fallback FastAPI) are online. |
| **Summarize Text** | `/documents/analyze/text` | **POST** | Deep summarization of a transcript or deal record. |
| **Summarize File** | `/upload/file` | **POST** | Analyzes an uploaded document (e.g., MSA, Security Questionnaire). |
| **RAG Chat** | `/chat/ask` | **POST** | "Ask anything" queries against the live transcript and CRM data. |
| **Compare Documents** | `/compare/documents` | **POST** | Compares active deal notes against historical wins. |
| **Version Diff** | `/version/diff` | **POST** | Evaluates proposal variations or transcript chunks. |
| **Extract Insights** | `/documents/extract/insights` | **POST** | Extracts BANT criteria, MEDDIC scores, or next steps. |

---

## 📊 3. Associated Core M02 Endpoints

These are standard Module 2 endpoints that Live Assist consumes to load conversation histories or apply topics post-call.

| Endpoint Path | Method | Description |
|:---|:---|:---|
| `/api/v1/conversation-intelligence/conversations` | **GET** | Retrieves past conversations for context. |
| `/api/v1/conversation-intelligence/trackers/detections/:entityId` | **GET** | Loads smart keyword tracking hits for the active call. |
| `/api/v1/m02-conversation-intelligence/translate` | **POST** | Translates live transcripts on-the-fly. |
| `/api/v1/conversation-intelligence/ingest/from-transcription` | **POST** | Triggers backend post-processing once the live call finishes. |

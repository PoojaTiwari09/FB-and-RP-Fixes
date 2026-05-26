/**
 * SalesIQ Embeddings & Retrieval Service
 *
 * Provides:
 * 1. Text chunking for transcripts
 * 2. 768-dimensional embedding generation using Gemini API with a failsafe local fallback
 * 3. Local semantic retrieval fallback (for offline or demo mode)
 */

import { EMAILS as MOCK_EMAILS } from "../data/crm";

/**
 * Splits a call transcript into overlapping chunks of a given size.
 */
export function chunkTranscript(text, chunkSize = 500, overlap = 100) {
  if (!text) return [];
  const cleanText = text.trim();
  if (cleanText.length <= chunkSize) return [cleanText];

  const chunks = [];
  let index = 0;

  const safeOverlap = Math.min(overlap, chunkSize - 1);

  while (index < cleanText.length) {
    let chunk = cleanText.substring(index, index + chunkSize);

    if (index + chunkSize >= cleanText.length) {
      const trimmed = chunk.trim();
      if (trimmed.length > 5) {
        chunks.push(trimmed);
      }
      break;
    }

    const lastSpace = chunk.lastIndexOf(" ");
    if (lastSpace > chunkSize * 0.7) {
      chunk = chunk.substring(0, lastSpace);
    }

    const trimmed = chunk.trim();
    if (trimmed.length > 5) {
      chunks.push(trimmed);
    }

    const step = Math.max(1, chunk.length - safeOverlap);
    index += step;
  }

  return chunks;
}

/**
 * Generates a 768-dimensional vector embedding for a piece of text.
 * Uses Gemini API's text-embedding-004 model if a Gemini key is present,
 * and falls back to a deterministic, high-performance local mathematical embedding.
 */
export async function generateEmbedding(apiKey, text) {
  const cleanText = text.trim();
  if (!cleanText) return new Array(768).fill(0);

  if (apiKey && apiKey.startsWith("AIzaSy")) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: cleanText }] },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const vector = json.embedding?.values;
        if (Array.isArray(vector) && vector.length === 768) {
          return vector;
        }
      } else {
        console.warn(`Gemini embedding API returned status ${response.status}. Falling back to offline embedding.`);
      }
    } catch (err) {
      console.warn("Failed to generate embedding from Gemini API. Falling back to offline embedding.", err);
    }
  }

  return getLocalMathEmbedding(cleanText);
}

/**
 * Deterministic multi-pass hash-based text vectorizer.
 */
function getLocalMathEmbedding(text) {
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().match(/\w+/g) || [];
  if (words.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let h1 = 5381;
    let h2 = 33;
    for (let j = 0; j < word.length; j++) {
      h1 = ((h1 << 5) + h1) + word.charCodeAt(j);
      h2 = (h2 * 33) ^ word.charCodeAt(j);
    }
    const idx1 = Math.abs(h1) % 768;
    const idx2 = Math.abs(h2) % 768;
    vector[idx1] += 1.0;
    vector[idx2] += 0.5;
  }

  let sumSq = 0;
  for (let i = 0; i < 768; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < 768; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Offline / Demo-mode retrieval engine that performs cosine similarity matches in JavaScript.
 */
export function localSemanticSearch(queryVector, calls, mockChunks = [], dealId = null, accountId = null, queryText = "") {
  let candidates = [];

  if (mockChunks && mockChunks.length > 0) {
    candidates = mockChunks.map(c => {
      const parentCall = calls.find(call => call.id === c.call_id);
      return {
        id: c.id,
        call_id: c.call_id,
        chunk_text: c.chunk_text,
        embedding: c.embedding || getLocalMathEmbedding(c.chunk_text),
        deal_id: parentCall?.deal || parentCall?.deal_id || null,
        account_id: parentCall?.account_id || null,
        date: parentCall?.created_at || "",
        source_type: "call",
        title: parentCall?.title || "Call Transcript"
      };
    });
  } else {
    calls.forEach(call => {
      const chunks = chunkTranscript(call.transcript || call.summary || "");
      chunks.forEach((chunkText, idx) => {
        candidates.push({
          id: `CHUNK_${call.id}_${idx}`,
          call_id: call.id,
          chunk_text: chunkText,
          embedding: getLocalMathEmbedding(chunkText),
          deal_id: call.deal || call.deal_id || null,
          account_id: call.account_id || null,
          date: call.created_at || "",
          source_type: "call",
          title: call.title || "Call Transcript"
        });
      });
    });

    const emailsList = MOCK_EMAILS || [];
    emailsList.forEach(email => {
      candidates.push({
        id: `EMAIL_${email.id}`,
        call_id: email.id,
        chunk_text: `[EMAIL] Subject: ${email.subject} | From: ${email.sender}\nBody: ${email.body}`,
        embedding: getLocalMathEmbedding(email.body),
        deal_id: email.dealId || email.deal_id || null,
        account_id: email.accountId || email.account_id || null,
        date: email.created_at || "",
        source_type: "email",
        title: `Email: ${email.subject}`
      });
    });
  }

  const filtered = candidates.filter(c => {
    if (dealId && c.deal_id !== dealId) return false;
    if (accountId && c.account_id !== accountId) return false;
    return true;
  });

  const scored = filtered.map(c => {
    let dotProduct = 0;
    for (let i = 0; i < 768; i++) {
      dotProduct += queryVector[i] * c.embedding[i];
    }

    let recencyBoost = 0;
    if (c.date) {
      const dateVal = new Date(c.date).getTime();
      if (!isNaN(dateVal)) {
        const baseDate = new Date("2024-06-20").getTime();
        const diffDays = (dateVal - baseDate) / (1000 * 60 * 60 * 24);
        recencyBoost = Math.max(0, diffDays * 0.005);
      }
    }

    return {
      id: c.id,
      call_id: c.call_id,
      chunk_text: c.chunk_text,
      similarity: dotProduct + recencyBoost,
      source_type: c.source_type,
      call_title: c.title,
      date: c.date
    };
  });

  let results = scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .filter(c => c.similarity > 0.05);

  if (results.length === 0 && queryText) {
    const qLower = queryText.toLowerCase();
    const keywords = qLower.split(/\s+/).filter(w => w.length > 3);

    if (keywords.length > 0) {
      const matchedCalls = calls.filter(call => {
        const titleMatches = keywords.some(kw => call.title.toLowerCase().includes(kw));
        const transcriptMatches = keywords.some(kw => (call.transcript || "").toLowerCase().includes(kw));
        return titleMatches || transcriptMatches;
      });

      const emailsList = MOCK_EMAILS || [];
      const matchedEmails = emailsList.filter(email => {
        const subjectMatches = keywords.some(kw => email.subject.toLowerCase().includes(kw));
        const bodyMatches = keywords.some(kw => email.body.toLowerCase().includes(kw));
        return subjectMatches || bodyMatches;
      });

      if (matchedCalls.length > 0 || matchedEmails.length > 0) {
        const fallbackCandidates = filtered.filter(c => 
          (c.source_type === "call" && matchedCalls.some(call => call.id === c.call_id)) ||
          (c.source_type === "email" && matchedEmails.some(email => email.id === c.call_id))
        );
        results = fallbackCandidates.map(c => ({
          id: c.id,
          call_id: c.call_id,
          chunk_text: c.chunk_text,
          similarity: 0.95,
          source_type: c.source_type,
          call_title: c.title,
          date: c.date
        })).slice(0, 5);
      }
    }
  }

  return results;
}

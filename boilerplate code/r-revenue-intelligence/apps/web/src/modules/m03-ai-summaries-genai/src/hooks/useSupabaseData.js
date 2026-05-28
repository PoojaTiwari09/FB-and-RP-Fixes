import { useState, useEffect, useCallback } from "react";
/** @deprecated Use `useM03Workspace` + `m03Api.js`; Supabase removed. */
function getSupabaseClient() {
  return null;
}
import { generateEmbedding, chunkTranscript } from "../services/embeddings";
import {
  DEALS as MOCK_DEALS,
  CONTACTS as MOCK_CONTACTS,
  ACCOUNTS as MOCK_ACCOUNTS,
  CALLS as MOCK_CALLS,
} from "../data/crm";

function isSchemaMissing(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = err.code || "";
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    code === "42P01" ||
    code === "PGRST116" ||
    code === "PGRST200"
  );
}

async function safeFetch(query, onSchemaMissing) {
  const result = await query;
  if (result.error) {
    if (isSchemaMissing(result.error)) {
      onSchemaMissing();
      return [];
    }
    throw result.error;
  }
  return result.data || [];
}

export default function useSupabaseData() {
  const [connected, setConnected]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [schemaError, setSchemaError] = useState(false);

  const [deals, setDeals]             = useState(MOCK_DEALS);
  const [contacts, setContacts]       = useState(MOCK_CONTACTS);
  const [accounts, setAccounts]       = useState(MOCK_ACCOUNTS);
  const [calls, setCalls]             = useState(MOCK_CALLS);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchAll = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) {
      setConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSchemaError(false);

    const markSchema = () => setSchemaError(true);

    try {
      const [dealsData, contactsData, accountsData, callsData, chatData] =
        await Promise.all([
          safeFetch(sb.from("deals").select("*").order("created_at", { ascending: false }), markSchema),
          safeFetch(sb.from("contacts").select("*").order("name"), markSchema),
          safeFetch(sb.from("accounts").select("*").order("name"), markSchema),
          safeFetch(sb.from("calls").select("*").order("created_at", { ascending: false }), markSchema),
          safeFetch(sb.from("ai_chat_history").select("*").order("created_at", { ascending: false }), markSchema),
        ]);

      setConnected(true);

      if (dealsData.length)      setDeals(dealsData.map(normalizeDeal));
      if (contactsData.length)   setContacts(contactsData.map(normalizeContact));
      if (accountsData.length)   setAccounts(accountsData.map(normalizeAccount));
      if (callsData.length)      setCalls(callsData.map(normalizeCall));
      if (chatData.length)       setChatHistory(chatData);
    } catch (e) {
      console.error("Supabase fetch error:", e);
      if (isSchemaMissing(e)) {
        setSchemaError(true);
        setConnected(false);
      } else {
        setError(e.message);
        setConnected(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── DEALS CRUD ─────────────────────────────────────────
  async function addDeal(dealData) {
    const sb = getSupabaseClient();
    const newDeal = {
      id: dealData.id || `D${Date.now()}`,
      name: dealData.name,
      stage: dealData.stage || "Qualification",
      account_id: dealData.accountId || dealData.account_id || null,
    };

    if (sb) {
      const { data, error } = await sb.from("deals").insert(newDeal).select().single();
      if (error) throw error;
      const normalized = normalizeDeal(data);
      setDeals(prev => [normalized, ...prev]);
      return normalized;
    } else {
      const normalized = normalizeDeal(newDeal);
      setDeals(prev => [normalized, ...prev]);
      return normalized;
    }
  }

  async function updateDeal(id, updates) {
    const sb = getSupabaseClient();
    const dbUpdates = denormalizeDeal(updates);

    if (sb) {
      const { data, error } = await sb.from("deals").update(dbUpdates).eq("id", id).select().single();
      if (error) throw error;
      const normalized = normalizeDeal(data);
      setDeals(prev => prev.map(d => d.id === id ? normalized : d));
      return normalized;
    } else {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  }

  async function deleteDeal(id) {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("deals").delete().eq("id", id);
      if (error) throw error;
    }
    setDeals(prev => prev.filter(d => d.id !== id));
  }

  // ── CONTACTS CRUD ──────────────────────────────────────
  async function addContact(contactData) {
    const sb = getSupabaseClient();
    const newContact = {
      id: contactData.id || `C${Date.now()}`,
      name: contactData.name,
      email: contactData.email || "",
      account_id: contactData.accountId || contactData.account_id || null,
    };

    if (sb) {
      const { data, error } = await sb.from("contacts").insert(newContact).select().single();
      if (error) throw error;
      const normalized = normalizeContact(data);
      setContacts(prev => [normalized, ...prev]);
      return normalized;
    } else {
      const normalized = normalizeContact(newContact);
      setContacts(prev => [normalized, ...prev]);
      return normalized;
    }
  }

  async function updateContact(id, updates) {
    const sb = getSupabaseClient();
    const dbUpdates = denormalizeContact(updates);

    if (sb) {
      const { data, error } = await sb.from("contacts").update(dbUpdates).eq("id", id).select().single();
      if (error) throw error;
      const normalized = normalizeContact(data);
      setContacts(prev => prev.map(c => c.id === id ? normalized : c));
      return normalized;
    } else {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  }

  async function deleteContact(id) {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("contacts").delete().eq("id", id);
      if (error) throw error;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  // ── ACCOUNTS CRUD ──────────────────────────────────────
  async function addAccount(accData) {
    const sb = getSupabaseClient();
    const newAcc = {
      id: accData.id || `A${Date.now()}`,
      name: accData.name,
    };

    if (sb) {
      const { data, error } = await sb.from("accounts").insert(newAcc).select().single();
      if (error) throw error;
      const normalized = normalizeAccount(data);
      setAccounts(prev => [normalized, ...prev]);
      return normalized;
    } else {
      const normalized = normalizeAccount(newAcc);
      setAccounts(prev => [normalized, ...prev]);
      return normalized;
    }
  }

  async function updateAccount(id, updates) {
    const sb = getSupabaseClient();
    const dbUpdates = denormalizeAccount(updates);

    if (sb) {
      const { data, error } = await sb.from("accounts").update(dbUpdates).eq("id", id).select().single();
      if (error) throw error;
      const normalized = normalizeAccount(data);
      setAccounts(prev => prev.map(a => a.id === id ? normalized : a));
      return normalized;
    } else {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  }

  async function deleteAccount(id) {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("accounts").delete().eq("id", id);
      if (error) throw error;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  // ── CALLS & TRANSCRIPTS INGESTION ──────────────────────
  async function addCall(callData, apiKey) {
    const sb = getSupabaseClient();
    const callId = callData.id || `CALL${Date.now()}`;
    
    const newCall = {
      id: callId,
      title: callData.title || callData.type || "Call Transcript",
      transcript: callData.transcript || "",
      account_id: callData.accountId || callData.account_id || null,
      deal_id: callData.dealId || callData.deal_id || null,
    };

    if (sb) {
      await sb.from("calls").delete().eq("id", callId);

      const { data, error: callError } = await sb.from("calls").insert(newCall).select().single();
      if (callError) throw callError;

      const chunks = chunkTranscript(newCall.transcript);
      if (chunks.length > 0) {
        const chunkRows = await Promise.all(
          chunks.map(async (text) => {
            const embedding = await generateEmbedding(apiKey, text);
            return {
              call_id: callId,
              chunk_text: text,
              embedding,
            };
          })
        );
        const { error: chunkError } = await sb.from("transcript_chunks").insert(chunkRows);
        if (chunkError) {
          console.error("Failed to insert transcript chunks:", chunkError);
        }
      }

      const normalized = normalizeCall(data);
      setCalls(prev => [normalized, ...prev.filter(c => c.id !== callId)]);
      return normalized;
    } else {
      const normalized = normalizeCall(newCall);
      setCalls(prev => [normalized, ...prev.filter(c => c.id !== callId)]);
      return normalized;
    }
  }

  // ── CHAT HISTORY PERSISTENCE ───────────────────────────
  async function saveChatMessage(question, answer, citations) {
    const sb = getSupabaseClient();
    const newHistory = {
      question,
      answer,
      citations: Array.isArray(citations) ? citations : [],
    };

    if (sb) {
      const { data, error } = await sb.from("ai_chat_history").insert(newHistory).select().single();
      if (error) {
        console.error("Failed to save chat message to Supabase:", error);
      } else {
        setChatHistory(prev => [data, ...prev]);
      }
    } else {
      const offlineItem = {
        id: Date.now(),
        ...newHistory,
        created_at: new Date().toISOString()
      };
      setChatHistory(prev => [offlineItem, ...prev]);
    }
  }

  // ── DELETE CONVERSATION ────────────────────────────────
  async function deleteChatMessage(id) {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("ai_chat_history").delete().eq("id", id);
      if (error) throw error;
    }
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  }

  return {
    connected, loading, error, schemaError, refetch: fetchAll,
    deals, contacts, accounts, calls, chatHistory,
    addDeal, updateDeal, deleteDeal,
    addContact, updateContact, deleteContact,
    addAccount, updateAccount, deleteAccount,
    addCall, saveChatMessage, deleteChatMessage,
  };
}

// ── Normalizers (DB → UI) ───────────────────────────────
function normalizeDeal(d) {
  return {
    id:        d.id,
    name:      d.name,
    stage:     d.stage ?? "Qualification",
    accountId: d.account_id ?? d.accountId ?? "",
    account_id: d.account_id ?? d.accountId ?? "",
  };
}

function denormalizeDeal(u) {
  const out = {};
  if (u.name      !== undefined) out.name       = u.name;
  if (u.stage     !== undefined) out.stage      = u.stage;
  if (u.accountId !== undefined) out.account_id = u.accountId;
  if (u.account_id !== undefined) out.account_id = u.account_id;
  return out;
}

function normalizeContact(c) {
  return {
    id:        c.id,
    name:      c.name ?? "",
    email:     c.email ?? "",
    accountId: c.account_id ?? c.accountId ?? "",
    account_id: c.account_id ?? c.accountId ?? "",
  };
}

function denormalizeContact(u) {
  const out = {};
  if (u.name      !== undefined) out.name       = u.name;
  if (u.email     !== undefined) out.email      = u.email;
  if (u.accountId !== undefined) out.account_id = u.accountId;
  if (u.account_id !== undefined) out.account_id = u.account_id;
  return out;
}

function normalizeAccount(a) {
  return {
    id:   a.id,
    name: a.name ?? "",
  };
}

function denormalizeAccount(u) {
  const out = {};
  if (u.name !== undefined) out.name = u.name;
  return out;
}

function normalizeCall(c) {
  return {
    id:         c.id,
    title:      c.title ?? c.type ?? "Discovery Call",
    transcript: c.transcript ?? "",
    accountId:  c.account_id ?? c.accountId ?? "",
    account_id: c.account_id ?? c.accountId ?? "",
    dealId:     c.deal_id ?? c.dealId ?? "",
    deal_id:    c.deal_id ?? c.dealId ?? "",
    created_at: c.created_at ?? "",
  };
}

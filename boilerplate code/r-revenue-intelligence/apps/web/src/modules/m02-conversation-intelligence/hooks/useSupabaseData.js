import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "../lib/supabase";
import {
  DEALS as MOCK_DEALS,
  CONTACTS as MOCK_CONTACTS,
  ACCOUNTS as MOCK_ACCOUNTS,
  TASKS as MOCK_TASKS,
  CALLS as MOCK_CALLS,
  ACTIVITIES as MOCK_ACTIVITIES,
  REPS as MOCK_REPS,
  METRICS as MOCK_METRICS,
} from "../data/crm";

// ── Module-level helpers ────────────────────────────────
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

/*
  useSupabaseData — central data hook.
  Falls back to mock data if Supabase is not configured.
  All CRUD operations mirror to Supabase when connected.
*/
export default function useSupabaseData(enabled = true) {
  const [connected, setConnected]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  // true when Supabase is reachable but tables haven't been created yet
  const [schemaError, setSchemaError] = useState(false);

  const [deals, setDeals]             = useState(MOCK_DEALS);
  const [contacts, setContacts]       = useState(MOCK_CONTACTS);
  const [accounts, setAccounts]       = useState(MOCK_ACCOUNTS);
  const [tasks, setTasks]             = useState(MOCK_TASKS);
  const [calls, setCalls]             = useState(MOCK_CALLS);
  const [activities, setActivities]   = useState(MOCK_ACTIVITIES);
  const [reps, setReps]               = useState(MOCK_REPS);
  const [metrics, setMetrics]         = useState(MOCK_METRICS);

  // Detect "table not found / schema cache" errors from Supabase/PostgREST
  // (isSchemaMissing is now module-level)
  // (safeFetch is now module-level)

  // ── fetch all tables ──────────────────────────────────
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
      const [dealsData, contactsData, accountsData, tasksData, callsData, activitiesData, repsData] =
        await Promise.all([
          safeFetch(sb.from("deals").select("*").order("created_at", { ascending: false }), markSchema),
          safeFetch(sb.from("contacts").select("*").order("name"), markSchema),
          safeFetch(sb.from("accounts").select("*").order("name"), markSchema),
          safeFetch(sb.from("tasks").select("*").order("due"), markSchema),
          safeFetch(sb.from("calls").select("*").order("date", { ascending: false }), markSchema),
          safeFetch(sb.from("activities").select("*").order("created_at", { ascending: false }), markSchema),
          safeFetch(sb.from("reps").select("*").order("name"), markSchema),
        ]);

      // Mark as connected if Supabase replied (even if tables are empty)
      setConnected(true);

      // Only replace mock data when the table actually returned rows
      if (dealsData.length)      setDeals(dealsData.map(normalizeDeal));
      if (contactsData.length)   setContacts(contactsData.map(normalizeContact));
      if (accountsData.length)   setAccounts(accountsData.map(normalizeAccount));
      if (tasksData.length)      setTasks(tasksData.map(normalizeTask));
      if (callsData.length)      setCalls(callsData.map(normalizeCall));
      if (activitiesData.length) setActivities(activitiesData.map(normalizeActivity));
      if (repsData.length)       setReps(repsData.map(normalizeRep));

      if (dealsData.length) {
        recalcMetrics(dealsData.map(normalizeDeal), tasksData.map(normalizeTask));
      }
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

  useEffect(() => { 
    if (enabled) fetchAll(); 
  }, [fetchAll, enabled]);

  // ── metrics recalc from live deals ────────────────────
  function recalcMetrics(liveDeals, liveTasks) {
    const open = liveDeals.filter(d => !d.stage?.startsWith("Closed"));
    const won  = liveDeals.filter(d => d.stage === "Closed Won");
    const lost = liveDeals.filter(d => d.stage === "Closed Lost");
    const total = won.length + lost.length;
    const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0;
    const totalPipeline = open.reduce((s, d) => s + (d.value || 0), 0);
    const closedWon = won.reduce((s, d) => s + (d.value || 0), 0);
    const avgDealSize = liveDeals.length > 0 ? Math.round(totalPipeline / open.length) || 0 : 0;

    setMetrics(prev => ({
      ...prev,
      totalPipeline,
      closedWon,
      winRate,
      avgDealSize,
    }));
  }

  // ── DEALS CRUD ─────────────────────────────────────────
  async function addDeal(dealData) {
    const sb = getSupabaseClient();
    const newDeal = {
      id: `D${Date.now()}`,
      name: `${dealData.company} — ${dealData.name || "New Deal"}`,
      stage: dealData.stage || "Qualification",
      value: parseInt(dealData.value, 10) || 0,
      probability: dealData.probability ?? 50,
      owner: dealData.owner || "Unassigned",
      days_in_stage: 0,
      close_date: dealData.closeDate || new Date().toISOString().split("T")[0],
      company: dealData.company,
      contact: dealData.contact || "",
      account_id: dealData.accountId || `A${Date.now()}`,
      notes: dealData.notes || "Newly created deal.",
      activities: dealData.activities || [],
      tags: dealData.tags || [],
      score: dealData.score ?? 50,
      trend: dealData.trend || "stable",
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
      id: `C${Date.now()}`,
      name: contactData.name,
      title: contactData.title || "",
      company: contactData.company || "",
      account_id: contactData.accountId || "",
      email: contactData.email || "",
      phone: contactData.phone || "",
      deal_id: contactData.dealId || "",
      last_contact: contactData.lastContact || new Date().toISOString().split("T")[0],
      sentiment: contactData.sentiment || "Neutral",
      notes: contactData.notes || "",
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

  // ── TASKS CRUD ─────────────────────────────────────────
  async function addTask(taskData) {
    const sb = getSupabaseClient();
    const newTask = {
      id: `T${Date.now()}`,
      title: taskData.title,
      deal_id: taskData.dealId || "",
      assignee: taskData.assignee || "Unassigned",
      due: taskData.due || new Date().toISOString().split("T")[0],
      priority: taskData.priority || "Medium",
      done: false,
      type: taskData.type || "Email",
    };

    if (sb) {
      const { data, error } = await sb.from("tasks").insert(newTask).select().single();
      if (error) throw error;
      const normalized = normalizeTask(data);
      setTasks(prev => [normalized, ...prev]);
      return normalized;
    } else {
      const normalized = normalizeTask(newTask);
      setTasks(prev => [normalized, ...prev]);
      return normalized;
    }
  }

  async function toggleTask(id) {
    const sb = getSupabaseClient();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;

    if (sb) {
      const { error } = await sb.from("tasks").update({ done: newDone }).eq("id", id);
      if (error) throw error;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
  }

  async function deleteTask(id) {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("tasks").delete().eq("id", id);
      if (error) throw error;
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // ── CALLS CRUD ─────────────────────────────────────────
  async function addCall(callData) {
    const sb = getSupabaseClient();
    const newCall = {
      id: `CALL${Date.now()}`,
      deal: callData.dealId || null,
      type: callData.type || "Discovery Call",
      date: new Date().toISOString().split("T")[0],
      duration: callData.duration || "N/A",
      rep: callData.rep || "Current User",
      sentiment: callData.sentiment || "Neutral",
      outcome: callData.outcome || "Analyzed",
      summary: callData.summary || "",
      key_moments: callData.keyMoments || [],
      objections: callData.objections || [],
      next_steps: callData.nextSteps || [],
      // Expanded intel fields
      risks: callData.risks || [],
      pain_points: callData.painPoints || [],
      competitors: callData.competitors || [],
      key_insights: callData.keyInsights || [],
      deal_value: callData.dealValue || null,
      timeline: callData.timeline || null,
      client_name: callData.clientName || null,
      decision_maker: callData.decisionMaker || null,
      deal_score: callData.dealScore || 50,
      transcript: callData.transcript || []
    };

    if (sb) {
      const { data, error } = await sb.from("calls").insert(newCall).select().single();
      if (error) throw error;
      const normalized = normalizeCall(data);
      setCalls(prev => [normalized, ...prev]);
      return normalized;
    } else {
      const normalized = normalizeCall(newCall);
      setCalls(prev => [normalized, ...prev]);
      return normalized;
    }
  }

  // ── ACCOUNTS CRUD ──────────────────────────────────────
  async function addAccount(accData) {
    const sb = getSupabaseClient();
    const newAcc = {
      id: `A${Date.now()}`,
      name: accData.name,
      industry: accData.industry || "",
      size: accData.size || "SMB",
      employees: parseInt(accData.employees, 10) || 0,
      arr: parseInt(accData.arr, 10) || 0,
      health_score: parseInt(accData.healthScore, 10) || 50,
      website: accData.website || "",
      location: accData.location || "",
      since: accData.since || new Date().toISOString().slice(0, 7),
      contacts: accData.contacts || [],
      deals: accData.deals || [],
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

  return {
    // state
    connected, loading, error, schemaError, refetch: fetchAll,
    // data
    deals, contacts, accounts, tasks, calls, activities, reps, metrics,
    // deal ops
    addDeal, updateDeal, deleteDeal,
    // contact ops
    addContact, updateContact, deleteContact,
    // task ops
    addTask, toggleTask, deleteTask,
    // call ops
    addCall,
    // account ops
    addAccount, updateAccount, deleteAccount,
  };
}

// ── Normalizers (DB → UI) ───────────────────────────────
function normalizeDeal(d) {
  return {
    id:          d.id,
    name:        d.name,
    stage:       d.stage,
    value:       d.value ?? 0,
    probability: d.probability ?? 50,
    owner:       d.owner ?? "",
    daysInStage: d.days_in_stage ?? d.daysInStage ?? 0,
    closeDate:   d.close_date ?? d.closeDate ?? "",
    company:     d.company ?? "",
    contact:     d.contact ?? "",
    accountId:   d.account_id ?? d.accountId ?? "",
    notes:       d.notes ?? "",
    activities:  Array.isArray(d.activities) ? d.activities : [],
    tags:        Array.isArray(d.tags) ? d.tags : [],
    score:       d.score ?? 50,
    trend:       d.trend ?? "stable",
  };
}

function denormalizeDeal(u) {
  const out = {};
  if (u.name        !== undefined) out.name         = u.name;
  if (u.stage       !== undefined) out.stage        = u.stage;
  if (u.value       !== undefined) out.value        = u.value;
  if (u.probability !== undefined) out.probability  = u.probability;
  if (u.owner       !== undefined) out.owner        = u.owner;
  if (u.daysInStage !== undefined) out.days_in_stage = u.daysInStage;
  if (u.closeDate   !== undefined) out.close_date   = u.closeDate;
  if (u.company     !== undefined) out.company      = u.company;
  if (u.contact     !== undefined) out.contact      = u.contact;
  if (u.accountId   !== undefined) out.account_id   = u.accountId;
  if (u.notes       !== undefined) out.notes        = u.notes;
  if (u.activities  !== undefined) out.activities   = u.activities;
  if (u.tags        !== undefined) out.tags         = u.tags;
  if (u.score       !== undefined) out.score        = u.score;
  if (u.trend       !== undefined) out.trend        = u.trend;
  return out;
}

function normalizeContact(c) {
  return {
    id:          c.id,
    name:        c.name ?? "",
    title:       c.title ?? "",
    company:     c.company ?? "",
    accountId:   c.account_id ?? c.accountId ?? "",
    email:       c.email ?? "",
    phone:       c.phone ?? "",
    dealId:      c.deal_id ?? c.dealId ?? "",
    lastContact: c.last_contact ?? c.lastContact ?? "",
    sentiment:   c.sentiment ?? "Neutral",
    notes:       c.notes ?? "",
  };
}

function denormalizeContact(u) {
  const out = {};
  if (u.name        !== undefined) out.name         = u.name;
  if (u.title       !== undefined) out.title        = u.title;
  if (u.company     !== undefined) out.company      = u.company;
  if (u.accountId   !== undefined) out.account_id   = u.accountId;
  if (u.email       !== undefined) out.email        = u.email;
  if (u.phone       !== undefined) out.phone        = u.phone;
  if (u.dealId      !== undefined) out.deal_id      = u.dealId;
  if (u.lastContact !== undefined) out.last_contact = u.lastContact;
  if (u.sentiment   !== undefined) out.sentiment    = u.sentiment;
  if (u.notes       !== undefined) out.notes        = u.notes;
  return out;
}

function normalizeAccount(a) {
  return {
    id:          a.id,
    name:        a.name ?? "",
    industry:    a.industry ?? "",
    size:        a.size ?? "SMB",
    employees:   a.employees ?? 0,
    arr:         a.arr ?? 0,
    healthScore: a.health_score ?? a.healthScore ?? 50,
    website:     a.website ?? "",
    location:    a.location ?? "",
    since:       a.since ?? "",
    contacts:    Array.isArray(a.contacts) ? a.contacts : [],
    deals:       Array.isArray(a.deals) ? a.deals : [],
  };
}

function denormalizeAccount(u) {
  const out = {};
  if (u.name        !== undefined) out.name         = u.name;
  if (u.industry    !== undefined) out.industry     = u.industry;
  if (u.size        !== undefined) out.size         = u.size;
  if (u.employees   !== undefined) out.employees    = u.employees;
  if (u.arr         !== undefined) out.arr          = u.arr;
  if (u.healthScore !== undefined) out.health_score = u.healthScore;
  if (u.website     !== undefined) out.website      = u.website;
  if (u.location    !== undefined) out.location     = u.location;
  if (u.since       !== undefined) out.since        = u.since;
  if (u.contacts    !== undefined) out.contacts     = u.contacts;
  if (u.deals       !== undefined) out.deals        = u.deals;
  return out;
}

function normalizeTask(t) {
  return {
    id:       t.id,
    title:    t.title ?? "",
    dealId:   t.deal_id ?? t.dealId ?? "",
    assignee: t.assignee ?? "",
    due:      t.due ?? "",
    priority: t.priority ?? "Medium",
    done:     t.done ?? false,
    type:     t.type ?? "Email",
  };
}

function normalizeCall(c) {
  return {
    id:         c.id,
    deal:       c.deal ?? c.deal_id ?? "",
    type:       c.type ?? "",
    date:       c.date ?? "",
    duration:   c.duration ?? "",
    rep:        c.rep ?? "",
    sentiment:  c.sentiment ?? "Neutral",
    outcome:    c.outcome ?? "",
    summary:    c.summary ?? "",
    keyMoments: Array.isArray(c.key_moments ?? c.keyMoments) ? (c.key_moments ?? c.keyMoments) : [],
    objections: Array.isArray(c.objections) ? c.objections : [],
    nextSteps:  Array.isArray(c.next_steps ?? c.nextSteps) ? (c.next_steps ?? c.nextSteps) : [],
    // Intelligence fields
    risks:      Array.isArray(c.risks) ? c.risks : [],
    painPoints: Array.isArray(c.pain_points ?? c.painPoints) ? (c.pain_points ?? c.painPoints) : [],
    competitors: Array.isArray(c.competitors) ? c.competitors : [],
    keyInsights: Array.isArray(c.key_insights ?? c.keyInsights) ? (c.key_insights ?? c.keyInsights) : [],
    dealValue:   c.deal_value ?? c.dealValue ?? null,
    timeline:    c.timeline ?? null,
    clientName:  c.client_name ?? c.clientName ?? null,
    decisionMaker: c.decision_maker ?? c.decisionMaker ?? null,
    dealScore:   c.deal_score ?? c.dealScore ?? 50,
    transcript:  Array.isArray(c.transcript) ? c.transcript : [],
  };
}

function normalizeActivity(a) {
  return {
    id:     a.id,
    type:   a.type ?? "call",
    text:   a.text ?? "",
    rep:    a.rep ?? "",
    time:   a.time ?? "",
    deal:   a.deal ?? "",
  };
}

function normalizeRep(r) {
  return {
    name:    r.name ?? "",
    avatar:  r.avatar ?? r.name?.[0] ?? "?",
    deals:   r.deals ?? 0,
    pipeline: r.pipeline ?? 0,
    closed:  r.closed ?? 0,
    quota:   r.quota ?? 0,
    winRate: r.win_rate ?? r.winRate ?? 0,
    avgCycle: r.avg_cycle ?? r.avgCycle ?? 0,
    calls:   r.calls ?? 0,
  };
}

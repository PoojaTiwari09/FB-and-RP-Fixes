import { useState, useEffect, useCallback } from "react";
import {
  fetchWorkspace,
  fetchChatHistory,
  saveChatMessage as apiSaveChat,
  deleteChatMessage as apiDeleteChat,
} from "../api/m03Api";
import {
  DEALS as MOCK_DEALS,
  CONTACTS as MOCK_CONTACTS,
  ACCOUNTS as MOCK_ACCOUNTS,
  CALLS as MOCK_CALLS,
} from "../data/crm";

/** Workspace data via NestJS — replaces direct Supabase access. */
export default function useM03Workspace() {
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deals, setDeals] = useState(MOCK_DEALS);
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [calls, setCalls] = useState(MOCK_CALLS);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ws, chat] = await Promise.all([
        fetchWorkspace(),
        fetchChatHistory().catch(() => []),
      ]);
      if (ws.deals?.length) setDeals(ws.deals);
      if (ws.contacts?.length) setContacts(ws.contacts);
      if (ws.accounts?.length) setAccounts(ws.accounts);
      if (ws.calls?.length) setCalls(ws.calls);
      setChatHistory(Array.isArray(chat) ? chat : []);
      setConnected(true);
    } catch (e) {
      console.error("M03 workspace fetch error:", e);
      setError(e.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function addDeal(dealData) {
    const normalized = {
      id: dealData.id || `D${Date.now()}`,
      name: dealData.name,
      stage: dealData.stage || "Qualification",
      accountId: dealData.accountId || dealData.account_id || "",
    };
    setDeals((prev) => [normalized, ...prev]);
    return normalized;
  }

  async function updateDeal(id, updates) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }

  async function deleteDeal(id) {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  async function addContact(contactData) {
    const normalized = {
      id: contactData.id || `C${Date.now()}`,
      name: contactData.name,
      email: contactData.email || "",
      accountId: contactData.accountId || contactData.account_id || "",
    };
    setContacts((prev) => [normalized, ...prev]);
    return normalized;
  }

  async function updateContact(id, updates) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  async function deleteContact(id) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function addAccount(accData) {
    const normalized = { id: accData.id || `A${Date.now()}`, name: accData.name };
    setAccounts((prev) => [normalized, ...prev]);
    return normalized;
  }

  async function updateAccount(id, updates) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }

  async function deleteAccount(id) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function addCall(callData) {
    const callId = callData.id || `CALL${Date.now()}`;
    const normalized = {
      id: callId,
      title: callData.title || callData.type || "Call Transcript",
      transcript: callData.transcript || "",
      accountId: callData.accountId || callData.account_id || "",
      dealId: callData.dealId || callData.deal_id || "",
      created_at: new Date().toISOString(),
    };
    setCalls((prev) => [normalized, ...prev.filter((c) => c.id !== callId)]);
    return normalized;
  }

  async function saveChatMessage(question, answer, citations) {
    try {
      const saved = await apiSaveChat(question, answer, citations);
      setChatHistory((prev) => [saved, ...prev]);
    } catch (e) {
      const offline = {
        id: Date.now(),
        question,
        answer,
        citations: citations || [],
        created_at: new Date().toISOString(),
      };
      setChatHistory((prev) => [offline, ...prev]);
    }
  }

  async function deleteChatMessage(id) {
    await apiDeleteChat(id).catch(() => {});
    setChatHistory((prev) => prev.filter((c) => c.id !== id));
  }

  return {
    connected,
    loading,
    error,
    schemaError: false,
    refetch: fetchAll,
    deals,
    contacts,
    accounts,
    calls,
    chatHistory,
    addDeal,
    updateDeal,
    deleteDeal,
    addContact,
    updateContact,
    deleteContact,
    addAccount,
    updateAccount,
    deleteAccount,
    addCall,
    saveChatMessage,
    deleteChatMessage,
  };
}

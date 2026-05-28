/**
 * Live Assist CRM state — mock data + local updates (no Supabase; Nest/Prisma for library UI).
 */
import { useState, useCallback } from "react";
import {
  DEALS as MOCK_DEALS,
  CONTACTS as MOCK_CONTACTS,
  ACCOUNTS as MOCK_ACCOUNTS,
  TASKS as MOCK_TASKS,
  CALLS as MOCK_CALLS,
  ACTIVITIES as MOCK_ACTIVITIES,
  REPS as MOCK_REPS,
  METRICS as MOCK_METRICS,
} from "../../../../../../modules/m02-conversation-intelligence/live-assist-core/data/crm";

export default function useM02CrmData(_enabled = true) {
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [calls, setCalls] = useState(MOCK_CALLS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [reps, setReps] = useState(MOCK_REPS);
  const [metrics, setMetrics] = useState(MOCK_METRICS);

  const refetch = useCallback(async () => {}, []);

  const addDeal = async (dealData) => {
    const newDeal = {
      id: `D${Date.now()}`,
      name: `${dealData.company} — ${dealData.name || "New Deal"}`,
      stage: dealData.stage || "Qualification",
      value: parseInt(dealData.value, 10) || 0,
      company: dealData.company,
    };
    setDeals((prev) => [newDeal, ...prev]);
    return newDeal;
  };

  const updateDeal = async (id, updates) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDeal = async (id) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const addContact = async (data) => {
    const row = { id: `C${Date.now()}`, ...data };
    setContacts((prev) => [row, ...prev]);
    return row;
  };

  const updateContact = async (id, updates) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteContact = async (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const addTask = async (data) => {
    const row = { id: `T${Date.now()}`, done: false, ...data };
    setTasks((prev) => [row, ...prev]);
    return row;
  };

  const toggleTask = async (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addCall = async (data) => {
    const row = { id: `CALL${Date.now()}`, ...data };
    setCalls((prev) => [row, ...prev]);
    return row;
  };

  const addAccount = async (data) => {
    const row = { id: `A${Date.now()}`, ...data };
    setAccounts((prev) => [row, ...prev]);
    return row;
  };

  const updateAccount = async (id, updates) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAccount = async (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    connected: false,
    loading: false,
    error: null,
    schemaError: false,
    refetch,
    deals,
    contacts,
    accounts,
    tasks,
    calls,
    activities,
    reps,
    metrics,
    addDeal,
    updateDeal,
    deleteDeal,
    addContact,
    updateContact,
    deleteContact,
    addTask,
    toggleTask,
    deleteTask,
    addCall,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}

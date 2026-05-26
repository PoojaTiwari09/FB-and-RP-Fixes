import React, { useState, useEffect } from "react";
import useSupabaseData from "../hooks/useSupabaseData";
import AskAnythingSidebar from "../components/ask-anything/AskAnythingSidebar";
import ChatPanel from "../components/ask-anything/ChatPanel";
import ApiKeyModal from "../components/ask-anything/ApiKeyModal";
import SupabaseModal from "../components/ask-anything/SupabaseModal";
import styles from "./AskAnythingPage.module.css";

export default function AskAnythingPage() {
  const [apiKey, setApiKey]                 = useState("");
  const [showApiModal, setShowApiModal]     = useState(false);
  const [showSbModal, setShowSbModal]       = useState(false);
  const currentUser                         = "admin";

  // Scoped context states for RAG vector search
  const [activeDeal, setActiveDeal]         = useState(null);
  const [activeAccount, setActiveAccount]   = useState(null);
  const [activeChat, setActiveChat]         = useState(null);
  const [activeChatId, setActiveChatId]     = useState(null);
  const [chatSessionId, setChatSessionId]   = useState("");

  // Supabase data hook
  const db = useSupabaseData();

  // Load API key and initialize chat session ID on mount
  useEffect(() => {
    const key = localStorage.getItem("gemini_key") || "";
    setApiKey(key);
    setChatSessionId(Date.now().toString());
    if (!key) {
      setShowApiModal(true);
    }
  }, []);

  function saveKey(k) {
    localStorage.setItem("gemini_key", k);
    setApiKey(k);
  }

  // ── Scoped Context Toggles ─────────────────────────────
  function handleDealSelect(deal) {
    if (activeDeal?.id === deal.id) {
      setActiveDeal(null);
      setActiveAccount(null);
    } else {
      setActiveDeal(deal);
      const matchingAccount = db.accounts.find(a => a.id === deal.account_id || a.id === deal.accountId);
      setActiveAccount(matchingAccount || null);
      setActiveChat(null);
      setActiveChatId(null);
    }
  }

  function handleAccountSelect(acc) {
    if (activeAccount?.id === acc.id) {
      setActiveAccount(null);
      setActiveDeal(null);
    } else {
      setActiveAccount(acc);
      setActiveDeal(null);
      setActiveChat(null);
      setActiveChatId(null);
    }
  }

  function handleChatSelect(chat) {
    setActiveChat(chat);
    setActiveChatId(chat.id);
    setActiveDeal(null);
    setActiveAccount(null);
    setChatSessionId(chat.id.toString());
  }

  function handleClearContext() {
    setActiveDeal(null);
    setActiveAccount(null);
  }

  function handleNewChat() {
    setActiveChat(null);
    setActiveChatId(null);
    setActiveDeal(null);
    setActiveAccount(null);
    setChatSessionId(Date.now().toString());
  }

  function handleSbSave() {
    db.refetch();
  }

  return (
    <div className={styles.askApp}>
      <AskAnythingSidebar
        deals={db.deals}
        accounts={db.accounts}
        chatHistory={db.chatHistory}
        activeDeal={activeDeal}
        activeAccount={activeAccount}
        activeChatId={activeChatId}
        onDealSelect={handleDealSelect}
        onAccountSelect={handleAccountSelect}
        onChatSelect={handleChatSelect}
        onClearContext={handleClearContext}
        onDeleteChat={db.deleteChatMessage}
        onNewChat={handleNewChat}
      />

      <div className={styles.askMain}>
        {/* Topbar */}
        <div className={styles.askTopbar}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadHome}>SalesIQ</span>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>AI Assistant</span>
          </div>

          <div className={styles.topbarActions}>
            {/* Supabase status indicator */}
            <div
              className={styles.apiStatus}
              style={{ marginRight: 8 }}
              onClick={() => setShowSbModal(true)}
              title="Configure Supabase"
            >
              <span
                className={`${styles.apiDot} ${db.connected ? styles.apiConnected : db.schemaError ? styles.apiWarning : styles.apiDisconnected}`}
              />
              <span>{db.connected ? "Supabase Live" : db.schemaError ? "Schema Needed" : "Demo Data"}</span>
              <span className={styles.apiEdit}>⚙</span>
            </div>

            {/* AI Key connection status */}
            <div className={styles.apiStatus} onClick={() => setShowApiModal(true)}>
              <span className={`${styles.apiDot} ${apiKey ? styles.apiConnected : styles.apiDisconnected}`} />
              <span>{apiKey ? "Groq Live" : "No API Key"}</span>
              <span className={styles.apiEdit}>⚙</span>
            </div>
          </div>
        </div>

        {/* Loading overlay banner */}
        {db.loading && (
          <div className={styles.loadingBanner}>
            <span className={styles.loadingDot} />
            Syncing data with Supabase…
          </div>
        )}

        {/* Setup instruction banner for missing tables */}
        {db.schemaError && !db.loading && (
          <div className={styles.schemaBanner}>
            <span className={styles.schemaIcon}>⚠</span>
            <div className={styles.schemaText}>
              <strong>Database tables not found.</strong>
              {" "}Open the Supabase modal, copy the SQL schema, and run it in your{" "}
              <strong>Supabase SQL Editor</strong> — then click Reconnect.
            </div>
            <div className={styles.schemaBtns}>
              <button className={styles.schemaBtn} onClick={() => setShowSbModal(true)}>Open Setup</button>
              <button className={styles.schemaReconnect} onClick={() => db.refetch()}>Reconnect</button>
            </div>
          </div>
        )}

        {/* Primary AI Chat Panel */}
        <div className={styles.askContent}>
          <ChatPanel
            key={`${chatSessionId}-${currentUser}`}
            apiKey={apiKey}
            currentUser={currentUser}
            activeDeal={activeDeal}
            activeAccount={activeAccount}
            activeChat={activeChat}
            calls={db.calls}
            deals={db.deals}
            accounts={db.accounts}
            contacts={db.contacts}
            onSaveChatMessage={db.saveChatMessage}
            onNewChat={handleNewChat}
          />
        </div>
      </div>

      {showApiModal && (
        <ApiKeyModal current={apiKey} onSave={saveKey} onClose={() => setShowApiModal(false)} />
      )}
      {showSbModal && (
        <SupabaseModal
          connected={db.connected}
          onSave={handleSbSave}
          onClose={() => setShowSbModal(false)}
        />
      )}
    </div>
  );
}

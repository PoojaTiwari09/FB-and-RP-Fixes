import React, { useState, useEffect } from "react";
import useM03Workspace from "../hooks/useM03Workspace";
import AskAnythingSidebar from "../components/ask-anything/AskAnythingSidebar";
import ChatPanel from "../components/ask-anything/ChatPanel";
import styles from "./AskAnythingPage.module.css";

export default function AskAnythingPage() {
  const currentUser                         = "admin";

  // Scoped context states for RAG vector search
  const [activeDeal, setActiveDeal]         = useState(null);
  const [activeAccount, setActiveAccount]   = useState(null);
  const [activeChat, setActiveChat]         = useState(null);
  const [activeChatId, setActiveChatId]     = useState(null);
  const [chatSessionId, setChatSessionId]   = useState("");

  // Supabase data hook
  const db = useM03Workspace();

  useEffect(() => {
    setChatSessionId(Date.now().toString());
  }, []);

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
            <div className={styles.apiStatus} style={{ marginRight: 8 }} title="NestJS API">
              <span className={`${styles.apiDot} ${db.connected ? styles.apiConnected : styles.apiDisconnected}`} />
              <span>{db.connected ? "API Connected" : "API Offline"}</span>
            </div>
          </div>
        </div>

        {/* Loading overlay banner */}
        {db.loading && (
          <div className={styles.loadingBanner}>
            <span className={styles.loadingDot} />
            Loading workspace data…
          </div>
        )}

        {/* Primary AI Chat Panel */}
        <div className={styles.askContent}>
          <ChatPanel
            key={`${chatSessionId}-${currentUser}`}
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

    </div>
  );
}

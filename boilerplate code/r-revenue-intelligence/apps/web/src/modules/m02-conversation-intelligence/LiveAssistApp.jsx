import { useState, useEffect } from "react";
import useSupabaseData from "./hooks/useSupabaseData";
import Sidebar from "./components/Sidebar";
import ApiKeyModal from "./components/ApiKeyModal";
import SupabaseModal from "./components/SupabaseModal";
import LiveAssistView from "./components/LiveAssistView";
import styles from "./App.module.css";

const VIEW_LABELS = {
  liveAssist: "Live Assist",
};

export default function App() {
  const [view, setView] = useState("liveAssist");
  const [theme, setTheme] = useState(() => localStorage.getItem("app_theme") || "dark");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_key") || "");
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem("openrouter_key") || "");
  const [showModal, setShowModal] = useState(false);
  const [showSbModal, setShowSbModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Supabase / data layer ─────────────────────────────
  const db = useSupabaseData(true);

  useEffect(() => {
    if (!apiKey) setShowModal(true);
  }, [apiKey]);

  function saveKey({ groq, openrouter }) { 
    if (groq !== undefined) {
      localStorage.setItem("gemini_key", groq); 
      setApiKey(groq); 
    }
    if (openrouter !== undefined) {
      localStorage.setItem("openrouter_key", openrouter); 
      setOpenRouterKey(openrouter); 
    }
  }

  function handleSbSave() { db.refetch(); }

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
  }

  return (
    <div className={styles.app} data-theme={theme}>
      {!sidebarCollapsed && (
        <Sidebar
          activeView={view}
          onViewChange={setView}
        />
      )}

      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <button className={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Toggle Sidebar">
            {sidebarCollapsed ? "☰" : "⋮"}
          </button>
          <button 
            className={styles.themeToggle} 
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className={styles.breadcrumb}>
            <span className={styles.breadHome} style={{cursor:'default'}}>DealsIQX</span>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>{VIEW_LABELS[view]}</span>
          </div>
          <div className={styles.topbarActions}>
            {/* Supabase status */}
            <div
              className={styles.apiStatus}
              style={{ marginRight: 8 }}
              onClick={() => setShowSbModal(true)}
              title="Configure Supabase"
            >
              <span
                className={`${styles.apiDot} ${db.connected ? styles.apiConnected : db.schemaError ? styles.apiWarning : styles.apiDisconnected}`}
              />
              <span>{db.connected ? "Supabase live" : db.schemaError ? "Schema needed" : "Demo data"}</span>
              <span className={styles.apiEdit}>⚙</span>
            </div>

            {/* Groq status */}
            <div className={styles.apiStatus} onClick={() => setShowModal(true)}>
              <span className={`${styles.apiDot} ${apiKey ? styles.apiConnected : styles.apiDisconnected}`} />
              <span>{apiKey ? "Groq connected" : "No API key"}</span>
              <span className={styles.apiEdit}>⚙</span>
            </div>
          </div>
        </div>

        {/* Loading banner */}
        {db.loading && (
          <div className={styles.loadingBanner}>
            <span className={styles.loadingDot} />
            Syncing with Supabase…
          </div>
        )}

        {/* Schema setup banner */}
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

        {/* Views */}
        <div className={styles.content}>
          {view === "liveAssist" && <LiveAssistView apiKey={apiKey} openRouterKey={openRouterKey} deals={db.deals} isWideMode={sidebarCollapsed} />}
        </div>
      </div>

      {showModal && (
        <ApiKeyModal currentGroq={apiKey} currentOpenRouter={openRouterKey} onSave={saveKey} onClose={() => setShowModal(false)} />
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


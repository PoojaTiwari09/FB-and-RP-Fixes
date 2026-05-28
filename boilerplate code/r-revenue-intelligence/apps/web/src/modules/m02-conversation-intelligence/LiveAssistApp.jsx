import { useState, useEffect } from "react";
import useM02CrmData from "./hooks/useM02CrmData";
import Sidebar from "./components/Sidebar";
import ApiKeyModal from "./components/ApiKeyModal";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const db = useM02CrmData(true);

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

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
  }

  return (
    <div className={styles.app} data-theme={theme}>
      {!sidebarCollapsed && (
        <Sidebar activeView={view} onViewChange={setView} />
      )}

      <div className={styles.main}>
        <div className={styles.topbar}>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle Sidebar"
          >
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
            <span className={styles.breadHome} style={{ cursor: "default" }}>
              DealsIQX
            </span>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>{VIEW_LABELS[view]}</span>
          </div>
          <div className={styles.topbarActions}>
            <div className={styles.apiStatus} style={{ marginRight: 8 }} title="CRM via NestJS/Postgres">
              <span className={`${styles.apiDot} ${styles.apiDisconnected}`} />
              <span>Demo CRM (local)</span>
            </div>

            <div className={styles.apiStatus} onClick={() => setShowModal(true)}>
              <span className={`${styles.apiDot} ${apiKey ? styles.apiConnected : styles.apiDisconnected}`} />
              <span>{apiKey ? "Groq connected" : "No API key"}</span>
              <span className={styles.apiEdit}>⚙</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {view === "liveAssist" && (
            <LiveAssistView
              apiKey={apiKey}
              openRouterKey={openRouterKey}
              deals={db.deals}
              isWideMode={sidebarCollapsed}
            />
          )}
        </div>
      </div>

      {showModal && (
        <ApiKeyModal
          currentGroq={apiKey}
          currentOpenRouter={openRouterKey}
          onSave={saveKey}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

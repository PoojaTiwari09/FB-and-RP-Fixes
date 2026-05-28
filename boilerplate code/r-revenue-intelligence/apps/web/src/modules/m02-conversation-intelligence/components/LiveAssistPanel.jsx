/**
 * Live Assist — embedded in Conversation Library (rev-portal shell).
 * Wraps the full LiveAssistView + CRM mock data + API key modal from LiveAssistApp.
 */
import { useState, useEffect } from "react";
import useM02CrmData from "../hooks/useM02CrmData";
import LiveAssistView from "./LiveAssistView";
import ApiKeyModal from "./ApiKeyModal";

function readEnvKey(name) {
  if (typeof import.meta !== "undefined" && import.meta.env?.[name]) {
    return String(import.meta.env[name]);
  }
  return "";
}

export default function LiveAssistPanel() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("gemini_key") || readEnvKey("VITE_GROQ_API_KEY") || "",
  );
  const [openRouterKey, setOpenRouterKey] = useState(
    () => localStorage.getItem("openrouter_key") || readEnvKey("VITE_OPENROUTER_API_KEY") || "",
  );
  const [showModal, setShowModal] = useState(false);

  const db = useM02CrmData(true);

  useEffect(() => {
    const envGroq = readEnvKey("VITE_GROQ_API_KEY");
    const envOpenRouter = readEnvKey("VITE_OPENROUTER_API_KEY");
    if (envGroq && !localStorage.getItem("gemini_key")) {
      localStorage.setItem("gemini_key", envGroq);
      setApiKey(envGroq);
    }
    if (envOpenRouter && !localStorage.getItem("openrouter_key")) {
      localStorage.setItem("openrouter_key", envOpenRouter);
      setOpenRouterKey(envOpenRouter);
    }
  }, []);

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

  return (
    <div className="rev-live-assist-root">
      <div className="rev-live-assist-toolbar">
        <div className="rev-live-assist-toolbar-left">
          <span className="rev-live-assist-live-dot" />
          <span className="rev-live-assist-toolbar-title">Real-time call coaching</span>
          <span className="rev-live-assist-toolbar-hint">
            Screen share + live transcription, AI suggestions, competitor alerts, PiP overlay
          </span>
        </div>
        <div className="rev-live-assist-toolbar-actions">
          <div
            className={`rev-live-assist-api-pill ${apiKey ? "connected" : "disconnected"}`}
            title="Groq: Whisper transcription + fast LLM"
          >
            <span className="rev-live-assist-api-dot" />
            {apiKey ? "Groq" : "Groq missing"}
          </div>
          <div
            className={`rev-live-assist-api-pill ${openRouterKey ? "connected" : "disconnected"}`}
            title="OpenRouter: reasoning models (DeepSeek R1, Claude, etc.)"
          >
            <span className="rev-live-assist-api-dot" />
            {openRouterKey ? "OpenRouter" : "OpenRouter optional"}
          </div>
          <button
            type="button"
            className="rev-btn-secondary"
            onClick={() => setShowModal(true)}
            style={{ fontSize: "11px", padding: "6px 12px" }}
          >
            API keys
          </button>
        </div>
      </div>

      <div className="rev-live-assist-body">
        <LiveAssistView
          apiKey={apiKey}
          openRouterKey={openRouterKey}
          deals={db.deals}
          isWideMode
        />
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

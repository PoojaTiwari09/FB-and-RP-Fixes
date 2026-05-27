import { useState } from "react";
import styles from "./ApiKeyModal.module.css";

const MODELS_INFO = [
  { name: "llama-4-scout-17b-16e",  limit: "Next-gen experimental architecture", tag: "Chat" },
  { name: "whisper-large-v3",      limit: "High-fidelity audio transcription", tag: "Audio" },
];

export default function ApiKeyModal({ onSave, onClose, currentGroq, currentOpenRouter }) {
  const [groq, setGroq] = useState(currentGroq || "");
  const [openrouter, setOpenRouter] = useState(currentOpenRouter || "");

  function save() {
    if (groq.trim() || openrouter.trim()) {
      onSave({ groq: groq.trim(), openrouter: openrouter.trim() });
      onClose();
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{maxHeight:'90vh', overflowY:'auto'}}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M7 7V5a3 3 0 016 0v2M4 9h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1z" stroke="#4f8eff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>API Keys</h2>
            <p className={styles.sub}>Powers the AI chat & audio analysis</p>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.info}>
            Get a free Groq key at{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
              console.groq.com/keys
            </a>
            {" "}— and an OpenRouter key at{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              openrouter.ai
            </a>
          </p>

          <div className={styles.modelList}>
            <p className={styles.modelTitle}>Auto-fallback model chain</p>
            {MODELS_INFO.map((m, i) => (
              <div key={m.name} className={styles.modelRow}>
                <span className={styles.modelNum}>{i + 1}</span>
                <div className={styles.modelInfo}>
                  <span className={styles.modelName}>{m.name}</span>
                  <span className={styles.modelLimit}>{m.limit}</span>
                </div>
                <span className={`${styles.modelTag} ${i === 0 ? styles.tagGreen : i === 1 ? styles.tagBlue : styles.tagGray}`}>
                  {m.tag}
                </span>
              </div>
            ))}
          </div>

          <label className={styles.label}>Groq API Key (Primary)</label>
          <input
            type="password"
            className={styles.input}
            value={groq}
            onChange={e => setGroq(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="gsk_..."
            autoFocus
          />
          
          <div style={{marginTop: 20}}>
            <label className={styles.label}>OpenRouter API Key (Fallback & Advanced)</label>
            <input
              type="password"
              className={styles.input}
              value={openrouter}
              onChange={e => setOpenRouter(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              placeholder="sk-or-v1-... (OpenRouter format)"
            />
            <p className={styles.note} style={{marginTop:4, fontSize:'0.7rem', color:'#f87171'}}>
              ⚠️ Avoid using OpenAI keys (sk-proj-...) if you want to bypass OpenAI quota limits.
            </p>
          </div>

          <p className={styles.note} style={{marginTop:16}}>
            🔒 Stored in localStorage — never sent anywhere except directly to Groq/OpenRouter APIs.
          </p>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancel} onClick={onClose}>Cancel</button>
          <button className={styles.save} onClick={save} disabled={!groq.trim() && !openrouter.trim()}>
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}

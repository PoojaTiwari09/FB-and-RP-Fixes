import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import { askQuery } from "../../api/m03Api";
import styles from "./ChatPanel.module.css";

const SUGGESTIONS = [
  "What happened in the last call with John?",
  "What objections were mentioned in the Acme deal?",
  "What changed since last week?",
  "Summarize recent conversations with this account.",
];

export default function ChatPanel({
  apiKey,
  currentUser = "admin",
  activeDeal,
  activeAccount,
  activeChat,
  calls = [],
  deals = [],
  accounts = [],
  contacts = [],
  onSaveChatMessage,
  onNewChat
}) {
  const initialMessages = [
    {
      id: "welcome",
      role: "assistant",
      content: "Hey 👋 I'm your **SalesIQ AI Assistant**.\n\nAsk me anything about call transcripts, deals, contacts, or accounts. I will only answer based on grounded company data.\n\nWhat would you like to know?",
      citations: []
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Rate Limiting, Caching, and Debug simulation states
  const [requestTimestamps, setRequestTimestamps] = useState([]);
  const [cache, setCache] = useState({}); // key: 'role:deal:account:queryText', val: {answer, citations, embedding}
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [simulateDataCap, setSimulateDataCap] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState({
    latency: null,
    cacheStatus: "MISS",
    promptSent: "",
    chunksUsed: [],
    tokenCount: 0
  });

  // Invalidate cache on new call transcripts
  const prevCallsCountRef = useRef(calls.length);
  useEffect(() => {
    if (calls.length !== prevCallsCountRef.current) {
      setCache({});
      prevCallsCountRef.current = calls.length;
    }
  }, [calls.length]);

  // Restore history when a previous chat is clicked in the Sidebar
  useEffect(() => {
    if (activeChat) {
      setMessages([
        {
          id: `q-${activeChat.id}`,
          role: "user",
          content: activeChat.question
        },
        {
          id: `a-${activeChat.id}`,
          role: "assistant",
          content: activeChat.answer,
          citations: activeChat.citations || []
        }
      ]);
    } else {
      setMessages(initialMessages);
    }
  }, [activeChat]);

  // Handle active Deal selection prefill
  useEffect(() => {
    if (activeDeal) {
      setInput(`Summarize recent conversations and objections for the deal: ${activeDeal.name}`);
      inputRef.current?.focus();
    }
  }, [activeDeal]);

  // Handle active Account selection prefill
  useEffect(() => {
    if (activeAccount) {
      setInput(`What happened in the last calls with account: ${activeAccount.name}?`);
      inputRef.current?.focus();
    }
  }, [activeAccount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleNewChat() {
    setMessages(initialMessages);
    setInput("");
    if (onNewChat) onNewChat();
    inputRef.current?.focus();
  }

  async function send(text) {
    const rawText = (text || input).trim();
    if (!rawText || loading) return;

    // ── Input Length Validation Capping ──
    const userText = rawText.length > 4000 ? rawText.substring(0, 4000) + "..." : rawText;

    const activeDealId = activeDeal?.id || null;
    const activeAccountId = activeAccount?.id || null;

    setInput("");
    const userMsg = { id: Date.now(), role: "user", content: userText };
    const loadingMsg = { id: Date.now() + 1, role: "assistant", content: "", isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    // ── sliding window rate limiter check ──
    const nowTime = Date.now();
    const activeTimestamps = requestTimestamps.filter(t => nowTime - t < 60000);
    if (activeTimestamps.length >= 5) {
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === loadingMsg.id
              ? {
                  id: Date.now() + 3,
                  role: "assistant",
                  content: "Too Many Requests (429): You have exceeded your rate limit of 5 queries per minute. Please try again later.",
                  citations: []
                }
              : m
          )
        );
        setLoading(false);
        setDebugLogs({
          latency: null,
          cacheStatus: "REJECTED (Rate Limited)",
          promptSent: "Rate limit triggered. Request blocked.",
          chunksUsed: [],
          tokenCount: 0
        });
      }, 500);
      return;
    }
    setRequestTimestamps([...activeTimestamps, nowTime]);

    try {
      // ── Date Window Time Parsing Filter ──
      const lowerText = userText.toLowerCase();
      let startDate = null;
      let endDate = null;
      const now = new Date();

      if (lowerText.includes("last week") || lowerText.includes("past week")) {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
      } else if (lowerText.includes("yesterday")) {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(now.getDate() - 1);
      } else if (lowerText.includes("january") || lowerText.includes("jan")) {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 0, 31, 23, 59, 59);
      } else if (lowerText.includes("february") || lowerText.includes("feb")) {
        startDate = new Date(now.getFullYear(), 1, 1);
        endDate = new Date(now.getFullYear(), 1, 29, 23, 59, 59);
      } else if (lowerText.includes("march") || lowerText.includes("mar")) {
        startDate = new Date(now.getFullYear(), 2, 1);
        endDate = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      } else if (lowerText.includes("3 months ago") || lowerText.includes("three months")) {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 3);
        endDate = new Date();
      }

      const exactCacheKey = `query_cache:${currentUser}:${activeDealId || "global"}:${activeAccountId || "global"}:${userText.toLowerCase().trim()}`;
      if (cache[exactCacheKey]) {
        const cacheHit = cache[exactCacheKey];
        setMessages(prev =>
          prev.map(m =>
            m.id === loadingMsg.id
              ? { ...m, content: cacheHit.answer, citations: cacheHit.citations, isLoading: false, isCached: true }
              : m
          )
        );
        setLoading(false);
        return;
      }

      const startTime = Date.now();
      const result = await askQuery({
        query: userText,
        contextType: activeDealId ? "DEAL" : "ACCOUNT",
        contextId: activeDealId || activeAccountId || undefined,
      });
      const latency = Date.now() - startTime;
      const response = result.answer || "No answer returned.";
      const matchedChunks = (result.citations || []).map((c) => ({
        ...c,
        call_title: c.call_title || "Call Transcript",
      }));

      setCache((prev) => ({
        ...prev,
        [exactCacheKey]: { answer: response, citations: matchedChunks },
      }));

      if (onSaveChatMessage) {
        await onSaveChatMessage(userText, response, matchedChunks);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, content: response, citations: matchedChunks, isLoading: false }
            : m
        )
      );

      setDebugLogs({
        latency,
        cacheStatus: "MISS (NestJS API)",
        promptSent: userText,
        chunksUsed: matchedChunks,
        tokenCount: Math.round(userText.length / 4),
      });

    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, content: `⚠ ${err.message}`, citations: [], isLoading: false }
            : m
        )
      );
      setDebugLogs(prev => ({
        ...prev,
        latency: null,
        cacheStatus: "ERROR",
        promptSent: `Error: ${err.message}`
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.statusDot} />
          <span className={styles.headerTitle}>Ask Anything AI</span>
          <span className={styles.headerSub}>Active Grounded Retrieval</span>
        </div>

        {/* Selected context indicators */}
        <div className={styles.activeScopes}>
          {activeDeal && (
            <span className={styles.scopeBadge}>
              🤝 Deal: {activeDeal.name}
            </span>
          )}
          {activeAccount && (
            <span className={styles.scopeBadge}>
              🏢 Account: {activeAccount.name}
            </span>
          )}
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={() => setShowDebug(prev => !prev)}
            className={styles.debugBtn}
          >
            🐞 Debug Console {showDebug ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className={styles.suggestion}
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              activeDeal
                ? `Ask anything about the ${activeDeal.name} deal...`
                : activeAccount
                ? `Ask anything about the ${activeAccount.name} account...`
                : "Ask anything about call transcripts, objections, deals, or accounts..."
            }
            rows={1}
            disabled={loading}
          />
          <button
            className={`${styles.sendBtn} ${(input.trim() && !loading) ? styles.sendActive : ""}`}
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <div className={styles.spinner} />
            ) : (
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M17 10L3 3l3 7-3 7 14-7z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <p className={styles.hint}>
          Press Enter to send · Shift+Enter for new line · AI answers ONLY from verified data sources
        </p>
      </div>

      {/* Debug Drawer */}
      {showDebug && (
        <div className={styles.debugDrawer}>
          <div className={styles.debugHeader}>
            <div className={styles.debugTitle}>
              <span>🐞 AI Retrieval & Grounding Debug Console</span>
            </div>
            <div className={styles.debugToggles}>
              <label className={styles.debugToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.debugToggleCheckbox}
                  checked={simulateTimeout}
                  onChange={(e) => setSimulateTimeout(e.target.checked)}
                />
                Simulate 3s Timeout
              </label>
              <label className={styles.debugToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.debugToggleCheckbox}
                  checked={simulateDataCap}
                  onChange={(e) => setSimulateDataCap(e.target.checked)}
                />
                Enforce 3-Chunk Data Cap
              </label>
            </div>
          </div>

          <div className={styles.debugGrid}>
            <div className={styles.debugCard}>
              <div className={styles.debugCardTitle}>Latency</div>
              <div className={styles.debugCardValue}>
                {debugLogs.latency !== null ? `${debugLogs.latency}ms` : "N/A"}
              </div>
            </div>
            <div className={styles.debugCard}>
              <div className={styles.debugCardTitle}>Cache Status</div>
              <div className={styles.debugCardValue}>{debugLogs.cacheStatus}</div>
            </div>
            <div className={styles.debugCard}>
              <div className={styles.debugCardTitle}>Estimated Tokens</div>
              <div className={styles.debugCardValue}>{debugLogs.tokenCount}</div>
            </div>
          </div>

          <div className={styles.debugSectionTitle}>Assembled Grounding Prompt Sent to LLM</div>
          <div className={styles.debugPrompt}>
            {debugLogs.promptSent || "No request sent yet."}
          </div>

          <div className={styles.debugSectionTitle}>Retrieved Grounding Context Chunks ({debugLogs.chunksUsed.length})</div>
          <div className={styles.debugChunksList}>
            {debugLogs.chunksUsed.length === 0 ? (
              <div className={styles.debugChunkText}>No chunks retrieved yet.</div>
            ) : (
              debugLogs.chunksUsed.map((chunk, idx) => (
                <div key={chunk.id || idx} className={styles.debugChunkItem}>
                  <div className={styles.debugChunkMeta}>
                    <span>Source: {chunk.source_type === "email" ? `Email - ID: ${chunk.id}` : `${chunk.call_title} (${chunk.call_id})`}</span>
                    <span>Similarity: {chunk.similarity !== undefined ? `${(chunk.similarity * 100).toFixed(1)}%` : "N/A"}</span>
                  </div>
                  <div className={styles.debugChunkText}>{chunk.chunk_text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

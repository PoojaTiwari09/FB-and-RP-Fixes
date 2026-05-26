import { useState } from "react";
import styles from "./ChatMessage.module.css";

function renderMarkdown(text) {
  if (!text) return "";
  
  // Headers
  let html = text
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Bold and Italics
  html = html
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  // List items
  html = html
    .replace(/^\d+\. (.*$)/gm, "<li class='ordered'>$1</li>")
    .replace(/^[-•] (.*$)/gm, "<li>$1</li>");

  // Wrap sequential <li> tags in a <ul>, cleaning all inner newlines to prevent unwanted spacing
  html = html.replace(/(<li.*<\/li>\n?)+/g, (match) => {
    const cleaned = match.trim().replace(/\n/g, "");
    return `<ul>${cleaned}</ul>`;
  });

  // Remove trailing newlines after block tags
  html = html
    .replace(/<\/h[1-3]>\n+/g, "</h3>")
    .replace(/<\/ul>\n+/g, "</ul>");

  // Reduce double-newline paragraphs gap to a single line break
  html = html.replace(/\n\n/g, "<br/>");

  // Treat single newlines as text spaces to allow sentences to flow naturally without abrupt breaks
  html = html.replace(/\n/g, " ");

  // Collapse multiple redundant break tags
  html = html.replace(/(<br\s*\/?>\s*)+/g, "<br/>");

  return html;
}

export default function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const [showAllCitations, setShowAllCitations] = useState(false);

  if (isUser) {
    return (
      <div className={styles.userRow}>
        <div className={styles.userBubble}>{msg.content}</div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className={styles.assistantRow}>
      <div className={styles.avatar}>
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#4f8eff" strokeWidth="1.5" />
          <path d="M6 10.5C6 8.015 7.79 6 10 6s4 2.015 4 4.5" stroke="#4f8eff" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="10" cy="13" r="1.5" fill="#4f8eff"/>
        </svg>
      </div>
      <div className={styles.assistantContent}>
        {msg.isLoading ? (
          <div className={styles.loadingDots}>
            <span /><span /><span />
          </div>
        ) : (
          <>
            <div
              className={styles.assistantText}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />

            {/* Grounded RAG Citations Link */}
            {msg.citations && msg.citations.length > 0 && (
              <div 
                className={styles.viewSourcesBtn}
                onClick={() => setShowAllCitations(true)}
              >
                View Source Citations
              </div>
            )}

            {/* Frosty Citation Details Modal */}
            {showAllCitations && (
              <div className={styles.modalOverlay} onClick={() => setShowAllCitations(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>📄 Source Citations</h3>
                    <button className={styles.modalClose} onClick={() => setShowAllCitations(false)}>×</button>
                  </div>
                  <div className={styles.modalBodyScroll}>
                    {msg.citations.map((cite, idx) => {
                      const callTitle = cite.call_title || "Source no longer available";
                      const isAvailable = callTitle !== "Source no longer available" && !callTitle.toLowerCase().includes("deleted");

                      return (
                        <div key={idx} className={styles.citationCard}>
                          <div className={styles.citationHead}>
                            <span className={styles.citationBadge}>Source Chunk #{idx + 1}</span>
                            <span className={styles.citationCall}>
                              {isAvailable ? callTitle : "Source no longer available"}
                            </span>
                          </div>
                          <p className={styles.citationText}>
                            {isAvailable ? `"${cite.chunk_text}"` : "The original call transcript recording has been deleted or is no longer available in the CRM database."}
                          </p>
                          {isAvailable && cite.similarity !== undefined && (
                            <div className={styles.citationSimilarity}>
                              Match confidence: {Math.round(cite.similarity * 100)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.modalFooter}>
                    <button className={styles.modalCloseBtn} onClick={() => setShowAllCitations(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

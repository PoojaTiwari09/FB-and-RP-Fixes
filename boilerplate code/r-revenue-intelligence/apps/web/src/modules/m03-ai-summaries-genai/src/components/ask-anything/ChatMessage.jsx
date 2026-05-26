import { useState } from "react";
import styles from "./ChatMessage.module.css";

function renderMarkdown(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const processedLines = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle bold and italics inline first
    line = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle citations
    line = line
      .replace(/\[Source\s*(\d+)\]/gi, (match, num) => {
        const idx = parseInt(num, 10) - 1;
        return `<span class="inline-citation-badge" data-citation-index="${idx}">[Source ${num}]</span>`;
      })
      .replace(/\[(\d+)\]/g, (match, num) => {
        const idx = parseInt(num, 10) - 1;
        return `<span class="inline-citation-badge" data-citation-index="${idx}">[${num}]</span>`;
      });

    // Match Headers
    const h3Match = line.match(/^###\s+(.*)$/);
    const h2Match = line.match(/^##\s+(.*)$/);
    const h1Match = line.match(/^#\s+(.*)$/);

    if (h3Match) {
      if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      processedLines.push(`<h3>${h3Match[1]}</h3>`);
      continue;
    }
    if (h2Match) {
      if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      processedLines.push(`<h2>${h2Match[1]}</h2>`);
      continue;
    }
    if (h1Match) {
      if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      processedLines.push(`<h1>${h1Match[1]}</h1>`);
      continue;
    }

    // Match Unordered List Items: starts with optional whitespace, then a bullet [- • + *], then whitespace
    const ulMatch = line.match(/^\s*[-•+*]\s+(.*)$/);
    if (ulMatch) {
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      if (!inUnorderedList) { processedLines.push("<ul>"); inUnorderedList = true; }
      processedLines.push(`<li>${ulMatch[1]}</li>`);
      continue;
    }

    // Match Ordered List Items: starts with optional whitespace, then a number, then a dot, then whitespace
    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
      if (!inOrderedList) { processedLines.push("<ol>"); inOrderedList = true; }
      processedLines.push(`<li class="ordered">${olMatch[2]}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      processedLines.push("<br/>");
      continue;
    }

    // Regular line - close list if open
    if (inUnorderedList) { processedLines.push("</ul>"); inUnorderedList = false; }
    if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
    processedLines.push(line);
  }

  // Close any open lists at the end
  if (inUnorderedList) processedLines.push("</ul>");
  if (inOrderedList) processedLines.push("</ol>");

  let html = processedLines.join("\n");

  // Clean up excessive breaks
  html = html.replace(/(<br\s*\/?>\s*){2,}/g, "<br/>");

  return html;
}

export default function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const [showAllCitations, setShowAllCitations] = useState(false);
  const [highlightedCitationIndex, setHighlightedCitationIndex] = useState(null);

  if (isUser) {
    return (
      <div className={styles.userRow}>
        <div className={styles.userBubble}>{msg.content}</div>
      </div>
    );
  }

  const handleTextClick = (e) => {
    const target = e.target;
    if (target.classList.contains("inline-citation-badge")) {
      const citationIndex = parseInt(target.getAttribute("data-citation-index"), 10);
      if (!isNaN(citationIndex)) {
        setHighlightedCitationIndex(citationIndex);
        setShowAllCitations(true);
      }
    }
  };

  const handleCloseCitations = () => {
    setShowAllCitations(false);
    setHighlightedCitationIndex(null);
  };

  return (
    <div className={styles.assistantRow}>
      <div className={styles.avatar}>
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28" style={{ background: '#eff6ff', borderRadius: '50%', padding: '4.5px', border: '1px solid #bfdbfe' }}>
          <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="1.8" />
          <path d="M8 12.5c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="15.5" r="1.5" fill="#2563eb"/>
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
              onClick={handleTextClick}
            />

            {msg.citations && msg.citations.length > 0 && (
              <div 
                className={styles.viewSourcesBtn}
                onClick={() => setShowAllCitations(true)}
              >
                View Source Citations
              </div>
            )}

            {showAllCitations && (
              <div className={styles.modalOverlay} onClick={handleCloseCitations}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>📄 Source Citations</h3>
                    <button className={styles.modalClose} onClick={handleCloseCitations}>×</button>
                  </div>
                  <div className={styles.modalBodyScroll}>
                    {msg.citations.map((cite, idx) => {
                      const callTitle = cite.call_title || "Source no longer available";
                      const isAvailable = callTitle !== "Source no longer available" && !callTitle.toLowerCase().includes("deleted");
                      const isHighlighted = highlightedCitationIndex === idx;

                      return (
                        <div 
                          key={idx} 
                          className={`${styles.citationCard} ${isHighlighted ? styles.citationCardHighlighted : ""}`}
                          ref={el => {
                            if (isHighlighted && el) {
                              setTimeout(() => {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 100);
                            }
                          }}
                        >
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
                    <button className={styles.modalCloseBtn} onClick={handleCloseCitations}>Close</button>
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

import { useState } from "react";
import styles from "./Sidebar.module.css";

const ChevronIcon = ({ isOpen }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    width="10"
    height="10"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
      transition: "transform 0.2s ease",
      color: "var(--text3)"
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function Sidebar({
  deals = [],
  accounts = [],
  chatHistory = [],
  activeDeal,
  activeAccount,
  onDealSelect,
  onAccountSelect,
  onChatSelect,
  activeChatId,
  onClearContext,
  onDeleteChat,
  onNewChat
}) {
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dealsOpen, setDealsOpen] = useState(true);
  const [accountsOpen, setAccountsOpen] = useState(true);

  const getStageClass = (stage) => {
    if (!stage) return styles.badgeDefault;
    const s = stage.toLowerCase();
    if (s.includes("negotiation")) return styles.badgeNegotiation;
    if (s.includes("proposal")) return styles.badgeProposal;
    if (s.includes("qualification")) return styles.badgeQualification;
    if (s.includes("won")) return styles.badgeClosedWon;
    if (s.includes("demo")) return styles.badgeDemo;
    return styles.badgeDefault;
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#4f8eff" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4f8eff" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>SalesIQ AI</span>
        </div>
        <div className={styles.badge}>RAG</div>
      </div>

      {/* New Chat Button */}
      <div className={styles.newChatWrapper}>
        <button className={styles.newChatBtn} onClick={onNewChat}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Selected Scope Summary */}
      {(activeDeal || activeAccount) && (
        <div className={styles.contextSummary}>
          <div className={styles.contextHead}>
            <span className={styles.contextLabel}>Active Scope</span>
            <button className={styles.clearContextBtn} onClick={onClearContext} title="Clear Context Filter">
              Clear ×
            </button>
          </div>
          <div className={styles.contextCard}>
            {activeDeal && (
              <div className={styles.contextItem}>
                <span className={styles.contextIcon}>🤝</span>
                <span className={styles.contextName} title={activeDeal.name}>{activeDeal.name}</span>
              </div>
            )}
            {activeAccount && (
              <div className={styles.contextItem}>
                <span className={styles.contextIcon}>🏢</span>
                <span className={styles.contextName} title={activeAccount.name}>{activeAccount.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Chats */}
      <div className={`${styles.section} ${!chatsOpen ? styles.collapsed : ""}`}>
        <button className={styles.sectionHeader} onClick={() => setChatsOpen(!chatsOpen)}>
          <p className={styles.sectionLabel}>
            <ChevronIcon isOpen={chatsOpen} />
            Previous Chats
          </p>
        </button>
        {chatsOpen && (
          <div className={styles.scrollList}>
            {chatHistory.length === 0 ? (
              <div className={styles.emptyState}>No previous chats</div>
            ) : (
              chatHistory.map(chat => (
                <div
                  key={chat.id}
                  className={`${styles.chatWrap} ${activeChatId === chat.id ? styles.chatActive : ""}`}
                  onClick={() => onChatSelect(chat)}
                >
                  <div className={styles.chatLeft}>
                    <span className={styles.chatIcon}>💬</span>
                    <span className={styles.chatText} title={chat.question}>
                      {chat.question.length > 25 ? chat.question.substring(0, 22) + "..." : chat.question}
                    </span>
                  </div>
                  <button
                    className={styles.deleteChatBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteChat) onDeleteChat(chat.id);
                    }}
                    title="Delete Chat"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Deals Selector */}
      <div className={`${styles.section} ${!dealsOpen ? styles.collapsed : ""}`}>
        <button className={styles.sectionHeader} onClick={() => setDealsOpen(!dealsOpen)}>
          <p className={styles.sectionLabel}>
            <ChevronIcon isOpen={dealsOpen} />
            Deals
          </p>
        </button>
        {dealsOpen && (
          <div className={styles.scrollList}>
            {deals.length === 0 ? (
              <div className={styles.emptyState}>No deals found</div>
            ) : (
              deals.map(deal => (
                <div
                  key={deal.id}
                  className={`${styles.dealItem} ${activeDeal?.id === deal.id ? styles.dealActive : ""}`}
                  onClick={() => onDealSelect(deal)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onDealSelect(deal);
                    }
                  }}
                >
                  <div className={styles.dealTop}>
                    <span className={styles.dealName} title={deal.name}>{deal.name}</span>
                  </div>
                  <div className={styles.dealBottom}>
                    <span className={`${styles.dealStageBadge} ${getStageClass(deal.stage)}`}>
                      {deal.stage || "Qualification"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Accounts Selector */}
      <div className={`${styles.section} ${!accountsOpen ? styles.collapsed : ""}`}>
        <button className={styles.sectionHeader} onClick={() => setAccountsOpen(!accountsOpen)}>
          <p className={styles.sectionLabel}>
            <ChevronIcon isOpen={accountsOpen} />
            Accounts
          </p>
        </button>
        {accountsOpen && (
          <div className={styles.scrollList}>
            {accounts.length === 0 ? (
              <div className={styles.emptyState}>No accounts found</div>
            ) : (
              accounts.map(acc => (
                <div
                  key={acc.id}
                  className={`${styles.accountItem} ${activeAccount?.id === acc.id ? styles.accountActive : ""}`}
                  onClick={() => onAccountSelect(acc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onAccountSelect(acc);
                    }
                  }}
                >
                  <span className={styles.accIcon}>🏢</span>
                  <span className={styles.accName} title={acc.name}>{acc.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Ask Anything AI Copilot</span>
      </div>
    </aside>
  );
}

import styles from "./Sidebar.module.css";

const getNav = () => [
  { id: "liveAssist", icon: "🎧", label: "Live Assist", badge: "LIVE" },
];

export default function Sidebar({ activeView, onViewChange }) {
  const NAV = getNav();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 8}}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6" />
            <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.logoText}>DEALSIQX</span>
        </div>
        <div className={styles.badge}>PRO</div>
      </div>

      <div className={styles.scrollArea}>
        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeView === item.id ? styles.active : ""}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}


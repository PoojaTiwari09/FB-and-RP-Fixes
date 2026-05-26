import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SummaryWorkspace } from "../components/summaries/SummaryWorkspace";
import { Phone, Briefcase, Building2, UserCircle, Settings } from "lucide-react";

const TABS = [
  { id: "call",    label: "Call Briefs",    icon: Phone },
  { id: "deal",    label: "Deal Briefs",    icon: Briefcase },
  { id: "account", label: "Account Briefs", icon: Building2 },
  { id: "contact", label: "Contact Briefs", icon: UserCircle },
];

export default function SmartSummariesPage() {
  const [activeTab, setActiveTab] = useState("account");
  const navigate = useNavigate();

  return (
    <div
      className="smart-summaries-theme"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 42px)",
        width: "100%",
        overflow: "hidden",
        background: "#f8f9fc",
      }}
    >
      {/* ── Tab Navigation Bar ── */}
      <div className="ss-tab-nav">
        <div className="ss-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`ss-tab${active ? " ss-tab-active" : ""}`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Admin button */}
        <button
          onClick={() => navigate("/smart-summaries/admin")}
          className="ss-admin-btn"
        >
          <Settings size={12} />
          <span>Manage Templates</span>
        </button>
      </div>

      {/* ── Workspace ── */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <SummaryWorkspace briefType={activeTab} />
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import App from "../modules/m03-ai-summaries-genai/app/page";
import RevenueGraphDashboard from "../modules/m10-data-compliance/components/RevenueGraphDashboard/index";
import DataCloudDashboard from "../modules/m10-data-compliance/components/DataCloudDashboard/index";
import {
  LayoutDashboard,
  MessageSquareCode,
  Sparkles,
  KanbanSquare,
  BarChart3,
  Send,
  GraduationCap,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  Search,
  ArrowRight,
  CornerDownRight,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  User,
  Flame,
  Info
} from "lucide-react";

interface CoachingFeedback {
  score: number;
  critique: string;
  recommendation: string;
}

// ─── M10 Sub-tab Switcher ──────────────────────────────────────────────────────
function M10TabSwitcher() {
  const [m10Tab, setM10Tab] = React.useState<'revenue-graph' | 'data-cloud'>('revenue-graph');
  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
    border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
    color: active ? '#818cf8' : '#64748b',
    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: 'pointer', transition: 'all .2s ease', display: 'flex', alignItems: 'center', gap: 8,
  });
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button style={btnStyle(m10Tab === 'revenue-graph')} onClick={() => setM10Tab('revenue-graph')}><span>🕸️</span> Revenue Graph</button>
        <button style={btnStyle(m10Tab === 'data-cloud')}    onClick={() => setM10Tab('data-cloud')}><span>☁️</span> Data Cloud</button>
      </div>
      {m10Tab === 'revenue-graph' && <RevenueGraphDashboard />}
      {m10Tab === 'data-cloud'    && <DataCloudDashboard />}
    </div>
  );
}


const mockCalls = [
  {
    id: "call_001",
    title: "ACME Corp Q2 Renewal & Scale Plan",
    date: "2026-05-18",
    duration: "45 mins",
    attendees: ["Sarah (ACME VP)", "John (R-Revenue Rep)"],
    sentiment: "88%",
    status: "Processed",
    transcript: [
      { speaker: "Sarah (VP of RevOps)", text: "We're happy with the base features, but for Q2 we need to evaluate scaling from 50 to 250 seats. What does volume discounting look like, and how is GDPR handled?" },
      { speaker: "John (Account Rep)", text: "That is fantastic to hear, Sarah! For 250 seats, we offer a 20% discount. Regarding GDPR compliance, all data resides in isolated schemas under tenant boundaries, and we support immediate tombstone exports to Snowflake." },
      { speaker: "Sarah (VP of RevOps)", text: "Perfect. We also use Outreach currently for automated sequences. Let's make sure there is a workflow trigger when opportunities advance stage." }
    ],
    scorecard: {
      auditorGrade: "9.2/10",
      buyingSignals: ["Seat Expansion (50 to 250)", "Discount Inquiry"],
      objections: ["GDPR Policy", "Integration with Outreach"],
      themes: ["Competitor: Outreach", "Compliance: Isolated Schema"]
    },
    summary: {
      executiveBriefing: "Client seeks to scale seat license count by 5x (from 50 to 250) for the upcoming Q2 renewal cycle. Key evaluation vectors include GDPR regional compliance rules and outbound Outreach sequence workflow hooks.",
      nextSteps: [
        "Send seat expansion volume discounting proposal (John - Rep)",
        "Share R-Revenue data compliance whitepaper (Compliance Team)",
        "Schedule technical integration overview for next Tuesday (All)"
      ]
    }
  },
  {
    id: "call_002",
    title: "Coca-Cola Enterprise Discovery",
    date: "2026-05-17",
    duration: "30 mins",
    attendees: ["Michael (Coca-Cola Dir)", "John (R-Revenue Rep)"],
    sentiment: "76%",
    status: "Processed",
    transcript: [
      { speaker: "Michael (IT Director)", text: "Our main bottleneck is sales transparency. We have multiple regional offices executing campaigns, but there is no centralized database mapping how calls connect to CRM deals." },
      { speaker: "John (Account Rep)", text: "Our M10 Revenue Graph automatically captures Zoom and SMTP activities, links them to deals via RAG embeddings, and triggers downstream coaching notifications." }
    ],
    scorecard: {
      auditorGrade: "8.0/10",
      buyingSignals: ["Unified Ingestion", "Coaching Automation"],
      objections: ["Multi-office Rollout"],
      themes: ["Centralized Ingestion"]
    },
    summary: {
      executiveBriefing: "IT Director raised visibility bottlenecks across multi-regional outreach teams. Highlighted integration capability of Revenue Graph as high-value.",
      nextSteps: [
        "Prepare custom multi-region tenant deployment map",
        "Set up POC zoom activity tracking adapter link"
      ]
    }
  }
];

export default function PlatformDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCall, setSelectedCall] = useState(mockCalls[0]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35);
  
  // Interactive Chat State for M3 RAG Panel
  const [ragInput, setRagInput] = useState("");
  const [ragMessages, setRagMessages] = useState([
    { role: "user", content: "What competitor did Sarah mention during the ACME call?" },
    { role: "assistant", content: "During the call, Sarah mentioned using **Outreach** for automated sales sequences. Representative John discussed R-Revenue's workflow hooks to support integration." }
  ]);
  const [isRagTyping, setIsRagTyping] = useState(false);

  // M4 Deals Board stage advancement simulation
  const [deals, setDeals] = useState([
    { id: "opp-acme-q2", name: "ACME Corp Seat Scale-up", amount: "$120,000", stage: "Discovery", account: "ACME Corp", owner: "John" },
    { id: "deal_02", name: "Coca-Cola POC Deal", amount: "$45,000", stage: "Proposal", account: "Coca-Cola Ltd", owner: "John" },
    { id: "deal_03", name: "Tesla Ingestion Rollout", amount: "$350,000", stage: "Negotiation", account: "Tesla Inc", owner: "Alice" }
  ]);
  const [stageLogs, setStageLogs] = useState<string[]>([]);
  const [activeStageSyncId, setActiveStageSyncId] = useState<string | null>(null);

  // ── M18: AI-Extracted Deal Intelligence ────────────────────────────────
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealIntelligence, setDealIntelligence] = useState<any>(null);
  const [loadingDealIntel, setLoadingDealIntel] = useState(false);
  const [dealSyncing, setDealSyncing] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const fetchDealIntelligence = async (dealId: string) => {
    setLoadingDealIntel(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/ai-extractor/deals/${dealId}/intelligence`);
      if (res.ok) {
        const data = await res.json();
        setDealIntelligence(data);
      }
    } catch (e) {
      console.error("Failed to fetch deal intelligence:", e);
    } finally {
      setLoadingDealIntel(false);
    }
  };

  useEffect(() => {
    if (selectedDealId) {
      fetchDealIntelligence(selectedDealId);
    } else {
      setDealIntelligence(null);
    }
  }, [selectedDealId]);

  const handleUpdateDealIntel = async (resultId: string, value: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/ai-extractor/deals/results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedValue: value }),
      });
      if (res.ok && selectedDealId) {
        setEditingResultId(null);
        fetchDealIntelligence(selectedDealId);
        setStageLogs(prev => [...prev, `[M18 AI Extractor] Manual override updated for result ${resultId} to "${value}".`]);
      }
    } catch (e) {
      console.error("Failed to update result:", e);
    }
  };

  const handleSyncDealToCRM = async (dealId: string) => {
    setDealSyncing(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/ai-extractor/deals/${dealId}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.syncLogs) {
          setStageLogs(prev => [...prev, ...data.syncLogs]);
        }
      }
    } catch (e) {
      console.error("Failed to sync deal to CRM:", e);
    } finally {
      setDealSyncing(false);
    }
  };

  // M8 Email Composer State
  const [emailTo, setEmailTo] = useState("sarah@acme.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);

  // M9 Coaching Simulator State
  const [coachingInput, setCoachingInput] = useState("");
  const [coachingConversation, setCoachingConversation] = useState([
    { role: "client", content: "Hi! We're reviewing your expansion pricing, but honestly, our IT team is extremely concerned about GDPR and data portability. Can you explain your isolation structure?" }
  ]);
  const [isCoachingFeedbackLoading, setIsCoachingFeedbackLoading] = useState(false);
  const [coachingFeedback, setCoachingFeedback] = useState<CoachingFeedback | null>(null);

  // M10 Data Cloud & Compliance Toggles
  const [gdprToggle, setGdprToggle] = useState(true);
  const [ccpaToggle, setCcpaToggle] = useState(true);
  const [failClosedToggle, setFailClosedToggle] = useState(true);
  const [exportLogs, setExportLogs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("Idle");

  // Handle RAG Ask Submission
  const handleRagAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragInput.trim()) return;

    const userMsg = { role: "user", content: ragInput };
    setRagMessages(prev => [...prev, userMsg]);
    setRagInput("");
    setIsRagTyping(true);

    setTimeout(() => {
      let aiAnswer = "I scanned the active transaction record but couldn't find a direct answer. Let's adjust the search query filters.";
      if (ragInput.toLowerCase().includes("gdpr") || ragInput.toLowerCase().includes("compliance")) {
        aiAnswer = "According to the transcript, GDPR compliance is enforced by separating tenant data into **strictly isolated schemas** inside PostgreSQL. R-Revenue also supports daily data export to Snowflake starting at **02:00 UTC**.";
      } else if (ragInput.toLowerCase().includes("seats") || ragInput.toLowerCase().includes("volume")) {
        aiAnswer = "Yes! Sarah asked about scale licensing from **50 to 250 seats**. John promised a **20% volume discount** and is preparing the formal contract proposal.";
      } else if (ragInput.toLowerCase().includes("next step") || ragInput.toLowerCase().includes("todo")) {
        aiAnswer = "The immediate next steps are: **1. John to send volume pricing proposal**, **2. Compliance team to send GDPR isolation specs**, and **3. Set up integration workshop next Tuesday**.";
      }
      
      setRagMessages(prev => [...prev, { role: "assistant", content: aiAnswer }]);
      setIsRagTyping(false);
    }, 1500);
  };

  // Simulate Deals Board Stage Advancement (ADR-005)
  const advanceDealStage = (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    if (!targetDeal) return;

    let nextStage = "Discovery";
    if (targetDeal.stage === "Discovery") nextStage = "Proposal";
    else if (targetDeal.stage === "Proposal") nextStage = "Negotiation";
    else return; // max stage for demo

    setActiveStageSyncId(dealId);
    setStageLogs([
      `[M4 Deal Intel] Rep request: Advance deal "${targetDeal.name}" to ${nextStage}`,
      `[M4 Deal Intel] Optimistic local update done. Publishing internal message "deal.stage.update.requested" to BullMQ...`
    ]);

    setTimeout(() => {
      setStageLogs(prev => [...prev, `[M10 Data & Compliance] Caught request. Starting CRM Outbound synchronization...`]);
    }, 800);

    setTimeout(() => {
      setStageLogs(prev => [
        ...prev,
        `[CRM Endpoint] Outbound PATCH request successfully committed to Salesforce Opportunity [Stage: ${nextStage}].`,
        `[M10 Data & Compliance] Committed update to PostgreSQL schema "m10_data_compliance.deals" table.`,
        `[M10 Data & Compliance] Publishing public event "deal.stage.changed" (v3.0 standard envelope)...`
      ]);
    }, 1800);

    setTimeout(() => {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: nextStage } : d));
      setStageLogs(prev => [
        ...prev,
        `[M4 Deals Board] Consumed "deal.stage.changed" -> card locked on new column.`,
        `[M8 Sales Engagement] Consumed "deal.stage.changed" -> Triggered playbooks sequence automated enrollment.`,
        `[M6 Forecasting] Consumed "deal.stage.changed" -> Recalculated quarterly pipeline predict coverage.`,
        `✓ STAGE UPDATE SYNCHRONIZED COMPLETED.`
      ]);
      setActiveStageSyncId(null);
    }, 2800);
  };

  // Simulate AI Auto-drafting email based on call transcript
  const generateAIDraft = () => {
    setEmailSubject(`Proposal Follow-up: R-Revenue Expansion & GDPR Details`);
    setEmailBody(`Hi Sarah,\n\nIt was a pleasure speaking today! I've attached our formal seat expansion proposal scaling from 50 to 250 licenses (incorporating the 20% volume discount we discussed).\n\nAdditionally, I've requested our security architect to share our technical specs mapping how R-Revenue implements isolated tenant schemas under PostgreSQL. We look forward to our workshop next Tuesday!\n\nBest regards,\nJohn`);
    setEmailLogs(["[M8 Composer] Contact context parsed.", "[M8 Composer] Triggering LiteLLM prompt template over private private FastAPI router...", "[AI Service] Draft created successfully based on call_001 transcript."]);
  };

  // Send email and run compliance evaluation gate
  const sendEmailWithComplianceCheck = () => {
    setIsEmailSent(false);
    setEmailLogs(["[M8 Composer] Send clicked. Intercepting dispatch to run Compliance Runtime Evaluation..."]);

    setTimeout(() => {
      setEmailLogs(prev => [...prev, `[M10 Compliance Gate] POST /api/v1/m10-data-compliance/evaluate`]);
    }, 600);

    setTimeout(() => {
      if (gdprToggle && failClosedToggle) {
        setEmailLogs(prev => [
          ...prev,
          `[M10 Compliance Gate] Evaluating policies: GDPR_Rule=true, Opt-out_Flag=false`,
          `[M10 Compliance Gate] Checking opt-out registry in Postgres schema namespace "m10_data_compliance.crm_optouts"...`,
          `[M10 Compliance Gate] Check complete: recipient is opt-in. Decision = ALLOW (POLICY_PASSED)`,
          `[M8 Dispatcher] Compliance allowed. Dispatching email to SMTP (SendGrid Sandbox Mode)...`
        ]);
      } else {
        setEmailLogs(prev => [...prev, `[M8 Dispatcher] Warning: compliance checks are disabled.`]);
      }
    }, 1400);

    setTimeout(() => {
      setEmailLogs(prev => [...prev, `[M10 Audit Logging] Committed entry to m10_data_compliance.compliance_audit_entries.`, `✓ EMAIL DISPATCH COMPLETED SUCCESS.`]);
      setIsEmailSent(true);
    }, 2200);
  };

  // M9 Coaching roleplay simulation submission
  const submitCoachingRepTurn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachingInput.trim()) return;

    setCoachingConversation(prev => [...prev, { role: "rep", content: coachingInput }]);
    const repMessage = coachingInput;
    setCoachingInput("");
    setIsCoachingFeedbackLoading(true);

    setTimeout(() => {
      let clientMsg = "I hear you on pricing, but we need security sign-off first. What standard schemas are we talking about?";
      let feedback = {
        score: 72,
        critique: "You answered with standard volume pricing discount ranges but failed to address Sarah's concerns regarding the GDPR compliance boundaries first.",
        recommendation: "Validate and explain how tenant data is secured inside Supabase Postgres isolated schemas prior to offering license pricing sheets."
      };

      if (repMessage.toLowerCase().includes("isolate") || repMessage.toLowerCase().includes("schema") || repMessage.toLowerCase().includes("gdpr")) {
        clientMsg = "That is highly reassuring. If data isolation is enforced at both application (Prisma) and database (RLS) layers, that checks our compliance boxes. Let's move to licensing.";
        feedback = {
          score: 95,
          critique: "Excellent objection handling! You clearly articulated the three-tier defense-in-depth isolation framework (Prisma Query Middleware, Supabase PostgreSQL Row-Level Security, JWT validation).",
          recommendation: "Great job. Transition now to standardizing the volume seat pricing model."
        };
      }

      setCoachingConversation(prev => [...prev, { role: "client", content: clientMsg }]);
      setCoachingFeedback(feedback);
      setIsCoachingFeedbackLoading(false);
    }, 1800);
  };

  // M10 Data Cloud export job simulation
  const runDataCloudSync = () => {
    setIsExporting(true);
    setExportStatus("Active Lock");
    setExportLogs([
      "[02:00 UTC Scheduler] Triggering daily incremental data export job...",
      "[M10 Export Service] Checking Redis lock status key sync_id..."
    ]);

    setTimeout(() => {
      setExportLogs(prev => [...prev, "[REDIS Cache] GET sync_id -> Empty. Acquiring Daily Sync Lock key with 4-hour TTL..."]);
    }, 700);

    setTimeout(() => {
      setExportLogs(prev => [
        ...prev,
        "[M10 Export Service] Lock acquired successfully! Resolving destination configuration...",
        "[M10 Database Manager] SELECT incremental updates from m10_data_compliance schema...",
        "[M10 Export Service] Packing deals, contacts, activities into target schema partition batches..."
      ]);
    }, 1500);

    setTimeout(() => {
      setExportLogs(prev => [
        ...prev,
        "[Snowflake Connector] POSTing 45,120 rows to client-owned warehouse destination...",
        "[Snowflake Connector] Merge/Upsert safe database transaction committed successfully.",
        "[M10 Export Service] Advancing cursor checkpoints watermark in m10_data_compliance.data_cloud_checkpoints.",
        "[REDIS Cache] DEL sync_id (Release Daily Sync Lock key)."
      ]);
    }, 2800);

    setTimeout(() => {
      setExportLogs(prev => [...prev, "✓ DAILY SYNC COMPLETED SUCCESS. Checkpoint advanced to 2026-05-19 02:00 UTC."]);
      setIsExporting(false);
      setExportStatus("Completed");
    }, 3500);
  };

  // Sync audio progress bar when playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsAudioPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAudioPlaying]);

  return (
    <div className="relative w-screen h-screen flex overflow-hidden z-10 select-none">
      
      {/* SIDE NAVIGATION BAR */}
      {activeTab !== "calls" && (
        <aside className="w-80 h-full flex flex-col justify-between glass-panel border-r border-slate-800 bg-slate-950/80 p-6 z-20">
          <div className="flex flex-col gap-8">
            
            {/* Main Logo & Platform Status indicator */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
                  R
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-wider text-slate-200">
                    R-REVENUE <span className="text-cyan-400 font-medium">[INTEL]</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Monolithic Command</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse animate-beacon" />
                <span className="text-[11px] text-slate-300 font-mono">Platform status: <span className="text-emerald-400 font-bold">ONLINE</span></span>
              </div>
            </div>

            {/* User profile details */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-900">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                <User size={18} className="text-cyan-400" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-200 truncate">Technical Lead</span>
                <span className="text-[10px] text-slate-500 font-mono truncate">Role: Admin | ACME Global</span>
              </div>
            </div>

            {/* Tab Selection Navigation */}
            <nav className="flex flex-col gap-1.5">
              {[
                { id: "overview", label: "Overview Dashboard", icon: LayoutDashboard, color: "text-slate-400" },
                { id: "calls", label: "M1 & M2 Conversions", icon: MessageSquareCode, color: "text-cyan-400" },
                { id: "summaries", label: "M3 AI Briefings", icon: Sparkles, color: "text-purple-400" },
                { id: "deals", label: "M4 & M5 Deals Board", icon: KanbanSquare, color: "text-emerald-400" },
                { id: "analytics", label: "M6 & M7 Performance", icon: BarChart3, color: "text-purple-400" },
                { id: "engagement", label: "M8 Sales Engagement", icon: Send, color: "text-cyan-400" },
                { id: "coaching", label: "M9 Coaching Simulator", icon: GraduationCap, color: "text-amber-400" },
                { id: "compliance", label: "M10 Compliance & Cloud", icon: ShieldCheck, color: "text-emerald-400" },
              ].map(tab => {
                const IconComp = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'summaries') {
                        window.location.href = '/m3';
                      } else if (tab.id === 'analytics') {
                        window.location.href = '/forecasting';
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 border ${
                      isSelected
                        ? "bg-slate-900/80 border-slate-800 text-slate-100 shadow-md shadow-black/40 font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    <IconComp size={16} className={tab.color} />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer details */}
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-900">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Workspaces:</span>
              <span className="text-cyan-400">14 Packages</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>DB Searchpath:</span>
              <span className="text-emerald-400">m10_compliance</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Pnpm Monorepo:</span>
              <span className="text-slate-300">v9.x strictly</span>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN COMMAND PLATFORM */}
      {activeTab === "calls" ? (
        <main className="flex-1 w-full h-full flex flex-col overflow-hidden bg-slate-950 z-10 relative">
          <ConversationLibraryView />
          
          {/* Floating back button to return to dashboard */}
          <button 
            onClick={() => setActiveTab("overview")}
            className="absolute bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300 shadow-xl shadow-black/50 transition-all"
          >
            <ArrowRight size={14} className="rotate-180" />
            Return to Monolithic Command
          </button>
        </main>
      ) : (
        <main className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950/40 z-10">
          
          {/* UPPER STATUS HEADER BAR */}
          <header className="h-16 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase font-mono tracking-widest text-slate-400">Active Workspace:</span>
              <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
                apps/web/
              </div>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-mono text-slate-500">BOILERPLATE SIMULATION</span>
            </div>

            <div className="flex items-center gap-3">
              <a href="/board/commercial" className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white transition-all mr-4 cursor-pointer no-underline">
                <span className="text-xs font-bold tracking-wide">ENTER M05 POC</span>
              </a>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80">
                <Database size={12} className="text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-mono font-bold">tenant_001</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80">
                <Lock size={12} className="text-cyan-400 animate-beacon" />
                <span className="text-[10px] text-slate-300 font-mono font-bold">m10_data_compliance</span>
              </div>
            </div>
          </header>

          {/* WORKSPACE VIEWPORT SCROLL CONTAINER */}
          <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-8">
              
              {/* Feature Introduction block */}
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-100"> Boileplate Command Overview </h1>
                <p className="text-sm text-slate-400 max-w-3xl">
                  Centralized visualization of the R-Revenue modular monolithic platform. Navigate the sidebar modules to trigger events, check pipeline logs, compose compliance-safe outreach, and simulate daily export synchronizations.
                </p>
              </div>

              {/* Stats Counters Grid (M1, M2, M4, M6) */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "M1 Ingested Calls", val: "1,248", change: "+12% this week", color: "from-cyan-500 to-blue-500", icon: MessageSquareCode },
                  { label: "M2 Conversation Sentiment", val: "84.5%", change: "Audit Scorecard grade", color: "from-purple-500 to-indigo-500", icon: Sparkles },
                  { label: "M4 Pipeline Bookings", val: "$2,450,000", change: "Active Opportunity Pipeline", color: "from-emerald-500 to-teal-500", icon: KanbanSquare },
                  { label: "M6 Forecast Accuracy", val: "96.8%", change: "AI Predictive Model Margin", color: "from-purple-500 to-pink-500", icon: BarChart3 }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="glass-panel p-6 flex flex-col justify-between h-36 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full group-hover:opacity-10 transition-all duration-300" />
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          <Icon size={16} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-black text-slate-100 tracking-tight">{stat.val}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{stat.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Attainment Graph (M7) & Ingestion Log (M10) Columns */}
              <div className="grid grid-cols-5 gap-6">
                
                {/* Column A: Attainment Graph (M7) */}
                <div className="col-span-3 glass-panel p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-purple-400" />
                      <h3 className="text-xs uppercase tracking-widest font-mono text-slate-300 font-bold">M7 Columnar BI Attainment</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Source: ClickHouse Columnar DB</span>
                  </div>

                  {/* SVG Chart Representing Bookings vs Quotas */}
                  <div className="relative w-full h-64 bg-slate-950/60 rounded-lg border border-slate-900 p-4 flex flex-col justify-between">
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                      {[1, 2, 3, 4].map(n => <div key={n} className="w-full border-t border-slate-900/50 h-px" />)}
                    </div>
                    
                    {/* Simulated SVG Path graph lines */}
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Quota target dashed line */}
                      <line x1="0" y1="100" x2="400" y2="100" stroke="#9d4edd" strokeWidth="1" strokeDasharray="4 4" />
                      {/* Bookings actual progress path line */}
                      <path d="M 0 170 Q 100 150 200 80 T 400 30" fill="none" stroke="#00f0ff" strokeWidth="2.5" className="animate-pulse-cyan" />
                      {/* Shadow area beneath graph path */}
                      <path d="M 0 170 Q 100 150 200 80 T 400 30 L 400 200 L 0 200 Z" fill="url(#grad)" opacity="0.05" />
                      
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00f0ff" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Q1 Sales Intro</span>
                      <span>Q2 Pipeline Growth</span>
                      <span>Q3 Target Locked</span>
                    </div>
                  </div>
                </div>

                {/* Column B: Activity Log (M10 Revenue Graph) */}
                <div className="col-span-2 glass-panel p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-emerald-400" />
                      <h3 className="text-xs uppercase tracking-widest font-mono text-slate-300 font-bold">M10 Graph Linked Activity</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Live Ingestion</span>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto max-h-64 pr-2">
                    {[
                      { msg: "Interaction linked to ACME Corp Renewal", time: "2 mins ago", confidence: "94%", color: "text-emerald-400" },
                      { msg: "Call scorecard graded for Coca-Cola POC", time: "1 hour ago", confidence: "80%", color: "text-emerald-400" },
                      { msg: "Email activity mapped to Opportunity Tesla Ingestion", time: "4 hours ago", confidence: "98%", color: "text-emerald-400" },
                      { msg: "GDPR Consent record validated for EU contact", time: "1 day ago", confidence: "100%", color: "text-emerald-400" }
                    ].map((log, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-900 flex items-start gap-3">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="text-xs text-slate-300 font-medium leading-relaxed truncate">{log.msg}</span>
                          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                            <span>{log.time}</span>
                            <span>•</span>
                            <span>Confidence: <span className={log.color}>{log.confidence}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
                  {/* TAB 2: CALLS & CONVERSATION CI */}
          {/* Note: This tab is now handled conditionally at the top-level main command platform block */}

          {/* TAB 3: M3 AI SMART BRIEFINGS & CHAT */}
          {activeTab === "summaries" && (
            <div className="grid grid-cols-2 gap-8">
              
              {/* Executive Summary Card (M3 Briefings) */}
              <div className="glass-panel p-6 flex flex-col gap-6 h-fit bg-gradient-to-br from-slate-950/80 to-slate-900/30">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400 animate-beacon" />
                    <h3 className="text-sm font-bold text-slate-200">M3 AI Smart Summaries</h3>
                  </div>
                  <span className="badge badge-purple">Structured Brief</span>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-mono uppercase text-slate-500">Executive Briefing:</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-900 p-4 rounded-lg">
                    {selectedCall.summary.executiveBriefing}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-mono uppercase text-slate-500">Next Steps & Action Items:</h4>
                  <div className="flex flex-col gap-2">
                    {selectedCall.summary.nextSteps.map((step, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                        <CornerDownRight size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ask Anything chat panel (M3 RAG) */}
              <div className="glass-panel p-6 flex flex-col justify-between h-[520px]">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareCode size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-200">M3 Ask Anything (RAG Inquire)</h3>
                  </div>
                  <span className="badge badge-cyan">RAG Context Store</span>
                </div>

                {/* Message display panel */}
                <div className="flex-1 overflow-y-auto my-4 pr-2 flex flex-col gap-4">
                  {ragMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start"}`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{msg.role}</span>
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed border ${
                          msg.role === "user"
                            ? "bg-slate-900 border-slate-800 text-slate-200"
                            : "bg-purple-950/20 border-purple-500/20 text-slate-300"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {isRagTyping && (
                    <div className="self-start flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/30 px-3 py-2 rounded-lg border border-slate-900">
                      <RefreshCw size={12} className="animate-spin text-cyan-400" />
                      <span>RAG scanning isolated transcript DB...</span>
                    </div>
                  )}
                </div>

                {/* Question Input form */}
                <form onSubmit={handleRagAsk} className="flex gap-2 border-t border-slate-900 pt-4">
                  <input
                    type="text"
                    value={ragInput}
                    onChange={(e) => setRagInput(e.target.value)}
                    placeholder="Ask about GDPR constraints, seat expansion numbers, or next steps..."
                    className="cyber-input flex-1"
                  />
                  <button type="submit" className="btn-cyber btn-cyber-cyan p-2.5">
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: M4 & M5 DEALS COMMAND PIPELINE */}
          {activeTab === "deals" && (
            <div className="flex flex-col gap-8">
              
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100">M4 Deal Intelligence Board</h1>
                  <p className="text-sm text-slate-400">Advance pipeline stages or edit AI-extracted intelligence properties, which syncs to HubSpot.</p>
                </div>
                <span className="badge badge-emerald">Enforced ADR-005 & M18 AI Sync</span>
              </div>

              <div className="grid grid-cols-12 gap-8">
                
                {/* Column columns (Kanban board layout) */}
                <div className="col-span-8 grid grid-cols-3 gap-6">
                  {["Discovery", "Proposal", "Negotiation"].map(columnStage => {
                    const stageDeals = deals.filter(d => d.stage === columnStage);
                    return (
                      <div key={columnStage} className="glass-panel p-5 flex flex-col gap-4 bg-slate-950/40">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{columnStage}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 font-bold">{stageDeals.length}</span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {stageDeals.map(deal => {
                            const isSelected = selectedDealId === deal.id;
                            return (
                              <div
                                key={deal.id}
                                onClick={() => setSelectedDealId(deal.id)}
                                className={`p-4 rounded-lg bg-slate-900/60 border flex flex-col gap-3 group transition-all cursor-pointer ${
                                  isSelected ? "border-purple-500 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]" : "border-slate-800/80 hover:border-slate-700"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-200">{deal.name}</span>
                                  <span className="text-[10px] text-slate-500">{deal.account} • Rep: {deal.owner}</span>
                                </div>
                                
                                <div className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
                                  <span className="text-xs font-black text-emerald-400">{deal.amount}</span>
                                  
                                  {columnStage !== "Negotiation" && (
                                    <button
                                      onClick={() => advanceDealStage(deal.id)}
                                      disabled={activeStageSyncId !== null}
                                      className="btn-cyber btn-cyber-emerald py-1 px-2.5 text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                                    >
                                      {activeStageSyncId === deal.id ? (
                                        <RefreshCw size={10} className="animate-spin text-emerald-400" />
                                      ) : (
                                        <>
                                          <span>Advance</span>
                                          <ArrowRight size={10} />
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="col-span-4 flex flex-col gap-6">
                  {/* AI-Extracted Deal Intelligence Panel */}
                  <div className="glass-panel p-5 flex flex-col gap-4 bg-slate-950/80">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-400 animate-beacon" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">AI Deal Intelligence</h4>
                      </div>
                      {selectedDealId && (
                        <button
                          onClick={() => handleSyncDealToCRM(selectedDealId)}
                          disabled={dealSyncing}
                          className="btn-cyber btn-cyber-purple py-1 px-2 text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          {dealSyncing ? (
                            <RefreshCw size={10} className="animate-spin text-purple-400" />
                          ) : (
                            <>
                              <Database size={10} />
                              <span>CRM Sync</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-1 max-h-[300px]">
                      {!selectedDealId ? (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center p-4 py-8">
                          <Sparkles size={24} className="text-slate-700 mb-2" />
                          <span className="text-xs">Select any deal card to load real-time AI-extracted CRM fields and trigger writes.</span>
                        </div>
                      ) : loadingDealIntel ? (
                        <div className="text-slate-500 flex items-center justify-center gap-2 py-12 text-xs font-mono">
                          <RefreshCw size={14} className="animate-spin text-purple-400" />
                          <span>Querying RAG & CRM mappings...</span>
                        </div>
                      ) : !dealIntelligence || !dealIntelligence.results || dealIntelligence.results.length === 0 ? (
                        <div className="text-slate-600 flex flex-col items-center justify-center text-center p-4 py-8">
                          <Info size={20} className="text-slate-700 mb-2" />
                          <span className="text-[10px] leading-relaxed">No AI extractions found. Upload a call with Opportunity ID &ldquo;opp-acme-q2&rdquo; to populate structured insights automatically!</span>
                        </div>
                      ) : (
                        dealIntelligence.results.map((res: any) => {
                          const isEditing = editingResultId === res.id;
                          const score = Math.round(res.confidenceScore * 100);
                          const isHigh = score >= 80;
                          const isMedium = score >= 50 && score < 80;
                          return (
                            <div key={res.id} className="p-3 rounded bg-slate-900/80 border border-slate-800/80 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-mono text-slate-500 uppercase">{res.field.fieldName}</span>
                                  <span className="text-xs font-bold text-slate-300">{res.field.fieldLabel}</span>
                                </div>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                  isHigh ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" :
                                  isMedium ? "bg-amber-950/40 text-amber-400 border border-amber-500/20" :
                                  "bg-rose-950/40 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {score}% Conf
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="flex gap-2 items-center mt-1">
                                  {res.field.dataType === "enum" ? (
                                    <select
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="cyber-input py-1 text-xs flex-1"
                                    >
                                      <option value="">Select Option</option>
                                      {res.field.enumOptions.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : res.field.dataType === "boolean" ? (
                                    <select
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="cyber-input py-1 text-xs flex-1"
                                    >
                                      <option value="true">True</option>
                                      <option value="false">False</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="cyber-input py-1 text-xs flex-1"
                                    />
                                  )}
                                  <button
                                    onClick={() => handleUpdateDealIntel(res.id, editingValue)}
                                    className="btn-cyber btn-cyber-emerald py-1 px-2 text-[10px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingResultId(null)}
                                    className="btn-cyber py-1 px-2 text-[10px] text-slate-400 border-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-900">
                                  <span className="text-xs text-slate-200 font-medium">
                                    {res.extractedValue ?? <em className="text-slate-600">Not extracted</em>}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingResultId(res.id);
                                      setEditingValue(res.extractedValue ?? "");
                                    }}
                                    className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}

                              {res.rawEvidence && (
                                <div className="text-[9px] text-slate-500 italic border-l-2 border-slate-800 pl-2 leading-relaxed">
                                  &ldquo;{res.rawEvidence}&rdquo;
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Visual side logger panel (ADR-005) */}
                  <div className="glass-panel p-5 flex flex-col gap-4 h-[300px] bg-slate-950/80">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                      <Database size={14} className="text-cyan-400 animate-beacon" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">ADR-005 Event Ingestion</h4>
                    </div>

                    <div className="flex-grow overflow-y-auto flex flex-col gap-2 font-mono text-[9px] leading-relaxed pr-2 text-slate-400">
                      {stageLogs.length === 0 ? (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center p-4">
                          <Info size={24} className="text-slate-700 mb-2" />
                          <span>Click &quot;Advance&quot; on any deal card above to simulate the ADR-005 CRM synchronizing flow.</span>
                        </div>
                      ) : (
                        stageLogs.map((log, i) => {
                          const isSuccess = log.startsWith("✓") || log.includes("SUCCESS") || log.includes("Success");
                          const isCRM = log.includes("[CRM Endpoint]") || log.includes("[Sync Engine]");
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded border ${
                                isSuccess
                                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 font-bold"
                                  : isCRM
                                  ? "bg-purple-950/20 border-purple-500/20 text-purple-400"
                                  : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}
                            >
                              {log}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: M6 & M7 ANALYTICS & PREDICTOR */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-3 gap-8">
              
              {/* AI Forecast Predictor widget (M6 Predictor) */}
              <div className="col-span-2 glass-panel p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-purple-400 animate-beacon" />
                    <h3 className="text-sm font-bold text-slate-200">M6 AI Predicted Revenue Forecast</h3>
                  </div>
                  <span className="badge badge-purple">Quota vs Target</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Target Quota", val: "$500,000", color: "text-slate-300" },
                    { label: "Predict Revenue", val: "$482,000", color: "text-purple-400" },
                    { label: "AI Forecast Coverage", val: "96.4%", color: "text-cyan-400" }
                  ].map((metric, i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{metric.label}</span>
                      <span className={`text-lg font-black tracking-tight ${metric.color}`}>{metric.val}</span>
                    </div>
                  ))}
                </div>

                {/* SVG Visualizing Predictions curves */}
                <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-900 h-64 flex flex-col justify-between">
                  <svg className="w-full h-full" viewBox="0 0 500 200">
                    <path d="M 0 160 C 120 140, 250 90, 500 30" fill="none" stroke="#9d4edd" strokeWidth="2.5" strokeDasharray="3 3" />
                    <path d="M 0 160 C 120 150, 250 110, 500 45" fill="none" stroke="#00f0ff" strokeWidth="2.5" />
                    <circle cx="500" cy="45" r="4" fill="#00f0ff" />
                  </svg>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Month 1 (Intro)</span>
                    <span>Month 2 (Pipeline scale)</span>
                    <span>Month 3 (Prediction Lock)</span>
                  </div>
                </div>
              </div>

              {/* Rep submissions ledger (M6 Immutability) */}
              <div className="col-span-1 glass-panel p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-slate-400" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Manager Submissions</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Immutable</span>
                </div>

                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {[
                    { rep: "John Rep", amount: "$150,000", date: "2026-05-18", status: "Locked", version: "v2" },
                    { rep: "Alice Rep", amount: "$220,000", date: "2026-05-17", status: "Locked", version: "v1" },
                    { rep: "Sales Director", amount: "$450,000", date: "2026-05-18", status: "Submitted", version: "v3" }
                  ].map((sub, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-900 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200">{sub.rep}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-purple-400 font-bold border border-purple-500/10">{sub.version}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>{sub.date}</span>
                        <span className="text-emerald-400 font-bold">{sub.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: M8 EMAIL COMPOSER OUTBOUND */}
          {activeTab === "engagement" && (
            <div className="grid grid-cols-2 gap-8">
              
              {/* Outbound Email Form */}
              <div className="glass-panel p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Send size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-200">M8 Smart Email Composer</h3>
                  </div>
                  
                  <button
                    onClick={generateAIDraft}
                    className="btn-cyber btn-cyber-purple py-1.5 px-3 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>AI Auto-Draft</span>
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500">Recipient Email:</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="cyber-input"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500">Subject:</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Click AI Auto-draft or type subject..."
                      className="cyber-input"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono uppercase text-slate-500">Email Body:</label>
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Draft your follow-up context here..."
                      className="cyber-input font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-cyan-400" />
                    <span className="text-[10px] text-slate-400">Sandbox sandbox mode (SendGrid Sandbox)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isEmailSent && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold animate-pulse">✓ Dispatched</span>
                    )}
                    <button
                      onClick={sendEmailWithComplianceCheck}
                      className="btn-cyber btn-cyber-cyan cursor-pointer"
                    >
                      <span>Dispatch Email</span>
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Evaluation Logger pane */}
              <div className="glass-panel p-6 flex flex-col gap-4 h-[500px] bg-slate-950/80">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Compliance Enforce Audit</h4>
                </div>

                <div className="flex-grow overflow-y-auto flex flex-col gap-2 font-mono text-[9px] leading-relaxed pr-2 text-slate-400">
                  {emailLogs.length === 0 ? (
                    <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center p-4">
                      <Info size={24} className="text-slate-700 mb-2" />
                      <span>Draft or edit subject, then click &quot;Dispatch Email&quot; to trigger the M10 compliance evaluation sequence.</span>
                    </div>
                  ) : (
                    emailLogs.map((log, i) => {
                      const isAllow = log.includes("ALLOW") || log.includes("COMPLETED");
                      const isCheck = log.includes("[M10 Compliance Gate]");
                      return (
                        <div
                          key={i}
                          className={`p-2 rounded border ${
                            isAllow
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 font-bold"
                              : isCheck
                              ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-400"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: M9 AI COACHING SIMULATOR */}
          {activeTab === "coaching" && (
            <div className="grid grid-cols-2 gap-8">
              
              {/* Virtual Client Chat Screen */}
              <div className="glass-panel p-6 flex flex-col justify-between h-[520px] bg-slate-950/60">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-200">M9 Sales Coaching Simulator</h3>
                  </div>
                  <span className="badge badge-amber">Interactive Trainer</span>
                </div>

                {/* Conversation ledger */}
                <div className="flex-grow overflow-y-auto my-4 pr-2 flex flex-col gap-4">
                  {coachingConversation.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "rep" ? "self-end items-end" : "self-start"}`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {msg.role === "rep" ? "You (Representative)" : "Sarah (VP Client)"}
                      </span>
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed border ${
                          msg.role === "rep"
                            ? "bg-slate-900 border-slate-800 text-slate-200"
                            : "bg-amber-950/20 border-amber-500/20 text-slate-300"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isCoachingFeedbackLoading && (
                    <div className="self-start flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/30 px-3 py-2 rounded-lg border border-slate-900">
                      <RefreshCw size={12} className="animate-spin text-amber-400" />
                      <span>Coaching evaluation score calculations...</span>
                    </div>
                  )}
                </div>

                <form onSubmit={submitCoachingRepTurn} className="flex gap-2 border-t border-slate-900 pt-4">
                  <input
                    type="text"
                    value={coachingInput}
                    onChange={(e) => setCoachingInput(e.target.value)}
                    placeholder="E.g., We enforce schema-isolated boundaries with RLS and support Snowflake export..."
                    className="cyber-input flex-1"
                  />
                  <button type="submit" className="btn-cyber btn-cyber-emerald p-2.5">
                    <Send size={14} />
                  </button>
                </form>
              </div>

              {/* Coaching Feedback Dashboard */}
              <div className="glass-panel p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Sales Coach Assessment</span>
                  <span className="badge badge-purple">AI Trainer Grader</span>
                </div>

                {coachingFeedback === null ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs">
                    <GraduationCap size={48} className="text-slate-800 mb-3 animate-pulse" />
                    <span>Type and send a message response to Sarah on the left screen. Your AI Sales Coach will score your answer in real time.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-black text-amber-400">{coachingFeedback.score}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">Coaching Turn Score</span>
                        <span className="text-[10px] text-slate-500 font-mono">Skill Metrics: objection handling</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Coach Critique:</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-850 p-4 rounded-lg">
                        {coachingFeedback.critique}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Recommended Action:</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-850 p-4 rounded-lg border-l-2 border-l-amber-400">
                        {coachingFeedback.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 8: M10 GOVERNANCE & DATA CLOUD */}
          {activeTab === "compliance" && (
            <div className="w-full h-full overflow-y-auto">
              <M10TabSwitcher />
            </div>
          )}

        </div>
      </main>
      )}
      
    </div>
  );
}

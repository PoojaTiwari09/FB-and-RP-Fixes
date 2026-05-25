"use client";

import React, { useState, useEffect } from "react";
import DealDriversApp from "../modules/m04-deal-intelligence/src/DealDriversApp";
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

// Mock Data representing M1-M10 modules records
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
                  onClick={() => setActiveTab(tab.id)}
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

      {/* MAIN COMMAND PLATFORM */}
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
          {activeTab === "calls" && (
            <div className="grid grid-cols-3 gap-8">
              
              {/* Call Library Directory (M1 Ingestion) */}
              <div className="col-span-1 glass-panel p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-200">M1 Interaction Library</h3>
                  <p className="text-[11px] text-slate-400">Captured native calls and integrations feed.</p>
                </div>
                
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search transcripts or tracker..."
                    className="cyber-input pl-9"
                    defaultValue="Sarah expansion review"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {mockCalls.map((call) => {
                    const isSelected = selectedCall.id === call.id;
                    return (
                      <button
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`p-4 rounded-lg text-left transition-all border ${
                          isSelected
                            ? "bg-slate-900 border-cyan-500/40"
                            : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-200 truncate">{call.title}</span>
                          <span className={`badge ${call.status === "Processed" ? "badge-cyan" : "badge-amber"}`}>
                            {call.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                          <span>{call.date}</span>
                          <span>Duration: {call.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Call Player, Transcript & Grader (M2 Intelligence) */}
              <div className="col-span-2 flex flex-col gap-6">
                
                {/* Audio player block */}
                <div className="glass-panel p-6 flex flex-col gap-4 bg-gradient-to-r from-slate-950/60 to-slate-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">{selectedCall.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Attendees: {selectedCall.attendees.join(" • ")}</span>
                    </div>
                    <span className="badge badge-purple">M2 CI Graded</span>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                    <button
                      onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                      className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/10 cursor-pointer"
                    >
                      {isAudioPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>{isAudioPlaying ? "0:14" : "0:00"}</span>
                        <span>{selectedCall.duration}</span>
                      </div>
                    </div>

                    <Volume2 size={16} className="text-slate-400" />
                  </div>
                </div>

                {/* Scorecard Grading Sidebar & Transcript Bubbles */}
                <div className="grid grid-cols-3 gap-6 flex-1">
                  
                  {/* Transcript panel */}
                  <div className="col-span-2 glass-panel p-6 flex flex-col gap-4 max-h-[360px] overflow-y-auto">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-900 pb-2">
                      M2 Ingested Transcript
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                      {selectedCall.transcript.map((item, index) => (
                        <div key={index} className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">{item.speaker}</span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900/80">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grading details */}
                  <div className="col-span-1 glass-panel p-6 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-900 pb-2">
                      M2 CI Scorecard
                    </h4>

                    <div className="flex items-center justify-between p-3 rounded bg-purple-500/5 border border-purple-500/20">
                      <span className="text-xs text-slate-300">Auditor Grade:</span>
                      <span className="text-sm font-black text-purple-400">{selectedCall.scorecard.auditorGrade}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Extracted Themes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCall.scorecard.themes.map((theme, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Buying Signals:</span>
                      <div className="flex flex-col gap-1">
                        {selectedCall.scorecard.buyingSignals.map((sig, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

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
            <div className="w-full h-full overflow-y-auto">
              <DealDriversApp />
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
            <div className="grid grid-cols-2 gap-8">
              
              {/* Compliance Policy Toggle Panel */}
              <div className="glass-panel p-6 flex flex-col gap-6 h-fit">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-200">M10 Compliance Controls</h3>
                  </div>
                  <span className="badge badge-emerald">Active Governance</span>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { label: "GDPR Regional Enforcement", desc: "Require explicit opt-in consent parameters for EU contacts prior to sales messaging.", val: gdprToggle, set: setGdprToggle },
                    { label: "CCPA Restriction Gates", desc: "Automatically sync opt-out sale flags and prevent California contact dispatches.", val: ccpaToggle, set: setCcpaToggle },
                    { label: "Fail-Closed Safety Mode", desc: "Immediately block actions if contact communication opt-out state is missing or timed out.", val: failClosedToggle, set: setFailClosedToggle }
                  ].map((policy, i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-xs font-bold text-slate-200">{policy.label}</span>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{policy.desc}</p>
                      </div>
                      
                      <label className="cyber-switch flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={policy.val}
                          onChange={(e) => policy.set(e.target.checked)}
                        />
                        <span className="cyber-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Cloud Warehouse Connector sync */}
              <div className="flex flex-col gap-6">
                
                {/* Connector stats card */}
                <div className="glass-panel p-6 flex flex-col gap-4 bg-gradient-to-tr from-slate-950/60 to-slate-900/30">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-cyan-400 animate-beacon" />
                      <h3 className="text-sm font-bold text-slate-200">M10 Data Cloud Adapter</h3>
                    </div>
                    <span className="badge badge-cyan">Snowflake</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Export status:</span>
                      <span className="text-xs font-bold text-slate-200">{isExporting ? "Synchronizing..." : exportStatus}</span>
                    </div>

                    <div className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Checkpoint cursor:</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">2026-05-19 02:00 UTC</span>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={runDataCloudSync}
                      disabled={isExporting}
                      className="btn-cyber btn-cyber-cyan cursor-pointer"
                    >
                      {isExporting ? <RefreshCw size={12} className="animate-spin text-cyan-400" /> : <RefreshCw size={12} />}
                      <span>Trigger Daily Export Job</span>
                    </button>
                  </div>
                </div>

                {/* Ingestion logs */}
                <div className="glass-panel p-5 flex flex-col gap-3 h-56 bg-slate-950/80">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <Lock size={12} className="text-slate-500" />
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Lock & Sync Execution Ledger</span>
                  </div>

                  <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 font-mono text-[9px] leading-relaxed pr-2 text-slate-400">
                    {exportLogs.length === 0 ? (
                      <span className="text-slate-600 text-center block pt-8">Click &quot;Trigger Daily Export Job&quot; to see the active sync process simulation.</span>
                    ) : (
                      exportLogs.map((log, i) => (
                        <div
                          key={i}
                          className={`p-1.5 rounded ${
                            log.startsWith("✓")
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 font-bold border"
                              : log.includes("Lock acquired")
                              ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-400 border"
                              : "bg-slate-900/30 text-slate-400"
                          }`}
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>
      
    </div>
  );
}

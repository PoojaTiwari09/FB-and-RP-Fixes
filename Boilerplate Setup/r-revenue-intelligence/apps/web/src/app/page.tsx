"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Activity, 
  MessageSquare, 
  PhoneCall, 
  Download, 
  Send, 
  FileText, 
  Database, 
  Cpu, 
  Layers, 
  Bot,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";
import { BaseEvent } from "shared-types";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Home() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! I am your LLaMA 3.3 AI Copilot. Ask me anything about your team's live call analytics or sales performance." }
  ]);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<BaseEvent[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Set client flag to prevent NextJS hydration errors with local logs
  useEffect(() => {
    setIsClient(true);
    // Push an initial workspace integration event using our Shared Types!
    const initEvent: BaseEvent = {
      eventId: "evt_01j9a45v",
      version: "1.0.0",
      tenantId: "tenant_acme_001",
      occurredAt: new Date().toISOString(),
      correlationId: "corr_01j9a",
      traceId: "trc_982b"
    };
    setLogs([initEvent]);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate Groq AI response
    setTimeout(() => {
      let botText = "Analyzing that query using LLaMA 3.3 70B on Groq...";
      if (input.toLowerCase().includes("arr") || input.toLowerCase().includes("revenue")) {
        botText = "Your Annual Recurring Revenue (ARR) is currently at $12.4M, pacing +18% QoQ. Key drivers include Acme Corp's enterprise expansion.";
      } else if (input.toLowerCase().includes("call") || input.toLowerCase().includes("transcription")) {
        botText = "Live capture rate is at 98.4%. AssemblyAI is actively transcribing 3 calls on the sales floor with an average accuracy of 96.2%.";
      } else if (input.toLowerCase().includes("deal") || input.toLowerCase().includes("pipeline")) {
        botText = "Top deal risk detected: Globex Inc's renewal shows -12% engagement. Recommended action: schedule a sync with the account manager.";
      } else {
        botText = "I've scanned the live workspace. Your team's average sentiment score is 8.4/10, and transcription services are running smoothly under optimal CPU limits.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: botText }]);

      // Log a new type-safe event to our audit stream
      const newEvent: BaseEvent = {
        eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
        version: "1.0.0",
        tenantId: "tenant_acme_001",
        occurredAt: new Date().toISOString()
      };
      setLogs(prev => [newEvent, ...prev]);
    }, 1000);
  };

  // Export to Excel (using SheetJS)
  const exportToExcel = () => {
    const data = [
      { Metric: "Annual Recurring Revenue", Value: "$12,480,000", Change: "+18.2%", Status: "Optimal" },
      { Metric: "Call Capture & ASR Rate", Value: "98.4%", Change: "+2.1%", Status: "Optimal" },
      { Metric: "Average Insight Score", Value: "8.7 / 10", Change: "+0.5%", Status: "Healthy" },
      { Metric: "Sales Engagement Action", Value: "84.2%", Change: "+4.6%", Status: "Stable" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Metrics Report");
    XLSX.writeFile(workbook, "RRI_Revenue_Metrics_Report.xlsx");
  };

  // Export to PDF (using jsPDF & html2canvas)
  const exportToPDF = () => {
    const element = document.getElementById("dashboard-content");
    if (!element) return;

    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("RRI_Executive_Analytics_Report.pdf");
    });
  };

  return (
    <main className="min-h-screen bg-[#090b11] text-[#f1f3f9] font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glowing Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

      {/* Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0d0f17]/70 border-b border-indigo-950/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              R-Revenue Intelligence
            </h1>
            <p className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-semibold">
              Modular Monolith Core Framework
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Stack Online
          </span>

          <div className="flex gap-2">
            <button 
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/40 border border-indigo-800/30 text-xs font-medium text-indigo-200 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
            <button 
              onClick={exportToPDF} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Executive PDF
            </button>
          </div>
        </div>
      </header>

      {/* Grid Dashboard Content */}
      <div id="dashboard-content" className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Metrics & Live Feeds */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Title */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Executive Workspace</h2>
            <p className="text-sm text-slate-400">Real-time pipeline monitoring, call transcription services, and AI scoring logs.</p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* KPI 1 */}
            <div className="bg-[#0e111b] border border-indigo-950/40 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-800/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-xl group-hover:bg-indigo-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual Recurring Revenue</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">+18.2%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">$12.4M</span>
                <span className="text-xs text-indigo-400/80">ARR Pacing</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                <span>Target: $15M by Q4</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#0e111b] border border-indigo-950/40 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-800/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-xl group-hover:bg-violet-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Call Capture & ASR</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">98.4%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">412 calls</span>
                <span className="text-xs text-violet-400/80">Live stream</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <Activity className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                <span>Managed by Transcription FastAPI</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#0e111b] border border-indigo-950/40 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-800/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/5 rounded-full blur-xl group-hover:bg-pink-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insight Sentiment Score</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">8.7/10</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">Positive</span>
                <span className="text-xs text-pink-400/80">Avg sentiment</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                <span>Computed via Groq LLaMA 3</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#0e111b] border border-indigo-950/40 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-800/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales Engagement rate</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">84.2%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">HubSpot</span>
                <span className="text-xs text-blue-400/80">Connected</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Syncs with AI Layer Orchestrations</span>
              </div>
            </div>
          </div>

          {/* Call Transcription Stream */}
          <div className="bg-[#0e111b] border border-indigo-950/40 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-500" />
                Live Call Capture Feeds
              </h3>
              <span className="text-xs text-slate-500">FastAPI backend services actively logging</span>
            </div>
            
            <div className="space-y-3">
              <div className="bg-[#090b11] border border-indigo-950/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Acme Corp - Discovery Call</h4>
                  <p className="text-xs text-slate-500">ASR Active: transcribing speech dynamically...</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  Transcribing
                </span>
              </div>

              <div className="bg-[#090b11] border border-indigo-950/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Globex Inc - Renewal Pricing Negotiation</h4>
                  <p className="text-xs text-slate-500">Finished processing, uploading transcript to PostgreSQL...</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                  Saving to DB
                </span>
              </div>
            </div>
          </div>

          {/* Monorepo Workspace Verification Audit Log */}
          <div className="bg-[#0e111b] border border-indigo-950/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Monorepo Workspace Audit Stream (Type-Safe: shared-types)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Below logs utilize the <code>BaseEvent</code> interface imported from the shared package 
              <code>packages/shared-types</code> to guarantee zero compile drift across frontend & backend.
            </p>
            <div className="bg-[#090b11] rounded-xl p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-slate-500 border border-indigo-950/40 space-y-1">
              {isClient && logs.map((log) => (
                <div key={log.eventId} className="flex justify-between border-b border-indigo-950/20 py-1 last:border-0 hover:text-indigo-400 transition-colors">
                  <span>[EVENT] ID: {log.eventId} | Tenant: {log.tenantId}</span>
                  <span>Occurred: {log.occurredAt.split("T")[1].slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: AI Chat Copilot */}
        <div className="bg-[#0e111b]/80 backdrop-blur-md border border-indigo-950/40 rounded-2xl p-6 flex flex-col h-[600px] relative">
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-indigo-950/40 pb-4 mb-4">
            <div className="bg-indigo-600/15 p-2 rounded-xl text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">LLaMA 3.3 Sales Copilot</h3>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Inference Node Active (Groq API)
              </p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-indigo-950">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === "user" 
                    ? "bg-indigo-600 text-white rounded-br-none" 
                    : "bg-[#090b11] border border-indigo-950/40 text-slate-300 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-600 mt-1 uppercase tracking-widest font-bold">
                  {msg.sender === "user" ? "You" : "LLaMA 3.3"}
                </span>
              </div>
            ))}
          </div>

          {/* Footer input */}
          <div className="mt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Ask about ARR, Call transcriptions..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-[#090b11] border border-indigo-950/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-800 transition-colors"
            />
            <button 
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}

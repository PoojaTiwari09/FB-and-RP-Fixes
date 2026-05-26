"use client";

import { useState, Suspense } from "react";

function HubSpotConnectInner() {
  const [token, setToken]       = useState("");
  const [status, setStatus]     = useState<"idle"|"connecting"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConnect() {
    if (!token.trim()) { setErrorMsg("Please enter your Private App token."); return; }
    setStatus("connecting");
    setErrorMsg("");
    try {
      // Validate the token against HubSpot
      const testRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals?limit=1&properties=dealname", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (testRes.status === 401 || testRes.status === 403) {
        setErrorMsg("Invalid token or insufficient scopes. Make sure your Private App has CRM read access.");
        setStatus("error");
        return;
      }
      if (!testRes.ok) {
        setErrorMsg(`HubSpot API error (${testRes.status}). Check your token and try again.`);
        setStatus("error");
        return;
      }

      // Store the token via our API
      const saveRes = await fetch("/api/hubspot/mock-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!saveRes.ok) throw new Error("Failed to save token.");

      setStatus("success");
      setTimeout(() => { window.location.href = "/datasets?hubspot_success=true"; }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Connection failed.");
      setStatus("error");
    }
  }

  async function handleDemo() {
    setStatus("connecting");
    await fetch("/api/hubspot/mock-connect", { method: "POST" });
    window.location.href = "/datasets?hubspot_success=true";
  }

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", backgroundColor:"#f5f8fa", fontFamily:"Lexend, sans-serif" }}>
      <div style={{ backgroundColor:"white", padding:"40px", borderRadius:"12px", boxShadow:"0 4px 24px rgba(0,0,0,0.12)", maxWidth:"460px", width:"100%" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ width:56, height:56, backgroundColor:"#FF7A59", borderRadius:"12px", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 style={{ color:"#33475b", margin:"0 0 8px", fontSize:22, fontWeight:700 }}>Connect HubSpot</h2>
          <p style={{ color:"#516f90", margin:0, fontSize:14 }}>
            Enter your HubSpot Private App token to sync your real CRM data.
          </p>
        </div>

        {/* Token input */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#33475b", marginBottom:6 }}>
            Private App Access Token
          </label>
          <input
            type="password"
            placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={token}
            onChange={e => { setToken(e.target.value); setErrorMsg(""); }}
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #cbd6e2", borderRadius:6, fontSize:14, color:"#33475b", outline:"none", boxSizing:"border-box" }}
            onKeyDown={e => e.key === "Enter" && handleConnect()}
          />
        </div>

        {errorMsg && (
          <div style={{ backgroundColor:"#fff3f3", border:"1px solid #fca5a5", borderRadius:6, padding:"10px 12px", marginBottom:16, color:"#dc2626", fontSize:13 }}>
            {errorMsg}
          </div>
        )}

        {status === "success" && (
          <div style={{ backgroundColor:"#f0fdf4", border:"1px solid #86efac", borderRadius:6, padding:"10px 12px", marginBottom:16, color:"#16a34a", fontSize:13, fontWeight:600 }}>
            ✓ Connected! Redirecting...
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={status === "connecting" || status === "success"}
          style={{ width:"100%", padding:"12px", backgroundColor: status==="connecting"||status==="success" ? "#ffa585" : "#FF7A59", color:"white", border:"none", borderRadius:6, fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:12 }}
        >
          {status === "connecting" ? "Connecting..." : status === "success" ? "Connected!" : "Connect with Token"}
        </button>

        <div style={{ textAlign:"center", color:"#7c98b6", fontSize:12, marginBottom:16 }}>— or —</div>

        <button
          onClick={handleDemo}
          disabled={status === "connecting" || status === "success"}
          style={{ width:"100%", padding:"12px", backgroundColor:"white", color:"#516f90", border:"1px solid #cbd6e2", borderRadius:6, fontSize:14, fontWeight:600, cursor:"pointer" }}
        >
          Use Demo Data (no account needed)
        </button>

        {/* Instructions */}
        <div style={{ marginTop:24, padding:"16px", backgroundColor:"#f5f8fa", borderRadius:8, fontSize:12, color:"#516f90", lineHeight:"1.6" }}>
          <strong style={{ color:"#33475b" }}>How to get your token:</strong>
          <ol style={{ margin:"8px 0 0", paddingLeft:20 }}>
            <li>Go to your HubSpot account → <strong>Settings</strong></li>
            <li>Navigate to <strong>Integrations → Private Apps</strong></li>
            <li>Click <strong>Create a private app</strong></li>
            <li>Under <strong>Scopes</strong>, enable: <em>crm.objects.deals.read, crm.objects.contacts.read, crm.objects.companies.read</em></li>
            <li>Click <strong>Create app</strong> → copy the token</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function HubSpotConnect() {
  return (
    <Suspense fallback={<div style={{ padding:"24px", textAlign:"center" }}>Loading...</div>}>
      <HubSpotConnectInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DatasetDefinition,
  ObjectKey,
  Relationship,
  SourceMode,
  validateDatasetDefinition,
} from "../lib/sample-data";
import { useSearchParams, useRouter } from "next/navigation";
import { ModuleNavLinks } from "./ModuleNavLinks";

// Priority fields to auto-select per object when HubSpot connects
const PRIORITY_FIELDS: Record<string, string[]> = {
  deals:     ["dealname", "amount", "dealstage", "closedate", "hubspot_owner_id", "deal_score"],
  companies: ["name", "domain", "annualrevenue", "city", "country"],
  contacts:  ["firstname", "lastname", "email", "phone"],
};

function autoSelectFields(objectName: string, availableFields: any[]): string[] {
  const priority = PRIORITY_FIELDS[objectName] ?? [];
  const available = availableFields.map((f: any) => f.fieldName);
  const picked = priority.filter(f => available.includes(f));
  if (picked.length < 6) {
    const rest = available.filter(f => !picked.includes(f));
    picked.push(...rest.slice(0, 6 - picked.length));
  }
  return picked;
}

export function DatasetBuilderClient() {
  // Source mode: which CRM / schema the user picked
  // 'hubspot'  → live HubSpot API
  // 'mock'     → crm_mock schema (Northwind, Globex, etc.)
  // 'postgres' → public.deal schema (same as the built-in revenue feed)
  const [dataSourceMode, setDataSourceMode] = useState<'hubspot' | 'mock' | 'postgres' | null>(null);

  const [savedDatasets, setSavedDatasets]   = useState<DatasetDefinition[]>([]);
  const [step, setStep]                     = useState<1 | 2 | 3 | 4>(1);
  const [name, setName]                     = useState("Revenue Dataset");
  const [sourceMode, setSourceMode]         = useState<DatasetDefinition["sourceMode"]>("COMBINED");
  const [selectedObjects, setSelectedObjects] = useState<ObjectKey[]>([]);
  const [selectedFields, setSelectedFields]   = useState<Record<string, string[]>>({});
  const [relationships, setRelationships]     = useState<Relationship[]>([]);
  const [mappingAccepted, setMappingAccepted] = useState(false);
  const [saveMessage, setSaveMessage]         = useState("");
  const [isConnecting, setIsConnecting]         = useState(false);
  const [isSyncing, setIsSyncing]               = useState(false);
  const [syncMessage, setSyncMessage]           = useState("");
  const [isRefreshingFields, setIsRefreshingFields] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen]     = useState(false);
  // True while we're checking for an existing connection on mount —
  // prevents the "Choose Source" screen from flashing before we know the state
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // CRM metadata from DB
  const [dbObjects, setDbObjects]           = useState<any[]>([]);
  const [dbFields, setDbFields]             = useState<Record<string, any[]>>({});
  const [dbRelationships, setDbRelationships] = useState<any[]>([]);

  // Field search per object in Step 2
  const [fieldSearch, setFieldSearch] = useState<Record<string, string>>({});

  // Active object tab in Step 2 (one panel per object)
  const [activeObjectTab, setActiveObjectTab] = useState<string>('');

  // Preview data from Postgres (real deal rows)
  const [previewRows, setPreviewRows]       = useState<any[]>([]);

  const searchParams = useSearchParams();
  const router       = useRouter();

  // ─── Step unlock rules ───────────────────────────────────────────────────────
  const hasObjects       = selectedObjects.length > 0;
  const hasFields        = hasObjects && Object.values(selectedFields).some(f => f.length > 0);
  const canGoToStep = (s: number) => {
    if (s === 1) return true;
    if (s === 2) return hasObjects;
    if (s === 3) return hasFields;
    if (s === 4) return hasFields; // can preview anytime after fields
    return false;
  };

  // ─── Load on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/datasets').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSavedDatasets(d);
    }).catch(console.error);

    const success = searchParams.get('hubspot_success');
    if (success) {
      handleOAuthSuccess();
    } else {
      checkExistingConnection();
    }
  }, []);

  async function checkExistingConnection() {
    setIsCheckingConnection(true);
    try {
      const res  = await fetch('/api/hubspot');
      const data = await res.json();
      if (data.connected && data.dataSource) {
        const mode = data.dataSource.sourceName?.includes('Mock') ? 'mock' : 'hubspot';
        setDataSourceMode(mode);
        loadMetadata(data);
      }
    } catch (e) { console.error(e); }
    finally { setIsCheckingConnection(false); }
  }

  async function handleOAuthSuccess() {
    setIsConnecting(true);
    setIsCheckingConnection(true);
    try {
      const res  = await fetch('/api/hubspot');
      const data = await res.json();
      if (data.connected && data.dataSource) {
        setDataSourceMode('hubspot');
        loadMetadata(data);
      }
      router.replace('/datasets');
    } catch (e) { console.error(e); }
    finally {
      setIsConnecting(false);
      setIsCheckingConnection(false);
    }
  }

  function loadMetadata(data: any) {
    const objects = data.dataSource.objects || data.dataSource.crmObjects || [];
    setDbObjects(objects);

    const fieldsMap: Record<string, any[]> = {};
    objects.forEach((obj: any) => { fieldsMap[obj.objectName] = obj.fields || []; });
    setDbFields(fieldsMap);

    // Auto-select sensible default fields from real data
    const autoFields: Record<string, string[]> = {};
    objects.forEach((obj: any) => {
      autoFields[obj.objectName] = autoSelectFields(obj.objectName, obj.fields || []);
    });
    setSelectedObjects(objects.map((o: any) => o.objectName));
    setSelectedFields(autoFields);

    if (data.relationships?.length) {
      const mapped = data.relationships.map((r: any) => ({
        sourceObject: objects.find((o: any) => o.id === r.sourceObjectId)?.objectName || r.sourceObjectId,
        targetObject: objects.find((o: any) => o.id === r.targetObjectId)?.objectName || r.targetObjectId,
        sourceField:  r.sourceField,
        targetField:  r.targetField,
        status:       "AUTO_DETECTED",
      }));
      setDbRelationships(mapped);
      setRelationships(mapped);
      // Auto-accept when relationships are system-detected from OAuth
      setMappingAccepted(true);
    }
  }

  // ─── Load preview rows (HubSpot live OR Postgres mock) ───────────────────────
  useEffect(() => {
    if (step === 4) {
      const source        = dataSourceMode === 'hubspot' ? 'hubspot' : dataSourceMode === 'postgres' ? 'postgres' : 'mock';
      const allFields     = Object.values(selectedFields).flat();
      const primaryObject = selectedObjects[0] || 'deals';  // first selected object is anchor
      const params        = new URLSearchParams({
        source,
        fields:        allFields.join(','),
        primaryObject,
        limit:         '10',
      });
      fetch(`/api/datasets/preview?${params}`)
        .then(r => r.json())
        .then(data => {
          // Handle both new shape { rows, hasMore } and legacy bare array
          const rows = Array.isArray(data) ? data : (Array.isArray(data.rows) ? data.rows : []);
          setPreviewRows(rows);
        })
        .catch(console.error);
    }
  }, [step, dataSourceMode]);

  // ─── Preview: map Postgres rows to selected HubSpot fields ───────────────────
  // Postgres field → HubSpot field name mapping
  const POSTGRES_TO_HUBSPOT: Record<string, string> = {
    dealName:    "dealname",
    amount:      "amount",
    stage:       "dealstage",
    ownerName:   "hubspot_owner_id",
    accountName: "name",          // companies.name
    quarter:     "closedate",
    closeDate:   "closedate",
  };
  // Reverse: HubSpot fieldName → value from Postgres row
  const HUBSPOT_TO_POSTGRES: Record<string, string> = Object.fromEntries(
    Object.entries(POSTGRES_TO_HUBSPOT).map(([pg, hs]) => [hs, pg])
  );

  const allSelectedFields = Object.values(selectedFields).flat();
  const preview = useMemo(() => {
    if (!previewRows.length) return [];
    // HubSpot rows already come back keyed by the exact field name selected.
    // Postgres rows need the HUBSPOT_TO_POSTGRES remap.
    return previewRows.slice(0, 5).map(row => {
      if (dataSourceMode === 'hubspot') {
        // Row keys already match selected field names — use directly
        const out: Record<string, any> = {};
        allSelectedFields.forEach(f => { out[f] = row[f] ?? "-"; });
        return out;
      }
      // Mock/Postgres — remap via HUBSPOT_TO_POSTGRES
      const out: Record<string, any> = {};
      allSelectedFields.forEach(hsField => {
        const pgField = HUBSPOT_TO_POSTGRES[hsField] ?? hsField;
        out[hsField] = row[pgField] ?? row[hsField] ?? "-";
      });
      return out;
    });
  }, [previewRows, selectedFields, dataSourceMode]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validation = useMemo(
    () => validateDatasetDefinition({ selectedFields, relationships }, dbFields),
    [selectedFields, relationships, dbFields],
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────
  function toggleObject(name: string) {
    const key = name as ObjectKey;
    setSelectedObjects(cur =>
      cur.includes(key) ? cur.filter(x => x !== key) : [...cur, key]
    );
    // Clear fields for deselected object
    if (selectedObjects.includes(key)) {
      setSelectedFields(cur => { const n = { ...cur }; delete n[name]; return n; });
    }
  }

  function toggleField(obj: string, field: string) {
    setSelectedFields(cur => {
      const fields = cur[obj] ?? [];
      return { ...cur, [obj]: fields.includes(field) ? fields.filter(f => f !== field) : [...fields, field] };
    });
  }

  function toggleAllFields(obj: string, allFields: any[]) {
    setSelectedFields(cur => {
      const current = cur[obj] ?? [];
      const allNames = allFields.map((f: any) => f.fieldName);
      const allSelected = allNames.every(f => current.includes(f));
      return { ...cur, [obj]: allSelected ? [] : allNames };
    });
  }

  async function connectMock() {
    setIsConnecting(true);
    try {
      const res  = await fetch('/api/hubspot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDataSourceMode('mock');
        await checkExistingConnection();
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e) { console.error(e); }
    setIsConnecting(false);
  }

  // Revenue Postgres: uses public.deal table — same as the built-in revenue feed but
  // lets you bind widgets explicitly to this source so they don't mix with mock data.
  async function connectPostgres() {
    setIsConnecting(true);
    try {
      const res  = await fetch('/api/hubspot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDataSourceMode('postgres');
        await checkExistingConnection();
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e) { console.error(e); }
    setIsConnecting(false);
  }

  async function disconnect() {
    await fetch('/api/hubspot', { method: 'DELETE' });
    setDataSourceMode(null);
    setIsCheckingConnection(false); // not checking — user intentionally disconnected
    setDbObjects([]); setDbFields({}); setDbRelationships([]);
    setSelectedObjects([]); setSelectedFields({}); setRelationships([]);
    setSyncMessage(""); setIsBuilderOpen(false);
    window.location.href = '/datasets';
  }

  async function syncHubspot(mode: 'incremental' | 'full' = 'incremental') {
    setIsSyncing(true);
    setSyncMessage(mode === 'full' ? "Running full sync from HubSpot…" : "Syncing new/updated deals from HubSpot…");
    try {
      const res  = await fetch(`/api/hubspot/sync?mode=${mode}`, { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.success ? `✓ ${data.message}` : "Sync failed: " + (data.error || "Unknown"));
    } catch (e: any) { setSyncMessage("Sync error: " + e.message); }
    setIsSyncing(false);
  }

  async function refreshFields() {
    setIsRefreshingFields(true);
    setSyncMessage("Refreshing fields from HubSpot...");
    try {
      const res  = await fetch('/api/hubspot/refresh-fields', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`✓ ${data.message}`);
        // Reload metadata so the UI reflects the new fields immediately
        await checkExistingConnection();
      } else {
        setSyncMessage("Refresh failed: " + (data.error || "Unknown"));
      }
    } catch (e: any) { setSyncMessage("Refresh error: " + e.message); }
    setIsRefreshingFields(false);
  }

  async function handleSaveDataset() {
    // Allow save if no relationships exist OR user has accepted the mapping
    const hasRelationshipsToCheck = dbRelationships.filter(
      r => selectedObjects.includes(r.sourceObject) && selectedObjects.includes(r.targetObject)
    ).length > 0;
    if (hasRelationshipsToCheck && !mappingAccepted) {
      setSaveMessage("Please go to the Relationships step and check the mapping confirmation box.");
      return;
    }
    // Store the actual data source as sourceMode so loadDatasetIntoCache can route correctly:
    //   'hubspot'  → live HubSpot API
    //   'mock'     → crm_mock schema  (Northwind, Globex, etc. — separate from public data)
    //   'postgres' → public.deal table (same as built-in revenue feed)
    // Legacy 'COMBINED' / 'CRM_ONLY' etc. values are never written anymore.
    const canonicalSource: SourceMode =
      dataSourceMode === 'hubspot'  ? 'hubspot'  :
      dataSourceMode === 'postgres' ? 'postgres' : 'mock';
    const dataset: DatasetDefinition = {
      id: `dataset-${Date.now()}`,
      name,
      sourceMode: canonicalSource,
      selectedObjects,
      selectedFields, relationships, mappingAccepted,
      createdAt: new Date().toISOString(),
    };
    setSaveMessage("Saving...");
    try {
      const res  = await fetch('/api/datasets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataset) });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(`✓ Dataset "${name}" saved successfully!`);
        const list = await fetch('/api/datasets').then(r => r.json());
        if (Array.isArray(list)) setSavedDatasets(list);
        setTimeout(() => setIsBuilderOpen(false), 1500);
      } else {
        setSaveMessage("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) { setSaveMessage("Error: " + e.message); }
  }

  // ─── Tab navigation helper ────────────────────────────────────────────────────
  function goToStep(s: 1 | 2 | 3 | 4) {
    if (!canGoToStep(s)) return;
    // When entering the Fields step, default the active object tab
    // to the first selected object if none is set yet
    if (s === 2 && selectedObjects.length > 0) {
      setActiveObjectTab(prev =>
        selectedObjects.includes(prev as ObjectKey) ? prev : selectedObjects[0]
      );
    }
    setStep(s);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="shell shell-wide grid">
      {/* Hero */}
      <section className="hero">
        <p>Create Dataset</p>
        <h1>Model CRM, calls, transcription, or combined datasets</h1>
        <p>Build the dataset first, validate mappings, preview the joined result, then save it before creating a dashboard.</p>
        <div className="actions">
          <ModuleNavLinks />
          <Link href="/dashboards" className="secondary">Go To Dashboard Builder</Link>
        </div>
      </section>

      {/* ── While checking connection: spinner ── */}
      {isCheckingConnection ? (
        <section className="card stack" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Checking your data source connection…</p>
        </section>

      /* ── Step 0: Choose source — only shown when confirmed no connection ── */
      ) : !dataSourceMode ? (
        <section className="card stack" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Choose Your Data Source</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Connect HubSpot to use your real CRM data, or use Mock data for testing.</p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* HubSpot */}
            <div style={{ border: '2px solid #FF7A59', borderRadius: '16px', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
              <span style={{ fontSize: '40px' }}>🟠</span>
              <h3 style={{ margin: 0 }}>HubSpot CRM</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>Uses your real HubSpot account — real objects, real fields, real deals</p>
              <button
                className="primary"
                style={{ backgroundColor: '#FF7A59', borderColor: '#FF7A59', width: '100%' }}
                disabled={isConnecting}
                onClick={() => { window.location.href = '/api/hubspot/authorize'; }}
              >
                {isConnecting ? "Redirecting..." : "Connect HubSpot"}
              </button>
            </div>

            {/* Mock CRM */}
            <div style={{ border: '2px solid #94a3b8', borderRadius: '16px', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
              <span style={{ fontSize: '40px' }}>🗄️</span>
              <h3 style={{ margin: 0 }}>Mock CRM Data</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>crm_mock schema — Northwind, Globex, Initech and 12 other companies</p>
              <button
                className="secondary"
                style={{ width: '100%' }}
                disabled={isConnecting}
                onClick={connectMock}
              >
                {isConnecting ? "Connecting..." : "Use Mock CRM"}
              </button>
            </div>

            {/* Revenue Postgres */}
            <div style={{ border: '2px solid #94a3b8', borderRadius: '16px', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
              <span style={{ fontSize: '40px' }}>📊</span>
              <h3 style={{ margin: 0 }}>Revenue Postgres Data</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>public.deal schema — your internal revenue deals (same as the built-in feed)</p>
              <button
                className="secondary"
                style={{ width: '100%' }}
                disabled={isConnecting}
                onClick={connectPostgres}
              >
                {isConnecting ? "Connecting..." : "Use Revenue Data"}
              </button>
            </div>

          </div>
        </section>

      /* ── Datasets list ── */
      ) : !isBuilderOpen ? (
        <section className="card stack">
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2>Your Datasets</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                Source: {dataSourceMode === 'hubspot' ? '🟠 HubSpot CRM (Live)' : dataSourceMode === 'postgres' ? '📊 Revenue Postgres Data' : '🗄️ Mock CRM Data'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Sync + Refresh buttons — only for HubSpot */}
              {dataSourceMode === 'hubspot' && (
                <>
                  <button
                    className="secondary"
                    disabled={isRefreshingFields}
                    title="Re-fetch all field definitions from your HubSpot account (deals, companies, contacts)"
                    onClick={refreshFields}
                  >
                    {isRefreshingFields ? "Refreshing..." : "🔄 Refresh Fields"}
                  </button>
                  <button
                    className="secondary"
                    disabled={isSyncing}
                    style={{ backgroundColor: '#22c55e', color: 'white', borderColor: '#22c55e' }}
                    onClick={() => syncHubspot('incremental')}
                    title="Fetch only new / recently changed deals (fast)"
                  >
                    {isSyncing ? "Syncing…" : "⚡ Sync New Deals"}
                  </button>
                  <button
                    className="secondary"
                    disabled={isSyncing}
                    style={{ backgroundColor: '#0ea5e9', color: 'white', borderColor: '#0ea5e9' }}
                    onClick={() => syncHubspot('full')}
                    title="Fetch ALL deals and remove any deleted from HubSpot (slower)"
                  >
                    {isSyncing ? "Syncing…" : "🔄 Full Sync"}
                  </button>
                </>
              )}
              {/* Disconnect — only for HubSpot */}
              {dataSourceMode === 'hubspot' && (
                <button className="secondary" onClick={disconnect}>Disconnect CRM</button>
              )}
              {/* Switch source — for mock */}
              {dataSourceMode === 'mock' && (
                <button className="secondary" onClick={disconnect}>Switch Source</button>
              )}
              <button className="primary" onClick={() => { setIsBuilderOpen(true); setStep(1); }}>+ Create Dataset</button>
            </div>
          </div>

          {syncMessage && (
            <p style={{ color: syncMessage.startsWith("✓") ? "#16a34a" : "#dc2626", fontSize: "14px" }}>{syncMessage}</p>
          )}
          {saveMessage && (
            <div className="success-banner">{saveMessage}</div>
          )}
          {savedDatasets.length === 0
            ? <p>No datasets yet. Click "+ Create Dataset" to begin.</p>
            : savedDatasets.map(ds => (
              <div key={ds.id} className="relationship-card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>{ds.name}</strong>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{ds.sourceMode} | Objects: {ds.selectedObjects.join(", ")}</p>
                </div>
                <button
                  title="Delete dataset"
                  onClick={async () => {
                    if (!confirm(`Delete dataset "${ds.name}"? This cannot be undone.`)) return;
                    const res = await fetch(`/api/datasets?id=${encodeURIComponent(ds.id)}`, { method: 'DELETE' });
                    if (res.ok) {
                      setSavedDatasets(prev => prev.filter(d => d.id !== ds.id));
                    } else {
                      const err = await res.json();
                      alert('Failed to delete: ' + (err.error || 'Unknown error'));
                    }
                  }}
                  style={{
                    background: 'transparent', border: '1px solid #fca5a5', color: '#ef4444',
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem',
                    flexShrink: 0, whiteSpace: 'nowrap',
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          }
        </section>

      /* ── Builder ── */
      ) : (
        <>
          {/* Tab bar */}
          <section className="card stack">
            <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Dataset Builder</h2>
              <button className="secondary" onClick={() => setIsBuilderOpen(false)}>Cancel</button>
            </div>
            <div className="stepper">
              {([
                { s: 1, label: 'Objects' },
                { s: 2, label: 'Fields' },
                { s: 3, label: 'Relationships' },
                { s: 4, label: 'Preview & Save' },
              ] as { s: 1|2|3|4; label: string }[]).map(({ s, label }) => {
                const enabled = canGoToStep(s);
                return (
                  <button
                    key={s}
                    className={step === s ? "pill active" : "pill"}
                    onClick={() => goToStep(s)}
                    disabled={!enabled}
                    title={!enabled ? "Complete the previous step first" : ""}
                    style={{ opacity: enabled ? 1 : 0.4, cursor: enabled ? 'pointer' : 'not-allowed' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Step 1: Objects ── */}
          {step === 1 && (
            <section className="builder-layout">
              <div className="card stack">
                <div className="section-head">
                  <h2>Select Objects</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{dataSourceMode === 'hubspot' ? 'From your HubSpot account' : 'From mock Postgres schema'}</span>
                    {dataSourceMode === 'hubspot' && (
                      <button
                        className="secondary"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        disabled={isRefreshingFields}
                        title="Re-fetch all fields from HubSpot without reconnecting"
                        onClick={refreshFields}
                      >
                        {isRefreshingFields ? "..." : "🔄 Refresh Fields"}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dbObjects.map(obj => (
                    <label key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', backgroundColor: selectedObjects.includes(obj.objectName) ? 'var(--bg-light)' : 'transparent' }}>
                      <input type="checkbox" checked={selectedObjects.includes(obj.objectName)} onChange={() => toggleObject(obj.objectName)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{obj.displayName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Raw name: {obj.objectName}</div>
                      </div>
                    </label>
                  ))}
                  <button type="button" className="secondary" style={{ marginTop: '8px', alignSelf: 'flex-start' }} onClick={() => setSelectedObjects([])}>Deselect all</button>
                </div>
              </div>

              <div className="card stack">
                <div className="section-head">
                  <h2>Selected Objects</h2>
                  <span>{selectedObjects.length} chosen</span>
                </div>
                {selectedObjects.length === 0
                  ? <p style={{ color: 'var(--text-light)' }}>No objects selected yet.</p>
                  : selectedObjects.map(name => (
                    <div key={name} className="relationship-card">
                      <strong>{dbObjects.find(o => o.objectName === name)?.displayName || name}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>{(dbFields[name] || []).map((f: any) => f.displayName || f.fieldName).slice(0, 5).join(", ")}{(dbFields[name]?.length ?? 0) > 5 ? ` +${(dbFields[name]?.length ?? 0) - 5} more` : ""}</p>
                    </div>
                  ))
                }
              </div>

              {/* Next button */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="primary" disabled={!hasObjects} onClick={() => goToStep(2)}>Next: Select Fields →</button>
              </div>
            </section>
          )}

          {/* ── Step 2: Fields ── */}
          {step === 2 && (() => {
            const activeObj  = activeObjectTab || selectedObjects[0] || '';
            const allFields  = dbFields[activeObj] || [];
            const search     = (fieldSearch[activeObj] || '').toLowerCase();
            const visFields  = search
              ? allFields.filter((f: any) =>
                  (f.displayName || f.fieldName).toLowerCase().includes(search) ||
                  f.fieldName.toLowerCase().includes(search))
              : allFields;
            const objLabel   = dbObjects.find(o => o.objectName === activeObj)?.displayName || activeObj;
            const selCount   = (selectedFields[activeObj] ?? []).length;
            const allChecked = visFields.length > 0 && visFields.every((f: any) => (selectedFields[activeObj] ?? []).includes(f.fieldName));

            return (
              <section className="card stack">

                {/* ── Header ── */}
                <div className="section-head">
                  <div>
                    <h2 style={{ margin: 0 }}>Select Fields</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
                      Choose fields for each object. Switch between objects using the tabs below.
                    </p>
                  </div>
                  {dataSourceMode === 'hubspot' && (
                    <button
                      className="secondary"
                      style={{ fontSize: '12px', padding: '4px 12px', whiteSpace: 'nowrap' }}
                      disabled={isRefreshingFields}
                      onClick={refreshFields}
                    >
                      {isRefreshingFields ? 'Refreshing…' : '🔄 Refresh Fields'}
                    </button>
                  )}
                </div>

                {syncMessage && (
                  <p style={{ fontSize: '13px', color: syncMessage.startsWith('✓') ? '#16a34a' : '#dc2626', margin: 0 }}>
                    {syncMessage}
                  </p>
                )}

                {/* ── Object tabs — one per selected object ── */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '2px solid var(--line)', paddingBottom: '0' }}>
                  {selectedObjects.map(objKey => {
                    const isActive  = objKey === activeObj;
                    const cnt       = (selectedFields[objKey] ?? []).length;
                    const label     = dbObjects.find(o => o.objectName === objKey)?.displayName || objKey;
                    const total     = (dbFields[objKey] || []).length;
                    return (
                      <button
                        key={objKey}
                        onClick={() => setActiveObjectTab(objKey)}
                        style={{
                          padding: '8px 18px', border: 'none', cursor: 'pointer',
                          borderRadius: '6px 6px 0 0', fontSize: '13px', fontWeight: isActive ? 600 : 400,
                          background: isActive ? 'var(--primary)' : 'var(--bg-light)',
                          color: isActive ? '#fff' : 'var(--text)',
                          borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                          marginBottom: '-2px', transition: 'all 0.15s',
                        }}
                      >
                        {label}
                        <span style={{
                          marginLeft: '6px', fontSize: '11px', padding: '1px 6px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(255,255,255,0.25)' : cnt > 0 ? 'var(--primary)' : 'var(--line)',
                          color: isActive ? '#fff' : cnt > 0 ? '#fff' : 'var(--text-light)',
                        }}>
                          {cnt}/{total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ── Active object panel ── */}
                <div style={{ border: '1px solid var(--line)', borderRadius: '0 8px 8px 8px', padding: '16px' }}>

                  {/* Toolbar: count + search + select-all */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-light)', flex: 1 }}>
                      <strong>{selCount}</strong> selected · <strong>{allFields.length}</strong> available
                      {search ? ` · ${visFields.length} matching` : ''}
                    </span>
                    {allFields.length > 0 && (
                      <button
                        className="secondary"
                        style={{ fontSize: '12px', padding: '4px 12px', whiteSpace: 'nowrap' }}
                        onClick={() => toggleAllFields(activeObj, visFields)}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                    <input
                      type="text"
                      placeholder={`Search ${objLabel} fields…`}
                      value={fieldSearch[activeObj] || ''}
                      onChange={e => setFieldSearch(prev => ({ ...prev, [activeObj]: e.target.value }))}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--line)',
                        fontSize: '13px', minWidth: '220px',
                      }}
                    />
                  </div>

                  {/* Empty / no-match / field grid */}
                  {allFields.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--text-light)' }}>
                        No fields loaded for <strong>{objLabel}</strong> yet.
                      </p>
                      {dataSourceMode === 'hubspot' ? (
                        <button className="primary" disabled={isRefreshingFields} onClick={refreshFields}>
                          {isRefreshingFields ? 'Refreshing…' : '🔄 Fetch Fields from HubSpot'}
                        </button>
                      ) : (
                        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
                          Reconnect your data source to load fields.
                        </p>
                      )}
                    </div>
                  ) : visFields.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px 0', fontSize: '13px' }}>
                      No fields match &quot;{search}&quot;
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {visFields.map((field: any) => {
                        const isChecked = (selectedFields[activeObj] ?? []).includes(field.fieldName);
                        return (
                          <label
                            key={field.fieldName}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: '8px',
                              cursor: 'pointer', padding: '8px 10px', borderRadius: '6px',
                              border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--line)'}`,
                              backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                              transition: 'all 0.1s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleField(activeObj, field.fieldName)}
                              style={{ cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '13px', fontWeight: isChecked ? 600 : 400,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {field.displayName || field.fieldName}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {field.fieldName}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Footer nav ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <button className="secondary" onClick={() => goToStep(1)}>← Back</button>
                  <button className="primary" disabled={!hasFields} onClick={() => goToStep(3)}>
                    Next: Relationships →
                  </button>
                </div>
              </section>
            );
          })()}

          {/* ── Step 3: Relationships ── */}
          {step === 3 && (
            <section className="builder-layout">
              <div className="card stack">
                <div className="section-head">
                  <h2>Check Relationships</h2>
                  <span>Choose which association paths to include</span>
                </div>
                {dbRelationships
                  .filter(r => selectedObjects.includes(r.sourceObject) && selectedObjects.includes(r.targetObject))
                  .map((r, i) => {
                    const isSelected = relationships.some(x => x.sourceObject === r.sourceObject && x.targetObject === r.targetObject && x.sourceField === r.sourceField && x.targetField === r.targetField);
                    return (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '8px', backgroundColor: isSelected ? 'var(--bg-light)' : 'transparent' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {
                          if (isSelected) setRelationships(prev => prev.filter(x => !(x.sourceObject === r.sourceObject && x.targetObject === r.targetObject && x.sourceField === r.sourceField && x.targetField === r.targetField)));
                          else setRelationships(prev => [...prev, r]);
                        }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <div>
                          <strong>{dbObjects.find(o => o.objectName === r.sourceObject)?.displayName || r.sourceObject} → {dbObjects.find(o => o.objectName === r.targetObject)?.displayName || r.targetObject}</strong>
                          <p style={{ margin: '2px 0 0', color: 'var(--text-light)', fontSize: '12px' }}>{r.sourceObject}.{r.sourceField} ➜ {r.targetObject}.{r.targetField}</p>
                        </div>
                      </label>
                    );
                  })
                }
                {dbRelationships.filter(r => selectedObjects.includes(r.sourceObject) && selectedObjects.includes(r.targetObject)).length === 0 && (
                  <p style={{ color: 'var(--text-light)' }}>No automatic relationships detected between selected objects.</p>
                )}
                <label style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mappingAccepted} onChange={e => setMappingAccepted(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <span>I checked the automatic mapping and it is OK.</span>
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button className="secondary" onClick={() => goToStep(2)}>← Back</button>
                  <button className="primary" onClick={() => goToStep(4)}>Next: Preview & Save →</button>
                </div>
              </div>
            </section>
          )}

          {/* ── Step 4: Preview & Save ── */}
          {step === 4 && (
            <section className="builder-layout">
              <div className="card stack">
                <div className="section-head">
                  <h2>Preview & Save</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Fields: {allSelectedFields.join(", ")}
                  </span>
                </div>

                <label className="field">
                  <span>Dataset name</span>
                  <input value={name} onChange={e => setName(e.target.value)} />
                </label>

                {/* Preview table — data from Postgres */}
                <div>
                  <strong>Data Preview</strong>
                  {preview.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>
                      {dataSourceMode !== 'hubspot'
                        ? 'No data in Postgres yet. Run "node seed-public.js" or use "Sync Deals from HubSpot" first.'
                        : ''}
                    </p>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? "-")}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <button className="secondary" onClick={() => goToStep(3)}>← Back</button>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <button className="primary" onClick={handleSaveDataset}>Save dataset</button>
                    {saveMessage && (
                      <p style={{ color: saveMessage.startsWith("✓") ? "#16a34a" : "#dc2626", fontSize: "13px", margin: 0 }}>{saveMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

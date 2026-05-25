'use client';
import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api/v1';
const TENANT = 'demo-tenant-01';

interface SyncedDeal {
  id: string;
  dealName: string;
  stage: string;
  amount: number;
  closeDate: string;
  probability?: number;
  region?: string;
  hubspotId?: string;
}

interface SyncResult {
  imported: number;
  deals: SyncedDeal[];
  message: string;
}

interface Props {
  onDealsImported: (deals: SyncedDeal[]) => void;
}

const STAGE_CONF: Record<string, { label: string; cls: string }> = {
  Discovery:    { label: '○ Low',  cls: 'text-red-500' },
  Proposal:     { label: '◕ Med',  cls: 'text-amber-500' },
  Negotiation:  { label: '● High', cls: 'text-green-600' },
  'Closed Won': { label: '● High', cls: 'text-green-600' },
};

function formatL(v = 0) { return (v / 100000).toFixed(1); }

export default function HubSpotConnect({ onDealsImported }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/hubspot/status`, {
        headers: { 'x-tenant-id': TENANT },
      });
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
      }
    } catch {
      // API offline — show disconnected state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // If returning from HubSpot OAuth, check for ?hubspot=connected in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('hubspot') === 'connected') {
      setConnected(true);
      // Clean up query param without a reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('hubspot') === 'error') {
      setError(params.get('msg') ?? 'HubSpot connection failed');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkStatus]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API}/hubspot/auth-url`, {
        headers: { 'x-tenant-id': TENANT },
      });
      if (!res.ok) throw new Error('Could not get auth URL');
      const { url } = await res.json();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSyncResult(null);
    try {
      const res = await fetch(`${API}/hubspot/sync`, {
        method: 'POST',
        headers: { 'x-tenant-id': TENANT },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Sync failed');
      }
      const result: SyncResult = await res.json();
      setSyncResult(result);
      onDealsImported(result.deals);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API}/hubspot/disconnect`, {
        method: 'POST',
        headers: { 'x-tenant-id': TENANT },
      });
      setConnected(false);
      setSyncResult(null);
    } catch {
      setError('Disconnect failed');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* HubSpot Orange logo */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF7A59' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.162 5.656a8.384 8.384 0 0 0-3.498-.93V2.266a1.25 1.25 0 0 0-2.5 0v2.46a8.384 8.384 0 0 0-3.496.93 4.15 4.15 0 1 0-4.162 7.19 8.387 8.387 0 1 0 13.658-7.19zm-11.162 3.62a1.65 1.65 0 1 1 0-3.3 1.65 1.65 0 0 1 0 3.3zm5.5 7.74a4.887 4.887 0 1 1 0-9.773 4.887 4.887 0 0 1 0 9.773z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">HubSpot CRM</h3>
            <p className="text-[11px] text-gray-400">Pull open deals directly into your pipeline</p>
          </div>
        </div>

        {/* Connection badge */}
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          connected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          {connected ? 'Connected' : 'Not connected'}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {!connected ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Connect your HubSpot CRM to automatically import your open deals
              into the M6 pipeline — no manual entry required.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all hover:opacity-90"
              style={{ background: '#FF7A59' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.162 5.656a8.384 8.384 0 0 0-3.498-.93V2.266a1.25 1.25 0 0 0-2.5 0v2.46a8.384 8.384 0 0 0-3.496.93 4.15 4.15 0 1 0-4.162 7.19 8.387 8.387 0 1 0 13.658-7.19z"/>
              </svg>
              Connect HubSpot
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sync action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Sync deals from HubSpot</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Imports all open deals matching your CRM pipeline</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: '#FF7A59' }}
                >
                  {syncing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Sync result */}
            {syncResult && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-800">{syncResult.message}</span>
                </div>

                {syncResult.deals.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest text-[10px] font-semibold">
                        <th className="px-4 py-2.5 text-left">Deal</th>
                        <th className="px-3 py-2.5 text-left">Stage</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                        <th className="px-3 py-2.5 text-center">Confidence</th>
                        <th className="px-3 py-2.5 text-left">Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {syncResult.deals.map((deal) => {
                        const conf = STAGE_CONF[deal.stage] ?? { label: '○ Low', cls: 'text-gray-400' };
                        return (
                          <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {deal.hubspotId ? (
                                  <a href={`https://app.hubspot.com/contacts/demo/deal/${deal.hubspotId}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                                    {deal.dealName}
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  </a>
                                ) : (
                                  <span className="font-medium text-gray-800">{deal.dealName}</span>
                                )}
                                {deal.hubspotId && (
                                  <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-semibold border border-orange-100">
                                    HS
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{deal.stage}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                              ₹{formatL(deal.amount)}L
                            </td>
                            <td className={`px-3 py-2.5 text-center font-semibold ${conf.cls}`}>
                              {conf.label}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500">
                              {deal.region ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Field mapping footnote */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-2">
            Field Mapping · HubSpot → M6 Pipeline
          </p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-blue-700">
            {[
              ['dealname', 'Deal Name'],
              ['amount', 'Amount'],
              ['dealstage', 'Stage (mapped)'],
              ['closedate', 'Close Date'],
              ['hs_deal_stage_probability', 'AI Confidence input'],
            ].map(([hs, m6]) => (
              <div key={hs} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-blue-100">
                <code className="text-[9px] text-orange-600 font-mono">{hs}</code>
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                </svg>
                <span className="font-semibold">{m6}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Share2, 
  ChevronDown,
  TrendingUp,
  Target,
  CheckCircle2,
  Activity,
  FileText,
  Check,
  ArrowRight,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';

const TABS = [
  { id: 'pipeline', label: 'Pipeline Analysis', icon: <TrendingUp size={16} /> },
  { id: 'competitive', label: 'Competitive Analysis', icon: <Target size={16} /> },
  { id: 'scorecards', label: 'Scorecards Analysis', icon: <CheckCircle2 size={16} /> },
  { id: 'economic', label: 'Economic Pulse', icon: <Activity size={16} /> },
];

export default function RevenueDashboardsManagerView() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [period, setPeriod] = useState('This Quarter');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!activeTab) return;
    setLoading(true);
    setData(null);
    try {
      const endpointMap: Record<string, string> = {
        'pipeline': 'pipeline-analysis',
        'competitive': 'competitive-analysis',
        'scorecards': 'scorecards-analysis',
        'economic': 'economic-pulse'
      };
      
      const endpoint = endpointMap[activeTab];
      if (!endpoint) return;
      
      const response = await fetch(`/api/manager/revenue-dashboards/${endpoint}?period=${encodeURIComponent(period)}`, {
        headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000001' }
      });
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab) fetchData();
  }, [activeTab, period]);

  const renderStageBadge = (stage: string) => {
    switch(stage) {
      case 'Commit': return <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{stage}</span>;
      case 'Proposal': return <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{stage}</span>;
      case 'Negotiation': return <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{stage}</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{stage}</span>;
    }
  };

  const renderCompetitorBadge = (comp: string) => {
    return <span className="bg-pink-50 text-pink-500 text-[10px] px-2 py-0.5 rounded font-bold">{comp}</span>;
  };

  const renderPipelineAnalysis = () => {
    if (!data?.kpis || !data.kpis.competitiveOpps || !data.kpis.lateStageNoPricing || !data.kpis.closingNoVP || !data.kpis.impactedPipeline) return null;
    return (
      <div className="space-y-4 animate-fade-in bg-[#F9FAFB] p-6 rounded-b-xl border-x border-b border-gray-200">
        

        <div className="flex items-center gap-2 mt-6 mb-3 px-1">
          <TrendingUp size={16} className="text-[#00A1E0]" />
          <h2 className="text-[15px] font-bold text-gray-900">Pipeline Analysis</h2>
          <span className="text-[13px] text-[#00A1E0] font-semibold ml-2">Next quarter pipeline · Conversational data</span>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[110px]">
            <div className="text-gray-800 text-xs font-bold leading-snug">Competitive opps<br/>closing this Q</div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1.5">{data.kpis.competitiveOpps.count}</div>
              <div className="inline-block bg-pink-50 text-pink-600 text-[10px] px-2 py-0.5 rounded font-bold">{data.kpis.competitiveOpps.subtext}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[110px]">
            <div className="text-gray-800 text-xs font-bold leading-snug">Late-stage opps<br/>without pricing</div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1.5">{data.kpis.lateStageNoPricing.count}</div>
              <div className="inline-block bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded font-bold">{data.kpis.lateStageNoPricing.subtext}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[110px]">
            <div className="text-gray-800 text-xs font-bold leading-snug">Closing opps w/o VP<br/>participation</div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1.5">{data.kpis.closingNoVP.count}</div>
              <div className="inline-block bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded font-bold">{data.kpis.closingNoVP.subtext}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[110px]">
            <div className="text-gray-800 text-xs font-bold leading-snug">$ pipeline impacted by<br/>competitive opps</div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1.5">{data.kpis.impactedPipeline.amount}</div>
              <div className="inline-block bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold">{data.kpis.impactedPipeline.subtext}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Table 1: Competitive opps closing this Q */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Competitive opps closing this Q</h3>
              <button className="text-[#00A1E0] text-xs font-bold flex items-center gap-1 hover:underline">View all <ArrowRight size={12}/></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-semibold">Account</th>
                    <th className="pb-3 font-semibold">Competitor</th>
                    <th className="pb-3 font-semibold text-center">Amount</th>
                    <th className="pb-3 font-semibold text-center">Stage</th>
                    <th className="pb-3 font-semibold text-right">Close date</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {data.competitiveOpportunities?.map((opp: any) => (
                    <tr key={opp.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-bold">{opp.account}</td>
                      <td className="py-3">{renderCompetitorBadge(opp.competitor)}</td>
                      <td className="py-3 font-semibold text-center">{opp.amount}</td>
                      <td className="py-3 text-center">{renderStageBadge(opp.stage)}</td>
                      <td className="py-3 text-right font-semibold">{opp.closeDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Late-stage opps without pricing */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Late-stage opps without pricing discu...</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-semibold">Account</th>
                    <th className="pb-3 font-semibold text-center">Stage</th>
                    <th className="pb-3 font-semibold text-center">Amount</th>
                    <th className="pb-3 font-semibold text-right">Last...</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {data.missingPricing?.map((opp: any) => (
                    <tr key={opp.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-bold">{opp.account}</td>
                      <td className="py-3 text-center">{renderStageBadge(opp.stage)}</td>
                      <td className="py-3 font-semibold text-center">{opp.amount}</td>
                      <td className="py-3 text-right text-rose-500 font-semibold">{opp.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Closing opps without VP */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex justify-between items-start border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900 max-w-[200px] leading-snug">Closing opps without VP / executive participation</h3>
              <button className="text-[#00A1E0] text-xs font-bold flex items-center gap-1 hover:underline">View all <ArrowRight size={12}/></button>
            </div>
            <div className="p-4 flex-1">
              <table className="w-full text-left text-xs mb-4">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-semibold">Account</th>
                    <th className="pb-3 font-semibold text-center">Amount</th>
                    <th className="pb-3 font-semibold text-center">Stage</th>
                    <th className="pb-3 font-semibold text-center">Close</th>
                    <th className="pb-3 font-semibold text-right">Contacts</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {data.closingNoVP?.map((opp: any) => (
                    <tr key={opp.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-bold">{opp.account}</td>
                      <td className="py-3 font-semibold text-center">{opp.amount}</td>
                      <td className="py-3 text-center">{renderStageBadge(opp.stage)}</td>
                      <td className="py-3 font-semibold text-center">{opp.closeDate}</td>
                      <td className="py-3 text-right">
                        <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-bold text-[10px]">{opp.contacts} contact{opp.contacts > 1 ? 's' : ''}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-red-500 text-[11px] font-semibold flex items-start gap-1.5 mt-2">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> 
                Single-threaded deals have 2.4x higher loss rate
              </div>
            </div>
          </div>

          {/* Chart: $ pipeline impacted */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex justify-between items-start">
              <h3 className="text-[13px] font-bold text-gray-900 leading-snug">$ pipeline impacted by<br/>competitive opps</h3>
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16}/></button>
            </div>
            <div className="px-5 pb-5 flex-1">
              <div className="space-y-3.5 mt-2">
                {data.impactedPipelineBreakdown?.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center text-xs">
                    <div className="w-[75px] font-semibold text-gray-700 truncate">{item.name}</div>
                    <div className="flex-1 flex items-center mx-3">
                      <div className={`h-[7px] rounded-full ${item.color}`} style={{ width: item.width }}></div>
                    </div>
                    <div className="w-[45px] text-right font-extrabold text-gray-900">{item.amount}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-6 text-[11px] font-bold text-gray-900">
                <div>Total: {data.impactedPipelineBreakdown?.total}</div>
                <div>% of pipeline: <span className="text-rose-500">{data.impactedPipelineBreakdown?.percentage}</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderCompetitiveAnalysis = () => {
    if (!data?.kpis) return null;
    const {
      kpis,
      competitors = [],
      historicalWinRates = [],
      competitiveOpportunities = [],
      wonOppsPerQuarter = [],
      valueOfWonOpps = [],
      winRateByCompetitor = [],
    } = data;

    // Derive display values — fall back to API fields we already have
    const competitiveOppsCount = kpis.competitiveOppsCount ?? kpis.competitiveWinRate ?? 34;
    const pctWonOpps = kpis.pctCompetitiveWonOpps ?? kpis.competitiveWinRate ?? 28;
    const pctDelta = kpis.pctWonOppsDelta ?? -4;
    const valueWon = kpis.valueOfWonOpps ?? kpis.influencedRevenue ?? '$1.18M';
    const valueDelta = kpis.valueWonDelta ?? '+$140K vs Q1';
    const winRate = kpis.winRateCompetitive ?? kpis.competitiveWinRate ?? 31;
    const winRateDelta = kpis.winRateDelta ?? 'vs 43% overall';

    // % competitive won opps per Q table rows
    const perQRows: Array<{ quarter: string; totalWon: number; compWon: number; pct: number }> =
      wonOppsPerQuarter.length > 0
        ? wonOppsPerQuarter
        : [
            { quarter: 'Q3 FY2024', totalWon: 88,  compWon: 29, pct: 33 },
            { quarter: 'Q4 FY2024', totalWon: 94,  compWon: 28, pct: 30 },
            { quarter: 'Q1 FY2025', totalWon: 102, compWon: 33, pct: 32 },
            { quarter: 'Q2 FY2025', totalWon: 82,  compWon: 23, pct: 28 },
          ];

    // $ value of won opps with competition
    const valueRows: Array<{ quarter: string; value: string; barWidth: number; color: string }> =
      valueOfWonOpps.length > 0
        ? valueOfWonOpps
        : [
            { quarter: 'Q3 FY2024', value: '$940K',  barWidth: 72,  color: '#a78bfa' },
            { quarter: 'Q4 FY2024', value: '$1.04M', barWidth: 82,  color: '#8b5cf6' },
            { quarter: 'Q1 FY2025', value: '$1.04M', barWidth: 82,  color: '#7c3aed' },
            { quarter: 'Q2 FY2025', value: '$1.18M', barWidth: 95,  color: '#e91e8c' },
          ];

    // Win rate by competitor bottom grid
    const COMP_BADGE_COLORS: Record<string, { label: string; abbr: string; bar: string; pct: number }> = {
      Salesforce: { label: 'Salesforce', abbr: 'SF', bar: '#ef4444', pct: 24 },
      Outreach:   { label: 'Outreach',   abbr: 'OR', bar: '#3b82f6', pct: 44 },
      Clari:      { label: 'Clari',      abbr: 'CL', bar: '#22c55e', pct: 48 },
      HubSpot:    { label: 'HubSpot',    abbr: 'HS', bar: '#f97316', pct: 38 },
      ZoomInfo:   { label: 'ZoomInfo',   abbr: 'ZI', bar: '#10b981', pct: 52 },
      Others:     { label: 'Others',     abbr: 'OT', bar: '#94a3b8', pct: 40 },
    };

    // Build the bottom 6-competitor grid from API data or fallback
    const gridComps = winRateByCompetitor.length > 0
      ? winRateByCompetitor
      : Object.values(COMP_BADGE_COLORS);

    // Quarterly bar chart (top-right) from historical data
    const quarterBars: Array<{ label: string; pct: number }> =
      historicalWinRates.length > 0
        ? historicalWinRates.slice(-4).map((h: any) => ({ label: h.quarter, pct: h.winRate }))
        : [
            { label: "Q3'24", pct: 38 },
            { label: "Q4'24", pct: 34 },
            { label: "Q1'25", pct: 35 },
            { label: "Q2'25", pct: 31 },
          ];

    const maxBarPct = Math.max(...quarterBars.map(b => b.pct), 1);

    const pctBadgeColor = (pct: number) => {
      if (pct >= 35) return { bg: '#fef3c7', text: '#d97706' };
      if (pct >= 30) return { bg: '#fef3c7', text: '#d97706' };
      return { bg: '#fee2e2', text: '#dc2626' };
    };

    return (
      <div className="space-y-4 animate-fade-in bg-[#F9FAFB] p-6 rounded-b-xl border-x border-b border-gray-200">

        {/* Intelligence Banner */}
        <div className="flex items-center justify-between bg-pink-50 border border-pink-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#e91e8c] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-extrabold">R</span>
            </div>
            <p className="text-[12px] text-gray-700 leading-snug">
              <span className="font-bold text-gray-900">Competitive Intelligence</span>
              {' '}— Based on conversational data where competitors were mentioned in sales calls.{' '}
              Salesforce CRM data synced for opportunity context.
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
            <Check size={13} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-emerald-600">Connected</span>
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <span className="text-[#e91e8c]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          </span>
          <h2 className="text-[14px] font-bold text-gray-900">Competitive Analysis</h2>
          <span className="ml-1 text-[11px] font-bold text-[#e91e8c] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
            Conversation signals · CRM data
          </span>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">
              Competitive opps<br/>closing this Q
            </div>
            <div className="text-[32px] font-extrabold text-gray-900 leading-none mt-auto">
              {competitiveOppsCount}
            </div>
            <div className="inline-block self-start bg-pink-50 text-pink-600 text-[10px] px-2 py-0.5 rounded font-bold mt-1">
              Active competitive deals
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">
              % competitive won<br/>opps (this Q)
            </div>
            <div className="text-[32px] font-extrabold text-gray-900 leading-none mt-auto">
              {pctWonOpps}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-rose-500 text-[10px] font-bold">▼ {Math.abs(pctDelta)}% vs last Q</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">
              $ value of won opps<br/>with competition
            </div>
            <div className="text-[28px] font-extrabold text-gray-900 leading-none mt-auto">
              {valueWon}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-emerald-600 text-[10px] font-bold">▲ {valueDelta}</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">
              Win rate —<br/>competitive opps this Q
            </div>
            <div className="text-[32px] font-extrabold text-gray-900 leading-none mt-auto">
              {winRate}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-rose-500 text-[10px] font-bold">▼ {winRateDelta}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Opps table + Win rate per Q chart */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

          {/* Competitive opps closing this Q — table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Competitive opps closing this Q</h3>
              <button className="text-[#e91e8c] text-[11px] font-bold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={11}/>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 font-semibold">Account</th>
                    <th className="px-4 py-2.5 font-semibold">Competitor mentioned</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Stage</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Close</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 divide-y divide-gray-50">
                  {competitiveOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No competitive opportunities</td>
                    </tr>
                  ) : (
                    competitiveOpportunities.map((opp: any) => (
                      <tr key={opp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{opp.account}</td>
                        <td className="px-4 py-3">{renderCompetitorBadge(opp.competitor)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{opp.amount}</td>
                        <td className="px-4 py-3 text-center">{renderStageBadge(opp.stage)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{opp.closeDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Win rate per Q — bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900 leading-snug">
                Win rate per Q —<br/>
                <span className="font-normal text-gray-500">competitive opps</span>
              </h3>
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={15}/></button>
            </div>
            <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
              {/* Bar chart */}
              <div className="flex items-end gap-3 h-[80px]">
                {quarterBars.map((b, i) => {
                  const barH = Math.max(8, Math.round((b.pct / maxBarPct) * 72));
                  return (
                    <div key={b.label} className="flex flex-col items-center flex-1 gap-0.5">
                      <span className="text-[10px] font-extrabold text-gray-700">{b.pct}%</span>
                      <div className="w-full flex items-end justify-center" style={{ height: 72 }}>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: barH,
                            background: i === quarterBars.length - 1 ? '#e91e8c' : '#c4b5fd',
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 font-semibold">{b.label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Trend note */}
              <div className="flex items-start gap-1 text-[10px] text-rose-500 font-semibold leading-snug pt-1 border-t border-gray-100">
                <span className="mt-0.5">→</span>
                <span>Competitive win rate declining — consider battlecard refresh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: % won opps per Q table + $ value of won opps bars */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* % competitive won opps per Q */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">% competitive won opps per Q</h3>
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={15}/></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 font-semibold">Quarter</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Total won</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Comp-influenced won</th>
                    <th className="px-4 py-2.5 font-semibold text-right">% competitive</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 divide-y divide-gray-50">
                  {perQRows.map((row: any) => {
                    const { bg, text } = pctBadgeColor(row.pct);
                    return (
                      <tr key={row.quarter} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-700">{row.quarter}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{row.totalWon}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{row.compWon}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-extrabold"
                            style={{ background: bg, color: text }}
                          >
                            {row.pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* $ value of won opps with competition */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900 leading-snug">
                $ value of won<br/>opps with competition
              </h3>
              <button className="text-[#e91e8c] text-[11px] font-bold flex items-center gap-1 hover:underline">
                View deals <ArrowRight size={11}/>
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3.5">
              {valueRows.map((row: any) => (
                <div key={row.quarter} className="flex items-center gap-3 text-xs">
                  <span className="w-[76px] font-semibold text-gray-600 flex-shrink-0 text-[11px]">{row.quarter}</span>
                  <div className="flex-1 h-[8px] bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.barWidth}%`, background: row.color }}
                    />
                  </div>
                  <span className="w-[46px] text-right font-extrabold text-gray-900 text-[11px]">{row.value}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-500 leading-snug pt-1 border-t border-gray-100 mt-1">
                Higher $ value won despite lower win rate % — larger deal sizes in competitive situations
              </p>
            </div>
          </div>
        </div>

        {/* Row 4: Win rate by competitor — full width grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-gray-900">
              Win rate by competitor — current + previous FQ
            </h3>
            <button className="text-[#e91e8c] text-[11px] font-bold flex items-center gap-1 hover:underline">
              Full breakdown <ArrowRight size={11}/>
            </button>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            {gridComps.map((comp: any) => {
              const meta = COMP_BADGE_COLORS[comp.label] ?? COMP_BADGE_COLORS[comp.name] ?? {
                abbr: (comp.label ?? comp.name ?? '??').slice(0, 2).toUpperCase(),
                bar: '#94a3b8',
                pct: comp.pct ?? comp.winRate ?? 0,
              };
              const pct = comp.pct ?? comp.winRate ?? meta.pct;
              const name = comp.label ?? comp.name ?? '';
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                      style={{ background: meta.bar }}
                    >
                      {meta.abbr}
                    </span>
                    <span className="text-[12px] font-bold text-gray-900">{name}</span>
                    <span className="ml-auto text-[12px] font-extrabold" style={{ color: meta.bar }}>{pct}%</span>
                  </div>
                  <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: meta.bar }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  const renderScorecardsAnalysis = () => {
    if (!data?.kpis) return null;
    const {
      kpis,
      topScorers = [],
      bottomScorers = [],
      topScored = [],
      bottomScored = [],
      scoringByManager = [],
      topScorecardTypes = [],
      managerScoreTrends = [],
      repScoreTrends = [],
      companyTotalByMonth = [],
      zeroScorecardsCount = 0,
    } = data;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    const avgScoreBg = (s: number) =>
      s >= 80 ? '#dcfce7' : s >= 70 ? '#fef9c3' : '#fee2e2';
    const avgScoreColor = (s: number) =>
      s >= 80 ? '#16a34a' : s >= 70 ? '#ca8a04' : '#dc2626';

    const statusBg = (st: string) =>
      st === 'Needs attention' ? '#fee2e2' : '#fef9c3';
    const statusColor = (st: string) =>
      st === 'Needs attention' ? '#dc2626' : '#ca8a04';

    const trendBg = (t: number) =>
      t > 0 ? '#dcfce7' : t === 0 ? '#f1f5f9' : '#fee2e2';
    const trendColor = (t: number) =>
      t > 0 ? '#16a34a' : t === 0 ? '#64748b' : '#dc2626';
    const trendArrow = (t: number) =>
      t > 0 ? '▲' : t < 0 ? '▼' : '—';

    const Avatar = ({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) => (
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: color + '22', border: `1.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color }}>{initials}</span>
      </div>
    );

    const maxCompanyCount = Math.max(...companyTotalByMonth.filter((m: any) => m.count != null).map((m: any) => m.count), 1);

    return (
      <div className="space-y-4 animate-fade-in bg-[#F9FAFB] p-6 rounded-b-xl border-x border-b border-gray-200">

        {/* ── Yellow banner ── */}
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 14 }}>🎯</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
              <span style={{ fontWeight: 800 }}>Scorecards Analysis</span>
              {' '}— Identify reps who need more feedback, managers who should be giving more feedback.
              Data based on scorecards filled in over the last 30 days and last 2 fiscal quarters.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Check size={13} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Connected</span>
          </div>
        </div>

        {/* ── Section: Scoring activity ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Scoring activity</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ca8a04', background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 999, padding: '2px 10px' }}>Last 30 days</span>
        </div>

        {/* ── 4 KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.4 }}>Total scorecards filled<br/>(30d)</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{kpis.totalScorecards}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', borderRadius: 4, padding: '1px 6px' }}>▲ {kpis.totalScorecardsVsPrev}%</span>
              <span style={{ fontSize: 10, color: '#6b7280' }}>vs prev 30d</span>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Unique reps scored</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{kpis.uniqueRepsScored}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', background: '#dbeafe', borderRadius: 4, padding: '2px 8px', alignSelf: 'flex-start' }}>
              of {kpis.totalReps} total reps
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Managers scoring</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{kpis.managersScoring}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#ca8a04', background: '#fef9c3', borderRadius: 4, padding: '2px 8px', alignSelf: 'flex-start' }}>
              {kpis.inactiveManagers} inactive
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.4 }}>Avg overall score<br/>(30d)</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{kpis.avgOverallScore}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', borderRadius: 4, padding: '1px 6px' }}>▲ {kpis.avgScoreVsPrev}pts</span>
              <span style={{ fontSize: 10, color: '#6b7280' }}>vs prev month</span>
            </div>
          </div>
        </div>

        {/* ── Row: Top scorers | Bottom scorers ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Top users to score a call</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>People who filled in the most scorecards — last 30 days</div>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>All <ArrowRight size={11} /></button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>User</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'center' }}>Scorecards filled</th>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Avg given</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((u: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={u.initials} color={u.color} />
                          <span style={{ fontWeight: 700, color: '#111827' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#6b7280' }}>{u.role}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{u.scorecardsFilled}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: avgScoreColor(u.avgGiven), background: avgScoreBg(u.avgGiven), borderRadius: 6, padding: '2px 8px' }}>{u.avgGiven}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Bottom users to score a call</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>People who filled in the fewest scorecards — last 30 days</div>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}>Coach →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>User</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'center' }}>Scorecards filled</th>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomScorers.map((u: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={u.initials} color={u.color} />
                          <span style={{ fontWeight: 700, color: '#111827' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#6b7280' }}>{u.role}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{u.scorecardsFilled}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(u.status), background: statusBg(u.status), borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>{u.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {zeroScorecardsCount > 0 && (
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{zeroScorecardsCount} reps received 0 scorecards this month — no feedback loop</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Row: Top to get scored | Bottom to get scored ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Top users to get scored</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Highest scoring reps — last 30 days</div>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>All <ArrowRight size={11} /></button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>Rep</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'center' }}>Scorecards received</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'center' }}>Avg score</th>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topScored.map((u: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={u.initials} color={u.color} />
                          <span style={{ fontWeight: 700, color: '#111827' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>{u.scorecardsReceived}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.avgScore}%`, background: u.avgScore >= 80 ? '#22c55e' : u.avgScore >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontWeight: 800, color: '#111827', minWidth: 24 }}>{u.avgScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: trendColor(u.trend), background: trendBg(u.trend), borderRadius: 6, padding: '2px 7px' }}>
                          {trendArrow(u.trend)}{u.trend !== 0 ? Math.abs(u.trend) : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Bottom users to get scored</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Lowest scoring reps — last 30 days</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>Rep</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'center' }}>Scorecards received</th>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomScored.map((u: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={u.initials} color={u.color} />
                          <span style={{ fontWeight: 700, color: '#111827' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#374151' }}>{u.scorecardsReceived}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.avgScore}%`, background: '#ef4444', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontWeight: 800, color: '#111827', minWidth: 24 }}>{u.avgScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Scoring trends header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Scoring trends</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ca8a04', background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 999, padding: '2px 10px' }}>Last 2 Fiscal quarters by month</span>
        </div>

        {/* ── Row: Scoring per month | Top scorecards used ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Scoring done per month — by manager</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>scorecards filled in per manager over last 2 FQs</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>Manager</th>
                    {months.map(m => (
                      <th key={m} style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'center' }}>{m}</th>
                    ))}
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringByManager.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 700, color: '#111827' }}>{row.name}</td>
                      {months.map(m => (
                        <td key={m} style={{ padding: '8px 6px', textAlign: 'center', color: row.months[m] == null ? '#d1d5db' : '#374151' }}>
                          {row.months[m] ?? '—'}
                        </td>
                      ))}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: row.color, borderRadius: 6, padding: '2px 8px' }}>{row.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Top scorecards used</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Scorecard types filled most — last 30 days</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topScorecardTypes.map((t: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 110, fontSize: 12, fontWeight: 600, color: '#374151', flexShrink: 0 }}>{t.name}</span>
                  <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.width}%`, background: t.color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111827', minWidth: 28, textAlign: 'right' }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row: Manager avg scores | Rep avg scores ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Managers avg. scores over time</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Avg score given monthly per manager — last 2 FQs</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>Manager</th>
                    {['Jan','Feb','Mar','Apr','May'].map(m => (
                      <th key={m} style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'center' }}>{m}</th>
                    ))}
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {managerScoreTrends.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 700, color: '#111827' }}>{row.name}</td>
                      {['Jan','Feb','Mar','Apr','May'].map(m => (
                        <td key={m} style={{ padding: '8px 6px', textAlign: 'center', color: '#374151' }}>{row.months[m] ?? '—'}</td>
                      ))}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: row.trendColor, background: row.trendColor + '22', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                          {row.trend === 'Rising' || row.trend === 'Improving' ? '▲ ' : row.trend === 'Declining' ? '▼ ' : '— '}{row.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Reps avg. scores over time</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Avg score received monthly per rep — last 2 FQs</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'left' }}>Rep</th>
                    {['Jan','Feb','Mar','Apr','May'].map(m => (
                      <th key={m} style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'center' }}>{m}</th>
                    ))}
                    <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'center' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {repScoreTrends.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 16px', fontWeight: 700, color: '#111827' }}>{row.name}</td>
                      {['Jan','Feb','Mar','Apr','May'].map(m => (
                        <td key={m} style={{ padding: '8px 6px', textAlign: 'center', color: '#374151' }}>{row.months[m] ?? '—'}</td>
                      ))}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: row.trendColor, background: row.trendColor + '22', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                          {row.trend === 'Rising' || row.trend === 'Improving' ? '▲ ' : row.trend === 'Declining' ? '▼ ' : '— '}{row.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Company total bar chart ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Scorecards given over time — company total</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Total number of scorecards given per month over last 2 Fiscal quarters</div>
          </div>
          <div style={{ padding: '16px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 52, marginBottom: 8 }}>
              {companyTotalByMonth.map((m: any, i: number) => {
                const h = m.count != null ? Math.max(4, Math.round((m.count / maxCompanyCount) * 48)) : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: 48 }}>
                    {m.count != null ? (
                      <div style={{ width: '100%', height: h, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                    ) : (
                      <div style={{ width: '100%', height: 2, borderTop: '2px dashed #d1d5db', marginBottom: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {companyTotalByMonth.map((m: any, i: number) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{m.month}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: m.count != null ? '#111827' : '#d1d5db' }}>{m.count ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderEconomicPulse = () => {
    if (!data?.kpis) return null;
    const {
      kpis,
      epRateOverTime,
      pipelineByQuarter = [],
      oppsByStage = [],
      lateStageEpSummary,
      industryBreakdown = [],
      topIndustryInsight = '',
      accountTypes = [],
      accountTypeInsight = '',
      winRatesByQuarter = [],
      aiInsight = '',
      trackerTerms = [],
    } = data;

    const winRateBg = (rate: number) => {
      if (rate >= 40) return '#dcfce7';
      if (rate >= 30) return '#fef9c3';
      return '#fee2e2';
    };
    const winRateColor = (rate: number) => {
      if (rate >= 40) return '#16a34a';
      if (rate >= 30) return '#ca8a04';
      return '#dc2626';
    };

    const maxQPipeline = Math.max(...pipelineByQuarter.map((q: any) => q.amount), 1);

    return (
      <div className="space-y-4 animate-fade-in bg-[#F9FAFB] p-6 rounded-b-xl border-x border-b border-gray-200">

        {/* ── Info banners ── */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] text-gray-700 leading-snug">
              <span className="font-bold text-gray-900">Economic Pulse</span>
              {' '}— Shows how current economic considerations are affecting sales. Tracks frequency in calls, pipeline at risk, and win rate impact.
              Requires Economic Pulse tracker enabled and configured on the CRM call object.
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
            <Check size={13} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-emerald-600">Tracker active</span>
          </div>
        </div>

        {trackerTerms.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[12px] text-blue-800">
            <FileText size={13} className="text-blue-500 flex-shrink-0" />
            <span>
              <span className="font-bold">Note:</span> This dashboard displays data only when the Economic Pulse tracker is enabled. Tracker terms configured:{' '}
              <span className="font-semibold italic">"{trackerTerms.join('", "')}"</span>
            </span>
          </div>
        )}

        {/* ── Section header ── */}
        <div className="flex items-center gap-2 pt-1 px-1">
          <Activity size={15} className="text-orange-500" />
          <h2 className="text-[15px] font-bold text-gray-900">Economic Pulse overview</h2>
          <span className="text-[12px] text-orange-500 font-semibold ml-1">Current + previous fiscal quarter</span>
        </div>

        {/* ── 4 KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">EP rate in<br/>conversations (this Q)</div>
            <div className="text-[36px] font-extrabold text-gray-900 leading-none mt-auto">{kpis.epRateThisQ}%</div>
            <div className="flex items-center gap-1 mt-1">
              {kpis.epRateDelta > 0
                ? <span className="text-rose-500 text-[10px] font-bold">▲ +{kpis.epRateDelta}% vs Q1</span>
                : <span className="text-emerald-600 text-[10px] font-bold">▼ {kpis.epRateDelta}% vs Q1</span>
              }
              <span className="text-[10px] text-gray-400 ml-1">{kpis.epRateTrend}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">$ pipeline impacted by<br/>Economic Pulse</div>
            <div className="text-[28px] font-extrabold text-gray-900 leading-none mt-auto">{kpis.epPipelineTotal}</div>
            <div className="inline-block self-start bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded font-bold mt-1">
              {kpis.epPipelinePct}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">Overall win rate<br/>(this Q)</div>
            <div className="text-[36px] font-extrabold text-gray-900 leading-none mt-auto">{kpis.overallWinRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-rose-500 text-[10px] font-bold">▼ 1% vs Q1</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1 min-h-[110px]">
            <div className="text-gray-700 text-[11px] font-semibold leading-snug">Win rate —<br/>EP impacted opps</div>
            <div className="text-[36px] font-extrabold text-gray-900 leading-none mt-auto">{kpis.epWinRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-rose-500 text-[10px] font-bold">▼ {Math.abs(kpis.overallWinRate - kpis.epWinRate)}pp vs overall</span>
            </div>
          </div>
        </div>

        {/* ── Row 2: EP rate over time + $ pipeline by quarter ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* EP rate in conversations over time */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Economic pulse rate in conversations over time</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">% of conversations where EP tracker terms came up — current and previous FQ</p>
            </div>
            <div className="p-4 flex-1">
              {/* Quarter bars */}
              <div className="flex items-end gap-4 h-[80px] mb-3">
                {epRateOverTime?.quarters?.map((q: any, i: number) => {
                  const barH = Math.max(8, Math.round((q.rate / 40) * 70));
                  return (
                    <div key={q.quarter} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[11px] font-extrabold text-orange-500">{q.rate}%</span>
                      <div className="w-full flex items-end justify-center" style={{ height: 68 }}>
                        <div
                          className="w-full rounded-t-sm"
                          style={{ height: barH, background: i === (epRateOverTime.quarters.length - 1) ? '#f97316' : '#fed7aa' }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold text-center">{q.quarter}</span>
                    </div>
                  );
                })}
              </div>
              {epRateOverTime?.signal && (
                <div className="flex items-start gap-1.5 text-[10px] text-rose-500 font-semibold leading-snug border-t border-gray-100 pt-2 mt-1">
                  <span className="mt-0.5">→</span>
                  <span>{epRateOverTime.signal}</span>
                </div>
              )}

              {/* Monthly breakdown */}
              {epRateOverTime?.monthlyBreakdown?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-700 mb-2">Monthly breakdown — {epRateOverTime.quarters?.[epRateOverTime.quarters.length - 1]?.quarter}</div>
                  <div className="flex items-end gap-2 h-[32px]">
                    {epRateOverTime.monthlyBreakdown.map((m: any) => (
                      <div key={m.month} className="flex flex-col items-center gap-0.5 flex-1">
                        {m.rate != null ? (
                          <div className="w-full rounded-t-sm bg-orange-300" style={{ height: Math.max(4, Math.round((m.rate / 40) * 28)) }} />
                        ) : (
                          <div className="w-full border-t-2 border-dashed border-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {epRateOverTime.monthlyBreakdown.map((m: any) => (
                      <div key={m.month} className="flex-1 text-center">
                        <div className="text-[9px] text-gray-500 font-semibold">{m.month}</div>
                        <div className="text-[10px] font-bold text-gray-700">{m.rate != null ? `${m.rate}%` : '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* $ pipeline impacted by EP */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">$ pipeline impacted by Economic Pulse</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">$ of opps where EP tracker terms were mentioned — evaluate pipeline risk</p>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              {/* Bar chart */}
              <div className="flex items-end gap-6 h-[100px] mb-3 justify-center">
                {pipelineByQuarter.map((q: any, i: number) => {
                  const barH = Math.max(16, Math.round((q.amount / maxQPipeline) * 88));
                  return (
                    <div key={q.quarter} className="flex flex-col items-center gap-1 w-[80px]">
                      <span className="text-[13px] font-extrabold text-orange-500">{q.amountFmt}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: 90 }}>
                        <div
                          className="w-full rounded-t-md"
                          style={{ height: barH, background: i === pipelineByQuarter.length - 1 ? '#f97316' : '#fed7aa' }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold text-center">{q.quarter}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 border-t border-gray-100 pt-3">
                <span>Total EP-impacted</span>
                <span className="text-orange-500 font-extrabold ml-1">{kpis.epPipelineTotal}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500">{kpis.epPipelinePct}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Opps by stage + Impacted industries ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Opportunities by stage */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Economic Pulse — Impacted opportunities by stage</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Stage breakdown of opps where EP terms were mentioned + total amount</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 font-semibold">Stage</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Opp count</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Total amount</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Avg deal size</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 divide-y divide-gray-50">
                  {oppsByStage.map((row: any) => (
                    <tr key={row.stage} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{row.stage}</td>
                      <td className="px-4 py-3 text-center font-semibold">{row.count}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.isHighRisk ? 'text-orange-500' : 'text-gray-900'}`}>
                        {row.totalAmount}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.avgDealSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lateStageEpSummary && (
              <div className="px-4 py-2.5 flex items-center gap-2 border-t border-gray-100 bg-orange-50">
                <AlertTriangle size={12} className="text-orange-500 flex-shrink-0" />
                <span className="text-[11px] text-orange-600 font-semibold">
                  {lateStageEpSummary.count} late-stage deals ({lateStageEpSummary.value}) are EP-impacted — at risk
                </span>
              </div>
            )}
          </div>

          {/* Impacted industries */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Economic Pulse — Impacted Industries</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Opps per industry where EP terms were mentioned + start month</p>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              {industryBreakdown.map((item: any) => (
                <div key={item.industry} className="flex items-center gap-3 text-xs">
                  <span className="w-[110px] font-semibold text-gray-700 text-[12px] flex-shrink-0">{item.industry}</span>
                  <div className="flex-1 h-[7px] bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.barWidth}%`, background: item.color }} />
                  </div>
                  <span className="text-[12px] font-bold text-gray-800 w-[60px] text-right flex-shrink-0">
                    {item.count} opps
                  </span>
                </div>
              ))}
              {topIndustryInsight && (
                <p className="text-[11px] text-gray-500 leading-snug pt-2 border-t border-gray-100 mt-1">{topIndustryInsight}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 4: Account types + Win rate comparison ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* EP-impacted account types */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Economic Pulse — impacted account types</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Times EP terms mentioned by account type (prospect vs customer)</p>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              {accountTypes.map((item: any) => (
                <div key={item.type} className="flex items-center gap-3 text-xs">
                  <span className="w-[70px] font-semibold text-gray-700 text-[12px] flex-shrink-0">{item.type}</span>
                  <div className="flex-1 h-[7px] bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.barWidth}%`, background: item.color }} />
                  </div>
                  <span className="text-[12px] font-bold text-gray-800 w-[28px] text-right flex-shrink-0">{item.count}</span>
                </div>
              ))}
              {accountTypeInsight && (
                <p className="text-[11px] text-gray-500 leading-snug pt-2 border-t border-gray-100 mt-1">{accountTypeInsight}</p>
              )}
            </div>
          </div>

          {/* Win rates — overall vs EP-impacted per Q */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Win rates — overall vs EP impacted opps per Q</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Overall win rate vs win rate where EP tracker terms were mentioned</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 font-semibold">Quarter</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Overall win rate</th>
                    <th className="px-4 py-2.5 font-semibold text-center">EP-impacted win rate</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Δ difference</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 divide-y divide-gray-50">
                  {winRatesByQuarter.map((row: any) => (
                    <tr key={row.quarter} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-700">{row.quarter}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold"
                          style={{ background: winRateBg(row.overallWinRate), color: winRateColor(row.overallWinRate) }}>
                          {row.overallWinRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold"
                          style={{ background: winRateBg(row.epWinRate), color: winRateColor(row.epWinRate) }}>
                          {row.epWinRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-[11px] font-extrabold ${row.delta < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {row.delta > 0 ? '+' : ''}{row.delta}pp
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI insight box */}
            {aiInsight && (
              <div className="m-4 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-[11px] font-bold text-orange-700 mb-1">Economic Pulse impact widening</p>
                <p className="text-[11px] text-orange-700 leading-snug">{aiInsight}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#F9FAFB] overflow-y-auto">
      <div className="w-full px-8 py-8">

        {/* ── LIST SCREEN ── */}
        {!activeTab && (
          <>
            <div className="mb-6">
              <div className="text-[12px] text-gray-400 font-semibold mb-1">All Folders</div>
              <h1 className="text-[22px] font-extrabold text-gray-900">Revenue Dashboards</h1>
            </div>

            <div className="flex flex-col gap-3">
              {TABS.map((tab) => {
                const descriptions: Record<string, string> = {
                  pipeline:    'Competitive opps, late-stage risks, and pipeline impact analysis',
                  competitive: 'Win rates, competitor mentions, and deal influence tracking',
                  scorecards:  'Scoring activity, rep feedback, and manager coaching trends',
                  economic:    'Budget freeze signals, EP-impacted pipeline and win rates',
                };
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 text-left hover:border-[#00A1E0] hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EEF6FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A1E0] transition-colors">
                      <span className="text-[#00A1E0] group-hover:text-white transition-colors [&>svg]:w-5 [&>svg]:h-5">
                        {tab.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-extrabold text-gray-900 group-hover:text-[#00A1E0] transition-colors">
                        {tab.label}
                      </div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{descriptions[tab.id]}</div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-[#00A1E0] transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── DETAIL SCREEN ── */}
        {activeTab && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setActiveTab(null); setData(null); }}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 bg-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  ← Back
                </button>
                <div>
                  <div className="text-[11px] text-gray-400 font-semibold">Revenue Dashboards</div>
                  <h1 className="text-[20px] font-extrabold text-gray-900 leading-tight">
                    {TABS.find(t => t.id === activeTab)?.label}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded-lg text-[13px] font-semibold focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="This Quarter">This Quarter</option>
                    <option value="Last Quarter">Last Quarter</option>
                    <option value="Last 30 days + 2 FQs">Last 30 days + 2 FQs</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                </div>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-[13px] font-semibold shadow-sm transition-colors"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A1E0]"></div>
              </div>
            ) : (
              <>
                {activeTab === 'pipeline'    && renderPipelineAnalysis()}
                {activeTab === 'competitive' && renderCompetitiveAnalysis()}
                {activeTab === 'scorecards'  && renderScorecardsAnalysis()}
                {activeTab === 'economic'    && renderEconomicPulse()}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}

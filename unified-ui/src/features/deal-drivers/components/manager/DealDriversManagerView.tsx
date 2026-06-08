'use client';
import { useEffect, useState, useMemo } from 'react';
import { Users, Sparkles } from 'lucide-react';
import RoleBadge from '../RoleBadge';

import { getDealBoards, getDeals } from '../../dealboards_rep/services/dealBoardsService';
import { MOCK_WARNINGS } from '../../dealboards_rep/mocks/deal-boards.mocks';

import RiskMatrix from '../RiskMatrix';
import TopAtRiskDeals from '../TopAtRiskDeals';
import AiInsights from '../AiInsights';
import ComparePeriods from '../ComparePeriods';
import DrilldownPanel from '../DrilldownPanel';

import type {
  SummaryResponse, RiskMatrixResponse, AtRiskDealsResponse,
  AiInsightsResponse, DrilldownResponse,
  AiInsight, Rep, AtRiskDeal, CloseDateStatus, DaysFlaggedStatus
} from '../../types';

type Tab = 'risk-matrix' | 'compare-periods' | 'top-at-risk' | 'ai-insights';

const TABS: { key: Tab; label: string }[] = [
  { key: 'risk-matrix', label: 'Risk Matrix' },
  { key: 'compare-periods', label: 'Compare Periods' },
  { key: 'top-at-risk', label: 'Top At-Risk Deals' },
  { key: 'ai-insights', label: 'AI Insights' },
];

const TEAM_AVG_BENCHMARKS = {
  noNextStep: 30,
  singleThreaded: 35,
  noClosePlan: 40,
  staleGt14d: 25,
  championLeft: 15,
};

const WARNING_LABELS = {
  noNextStep: 'No Next Step',
  singleThreaded: 'Single-threaded',
  noClosePlan: 'No Close Plan',
  staleGt14d: 'Stale >14 Days',
  championLeft: 'Champion Left',
};

function parseAmount(amount: any): number {
  if (typeof amount === 'number') return amount;
  if (!amount) return 0;
  const str = String(amount).replace(/[$,]/g, '').trim();
  if (str.endsWith('K')) return parseFloat(str.slice(0, -1)) * 1000;
  if (str.endsWith('M')) return parseFloat(str.slice(0, -1)) * 1000000;
  return parseFloat(str) || 0;
}

// Warning derivation helper following user mapping rules
function getDerivedWarnings(deal: any, localWarnings: any[]) {
  const active = localWarnings.filter(w => w.status === 'active');
  const hasWarningText = (words: string[]) =>
    active.some(w => words.some(word =>
      w.title.toLowerCase().includes(word) ||
      w.description.toLowerCase().includes(word)
    ));

  // noNextStep: deal.nextStep is empty/null/undefined
  const hasNextStep = deal.nextStep !== undefined
    ? deal.nextStep
    : (deal.aiSuggestedNextStep !== undefined ? deal.aiSuggestedNextStep : (deal.crm?.nextStep || ''));
  const noNextStep = !hasNextStep || String(hasNextStep).trim() === '';

  // singleThreaded: deal.contacts count === 1
  const singleThreaded = deal.contacts === 1;

  // noClosePlan: deal.closePlan is empty/null/undefined (fallback to playbookScore < 50)
  const noClosePlan = deal.closePlan !== undefined
    ? (!deal.closePlan || String(deal.closePlan).trim() === '')
    : (deal.playbookScore !== undefined ? deal.playbookScore < 50 : true);

  // staleGt14d: deal.lastActivity > 14 days ago (or fallback based on mock deals)
  let staleGt14d = false;
  if (deal.lastActivity !== undefined) {
    if (!deal.lastActivity) {
      staleGt14d = true;
    } else {
      const lastActDate = new Date(deal.lastActivity);
      const diffMs = Date.now() - lastActDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      staleGt14d = diffDays > 14;
    }
  } else {
    staleGt14d = deal.dealId === 'deal-1' || deal.dealId === 'deal-3' || deal.id === '1' || deal.id === '3' || deal.id === '4';
  }

  // championLeft: deal.championContact is null/lost
  let championLeft = false;
  if (deal.championContact !== undefined) {
    championLeft = !deal.championContact || deal.championContact === 'lost';
  } else {
    championLeft = deal.dealId === 'deal-3' || deal.id === '3';
  }

  const list: string[] = [];
  if (noNextStep) list.push('noNextStep');
  if (singleThreaded) list.push('singleThreaded');
  if (noClosePlan) list.push('noClosePlan');
  if (staleGt14d) list.push('staleGt14d');
  if (championLeft) list.push('championLeft');

  return {
    noNextStep,
    singleThreaded,
    noClosePlan,
    staleGt14d,
    championLeft,
    activeCount: list.length,
    activeList: list
  };
}

export default function DealDriversManagerView() {
  const [tab, setTab] = useState<Tab>('risk-matrix');
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [period, setPeriod] = useState('Now');

  // Deals list loaded from current board
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drilldown panel state
  const [selectedDrilldown, setSelectedDrilldown] = useState<DrilldownResponse | null>(null);
  const [drilldownMeta, setDrilldownMeta] = useState<{ repId: string; repName: string; warningType: string; warningLabel: string } | null>(null);

  // Load all deal boards initially
  useEffect(() => {
    getDealBoards().then(res => {
      setBoards(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedBoardId(res.data[0].boardId);
      }
    });
  }, []);

  // Fetch deals for the selected board
  useEffect(() => {
    if (!selectedBoardId) return;
    setLoading(true);
    getDeals(selectedBoardId).then(res => {
      setDeals(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load deals:', err);
      setLoading(false);
    });
  }, [selectedBoardId]);

  const selectedBoardName = useMemo(() => {
    const b = boards.find(board => board.boardId === selectedBoardId);
    return b ? b.name : 'My Deals';
  }, [boards, selectedBoardId]);

  // Compute dynamic derived warnings for all deals on the selected board
  const dealsWithWarnings = useMemo(() => {
    return deals.map(d => {
      const warningsList = MOCK_WARNINGS[d.dealId || d.id] || [];
      const derived = getDerivedWarnings(d, warningsList);
      return {
        ...d,
        derivedWarnings: derived
      };
    });
  }, [deals]);

  // 1. Dynamic Summary Statistics Calculations
  const summaryData = useMemo<SummaryResponse | null>(() => {
    if (dealsWithWarnings.length === 0) return null;

    const totalActive = dealsWithWarnings.length;
    const warnedDeals = dealsWithWarnings.filter(d => d.derivedWarnings.activeCount > 0);
    const warnedCount = warnedDeals.length;
    const warnedPct = Math.round((warnedCount / totalActive) * 100);

    const warningCounts = {
      noNextStep: 0,
      singleThreaded: 0,
      noClosePlan: 0,
      staleGt14d: 0,
      championLeft: 0,
    };
    dealsWithWarnings.forEach(d => {
      if (d.derivedWarnings.noNextStep) warningCounts.noNextStep++;
      if (d.derivedWarnings.singleThreaded) warningCounts.singleThreaded++;
      if (d.derivedWarnings.noClosePlan) warningCounts.noClosePlan++;
      if (d.derivedWarnings.staleGt14d) warningCounts.staleGt14d++;
      if (d.derivedWarnings.championLeft) warningCounts.championLeft++;
    });

    let highestKey: keyof typeof warningCounts = 'noNextStep';
    let maxVal = -1;
    Object.entries(warningCounts).forEach(([k, v]) => {
      if (v > maxVal) {
        maxVal = v;
        highestKey = k as any;
      }
    });

    const stageWarnedCount: Record<string, number> = {};
    const stageTotalCount: Record<string, number> = {};
    dealsWithWarnings.forEach(d => {
      const stage = d.stage;
      stageTotalCount[stage] = (stageTotalCount[stage] || 0) + 1;
      if (d.derivedWarnings.activeCount > 0) {
        stageWarnedCount[stage] = (stageWarnedCount[stage] || 0) + 1;
      }
    });

    let mostImpactedStageName = 'None';
    let maxStageWarned = -1;
    Object.entries(stageWarnedCount).forEach(([stg, count]) => {
      if (count > maxStageWarned) {
        maxStageWarned = count;
        mostImpactedStageName = stg;
      }
    });

    const mostImpactedStagePct = warnedCount > 0 && maxStageWarned > 0
      ? Math.round((maxStageWarned / warnedCount) * 100)
      : 0;

    return {
      totalActiveDeals: { value: totalActive, deltaVsLast30Days: Math.max(1, Math.round(totalActive * 0.15)) },
      dealsWithWarnings: { count: warnedCount, pctOfTotal: warnedPct },
      highestRiskWarning: {
        label: WARNING_LABELS[highestKey],
        warningType: highestKey,
        priority: ((highestKey as string) === 'noClosePlan' || (highestKey as string) === 'championLeft') ? 'medium' : 'high'
      },
      mostImpactedStage: { stage: mostImpactedStageName, pctImpacted: mostImpactedStagePct },
      warningTrend: { value: 12, direction: 'up' }
    };
  }, [dealsWithWarnings]);

  // 2. Dynamic Risk Matrix Calculations
  const matrixData = useMemo<RiskMatrixResponse | null>(() => {
    if (dealsWithWarnings.length === 0) return null;

    const repGroups: Record<string, any[]> = {};
    dealsWithWarnings.forEach(d => {
      const repName = d.assignedRep || d.owner?.name || 'Unknown Rep';
      if (!repGroups[repName]) {
        repGroups[repName] = [];
      }
      repGroups[repName].push(d);
    });

    const reps: Rep[] = Object.entries(repGroups).map(([repName, repDeals]) => {
      const totalDeals = repDeals.length;
      const getWarningPct = (key: 'noNextStep' | 'singleThreaded' | 'noClosePlan' | 'staleGt14d' | 'championLeft') => {
        const warnedCount = repDeals.filter(d => d.derivedWarnings[key]).length;
        return { pct: totalDeals > 0 ? Math.round((warnedCount / totalDeals) * 100) : 0 };
      };

      return {
        repId: `rep-${repName.toLowerCase().replace(/\s+/g, '-')}`,
        repName,
        role: 'Enterprise AE',
        totalDeals,
        warnings: {
          noNextStep: getWarningPct('noNextStep'),
          singleThreaded: getWarningPct('singleThreaded'),
          noClosePlan: getWarningPct('noClosePlan'),
          staleGt14d: getWarningPct('staleGt14d'),
          championLeft: getWarningPct('championLeft'),
        }
      };
    });

    return { reps };
  }, [dealsWithWarnings]);

  // Column team averages and "Coaching Needed" checks
  const teamAverageRates = useMemo(() => {
    const totalDeals = dealsWithWarnings.length;
    if (totalDeals === 0) {
      return { noNextStep: 0, singleThreaded: 0, noClosePlan: 0, staleGt14d: 0, championLeft: 0 };
    }

    return {
      noNextStep: Math.round((dealsWithWarnings.filter(d => d.derivedWarnings.noNextStep).length / totalDeals) * 100),
      singleThreaded: Math.round((dealsWithWarnings.filter(d => d.derivedWarnings.singleThreaded).length / totalDeals) * 100),
      noClosePlan: Math.round((dealsWithWarnings.filter(d => d.derivedWarnings.noClosePlan).length / totalDeals) * 100),
      staleGt14d: Math.round((dealsWithWarnings.filter(d => d.derivedWarnings.staleGt14d).length / totalDeals) * 100),
      championLeft: Math.round((dealsWithWarnings.filter(d => d.derivedWarnings.championLeft).length / totalDeals) * 100),
    };
  }, [dealsWithWarnings]);

  const teamTrainingNeeded = useMemo(() => {
    return {
      noNextStep: teamAverageRates.noNextStep > TEAM_AVG_BENCHMARKS.noNextStep,
      singleThreaded: teamAverageRates.singleThreaded > TEAM_AVG_BENCHMARKS.singleThreaded,
      noClosePlan: teamAverageRates.noClosePlan > TEAM_AVG_BENCHMARKS.noClosePlan,
      staleGt14d: teamAverageRates.staleGt14d > TEAM_AVG_BENCHMARKS.staleGt14d,
      championLeft: teamAverageRates.championLeft > TEAM_AVG_BENCHMARKS.championLeft,
    };
  }, [teamAverageRates]);

  const trainingColumnsCount = useMemo(() => {
    return Object.values(teamTrainingNeeded).filter(Boolean).length;
  }, [teamTrainingNeeded]);

  const dynamicInsightText = useMemo(() => {
    const columnsWithBadge = Object.entries(teamTrainingNeeded)
      .filter(([_, needed]) => needed)
      .map(([key]) => `"${WARNING_LABELS[key as keyof typeof WARNING_LABELS]}"`);

    if (columnsWithBadge.length > 0) {
      return `${columnsWithBadge.length} of 5 warning columns show team-wide patterns — ${columnsWithBadge.join(', ')} exceed team averages. Team training needed.`;
    }
    return "All warning columns are within team-wide benchmarks. Continue regular monitoring.";
  }, [teamTrainingNeeded]);

  // 3. Dynamic Top At-Risk Deals Calculations
  const atRiskDealsData = useMemo<AtRiskDealsResponse | null>(() => {
    if (dealsWithWarnings.length === 0) return null;

    const mapped: AtRiskDeal[] = dealsWithWarnings.map(d => {
      const activeList: string[] = [];
      if (d.derivedWarnings.noNextStep) activeList.push('no_next_step');
      if (d.derivedWarnings.singleThreaded) activeList.push('single_threaded');
      if (d.derivedWarnings.noClosePlan) activeList.push('no_close_plan');
      if (d.derivedWarnings.staleGt14d) activeList.push('stale_gt14d');
      if (d.derivedWarnings.championLeft) activeList.push('champion_left');

      const amountVal = parseAmount(d.amount);
      const riskScore = d.playbookScore ? Math.round(100 - d.playbookScore) : (activeList.length * 20);

      return {
        dealId: d.dealId || d.id,
        accountName: d.company || d.name?.split(' - ')[0] || 'Unknown Account',
        repName: d.assignedRep || d.owner?.name || 'Unknown Rep',
        dealAmount: amountVal,
        crmStage: d.stage,
        closeDate: d.closeDate || '2026-06-30',
        warningTypes: activeList,
        daysFlagged: d.flagCount ? d.flagCount * 5 : 0,
        riskScore,
      };
    });

    const sorted = [...mapped].sort((a, b) => b.warningTypes.length - a.warningTypes.length);

    return {
      totalCount: sorted.length,
      deals: sorted,
    };
  }, [dealsWithWarnings]);

  // 4. Dynamic AI Insights Generation
  const aiInsightsData = useMemo<AiInsightsResponse | null>(() => {
    if (dealsWithWarnings.length === 0) return null;

    const insights: AiInsight[] = [];

    const systemicColumns = Object.entries(teamAverageRates)
      .filter(([_, rate]) => rate > 40)
      .map(([key]) => WARNING_LABELS[key as keyof typeof WARNING_LABELS]);

    if (systemicColumns.length >= 3) {
      insights.push({
        id: 'i-systemic',
        priority: 'high',
        avatarColor: '#E53935',
        type: 'SYSTEMIC RISK',
        insight: `${systemicColumns.length} of 5 warning columns show team-wide patterns — ${systemicColumns.map(s => `"${s}"`).join(', ')} all show ⚠. Team training needed. Systemic process gap — escalate to enablement.`,
        recommendation: 'Schedule team-wide enablement session',
        tags: [`${systemicColumns.length} of 5 columns affected team-wide`],
      });
    }

    let maxFreqKey: keyof typeof teamAverageRates = 'noNextStep';
    let maxFreqVal = -1;
    Object.entries(teamAverageRates).forEach(([k, v]) => {
      if (v > maxFreqVal) {
        maxFreqVal = v;
        maxFreqKey = k as any;
      }
    });

    if (maxFreqVal > 0) {
      insights.push({
        id: 'i-winrate',
        priority: 'high',
        avatarColor: '#E53935',
        type: 'WIN RATE IMPACT',
        insight: `"${WARNING_LABELS[maxFreqKey]}" reduces win rate by 38% — team-wide exposure at ~${maxFreqVal}%. Historically, deals with "${WARNING_LABELS[maxFreqKey]}" active win 38% less often.`,
        recommendation: `Prioritise "${WARNING_LABELS[maxFreqKey]}" resolution — highest win rate impact`,
        tags: [`Win rate impact: -38% · Team exposure: ~${maxFreqVal}%`],
      });
    }

    if (matrixData) {
      matrixData.reps.forEach(rep => {
        Object.entries(rep.warnings).forEach(([k, v]) => {
          const wKey = k as keyof typeof teamAverageRates;
          const repRate = v.pct;
          const teamRate = teamAverageRates[wKey];
          if (repRate - teamRate >= 20) {
            insights.push({
              id: `i-benchmark-${rep.repId}-${wKey}`,
              priority: 'medium',
              avatarColor: '#FB8C00',
              type: 'BENCHMARK',
              insight: `${rep.repName} is ${repRate - teamRate}% above team average on ${WARNING_LABELS[wKey]}. ${rep.repName}'s ${WARNING_LABELS[wKey]} rate (${repRate}%) is ${repRate - teamRate}% above team average (${teamRate}%).`,
              recommendation: `Focus next 1-on-1 with ${rep.repName} on stakeholder mapping`,
              rep: rep.repName,
              tags: [`${repRate}% vs ${teamRate}% team avg (+${repRate - teamRate}%)`],
            });
          }
        });
      });
    }

    dealsWithWarnings.forEach((d, idx) => {
      if (d.derivedWarnings.activeCount >= 2 && d.closeDate) {
        const closeDateObj = new Date(d.closeDate);
        const now = new Date();
        const diffMs = closeDateObj.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          const amt = parseAmount(d.amount);
          insights.push({
            id: `i-slip-${d.dealId || d.id}-${idx}`,
            priority: 'high',
            avatarColor: '#E53935',
            type: 'SLIP RISK',
            insight: `${d.company || d.name.split(' - ')[0]} likely to slip 12 days past close date. Based on warning patterns, ${d.company || d.name.split(' - ')[0]} ($${amt.toLocaleString()}) is predicted to slip ~12 days.`,
            recommendation: `Accelerate close plan for ${d.company || d.name.split(' - ')[0]} to prevent quarter-end slip`,
            rep: d.assignedRep || d.owner?.name,
            account: d.company || d.name.split(' - ')[0],
            tags: ['Predicted slip: +12 days'],
          });
        }
      }
    });

    return { insights };
  }, [dealsWithWarnings, teamAverageRates, matrixData]);

  const dynamicRevenueAtRisk = useMemo(() => {
    let totalRiskAmt = 0;
    dealsWithWarnings.forEach(d => {
      if (d.derivedWarnings.activeCount > 0) {
        totalRiskAmt += parseAmount(d.amount);
      }
    });

    if (totalRiskAmt >= 1000000) {
      return `$${(totalRiskAmt / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(totalRiskAmt / 1000)}K`;
  }, [dealsWithWarnings]);

  // 5. Dynamic Cell Click Drill-down Calculations
  const handleCellClick = (repId: string, repName: string, warning: string, warningLabel: string) => {
    const repDeals = dealsWithWarnings.filter(d => (d.assignedRep || d.owner?.name || 'Unknown Rep') === repName);

    const flagged = warning === 'all'
      ? repDeals
      : repDeals.filter(d => {
        const wKey = warning as 'noNextStep' | 'singleThreaded' | 'noClosePlan' | 'staleGt14d' | 'championLeft';
        return d.derivedWarnings[wKey];
      });

    const flaggedDealsMapped = flagged.map((d, i) => {
      const closeDateVal = d.closeDate || '2026-06-30';

      const closeDateObj = new Date(closeDateVal);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);
      closeDateObj.setHours(0, 0, 0, 0);

      const diffMs = closeDateObj.getTime() - todayObj.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let closeDateStatus: CloseDateStatus = 'ok';
      if (diffDays < 0) {
        closeDateStatus = 'overdue';
      } else if (diffDays <= 15) {
        closeDateStatus = 'soon';
      }

      return {
        rank: i + 1,
        dealId: d.dealId || d.id,
        accountName: d.company || d.name?.split(' - ')[0] || 'Unknown Account',
        dealAmount: parseAmount(d.amount),
        crmStage: d.stage,
        closeDate: closeDateVal,
        closeDateStatus,
        daysFlagged: d.flagCount ? d.flagCount * 5 : 5,
        daysFlaggedStatus: 'low' as DaysFlaggedStatus,
      };
    });

    const totalValueAtRisk = flaggedDealsMapped.reduce((sum, f) => sum + f.dealAmount, 0);

    const coachingTips = {
      noNextStep: 'Schedule a follow-up action with the champion immediately to establish next steps.',
      singleThreaded: 'Map additional key stakeholders and identify the economic buyer.',
      noClosePlan: 'Draft a formal close plan and align it with the client\'s decision process.',
      staleGt14d: 'Re-engage the client with a value offer or check if the project has been deprioritized.',
      championLeft: 'Identify and contact the new primary stakeholder to re-qualify the deal.',
      all: 'Review all deal progress, active warnings, and next steps in the next 1-on-1.'
    };

    const warningKey = warning as keyof typeof coachingTips;
    const warningRateValue = repDeals.length > 0
      ? Math.round((repDeals.filter(d => d.derivedWarnings.activeCount > 0).length / repDeals.length) * 100)
      : 0;

    const drilldownResponse: DrilldownResponse = {
      rep: { id: repId, name: repName, role: 'Enterprise AE', initials: repName.split(' ').map(n => n[0]).join('').toUpperCase() },
      summary: {
        dealsFlagged: flagged.length,
        totalValueAtRisk,
        avgCloseDate: flagged.length > 0 ? flagged[0].closeDate || '2026-06-30' : '2026-06-30',
        warningTrend: 8.3
      },
      flaggedDeals: flaggedDealsMapped,
      repSidebar: {
        warningRate: warningRateValue,
        dealsInPipeline: repDeals.length,
        avgCloseRate: 31.2,
        aiCoachingTip: coachingTips[warningKey] || 'Review deal warnings in the next 1-on-1.'
      }
    };

    setSelectedDrilldown(drilldownResponse);
    setDrilldownMeta({ repId, repName, warningType: warning, warningLabel });
  };

  // Matrix CSV Export
  const handleExportRiskMatrix = () => {
    if (!matrixData) return;
    const headers = ['Rep Name', 'Total Deals', 'No Next Step %', 'Single-threaded %', 'No Close Plan %', 'Stale >14d %', 'Champion Left %'];
    const rows = matrixData.reps.map(r => [
      r.repName,
      r.totalDeals,
      `${r.warnings.noNextStep.pct}%`,
      `${r.warnings.singleThreaded.pct}%`,
      `${r.warnings.noClosePlan.pct}%`,
      `${r.warnings.staleGt14d.pct}%`,
      `${r.warnings.championLeft.pct}%`
    ]);

    const csvContent = '\ufeff' + [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    triggerDownload(csvContent, `${selectedBoardName.toLowerCase().replace(/\s+/g, '-')}-risk-matrix.csv`);
  };

  // Drilldown CSV Export
  const handleExportDrilldown = () => {
    if (!selectedDrilldown || !drilldownMeta) return;
    const headers = ['Account Name', 'Amount', 'CRM Stage', 'Close Date', 'Close Date Status'];
    const rows = selectedDrilldown.flaggedDeals.map(d => [
      d.accountName,
      `$${d.dealAmount}`,
      d.crmStage,
      d.closeDate,
      d.closeDateStatus
    ]);

    const csvContent = '\ufeff' + [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    triggerDownload(csvContent, `${drilldownMeta.repName.toLowerCase().replace(/\s+/g, '-')}-${drilldownMeta.warningType}-drilldown.csv`);
  };

  const triggerDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = period === 'Now' ? 'Now' : period === 'LAST_7_DAYS' ? 'Last 7 days' : period === 'LAST_90_DAYS' ? 'Last 90 days' : 'Last 30 days';

  /* ───────── pill‑style tab button ───────── */
  const pillBase: React.CSSProperties = {
    padding: '7px 18px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: '1.3',
    whiteSpace: 'nowrap',
  };
  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: '#1e293b',
    color: '#fff',
    borderColor: '#1e293b',
  };
  const pillInactive: React.CSSProperties = {
    ...pillBase,
    background: '#fff',
    color: '#374151',
    borderColor: '#e5e7eb',
  };

  return (
    <div className="deal-drivers-scope" style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8f8fa', overflowY: 'auto', overflowX: 'hidden', padding: 20, paddingBottom: 40, minHeight: '100%', position: 'relative' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2, fontFamily: 'inherit' }}>Deal Drivers</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, margin: 0 }}>Track recurring deal risks, identify warning patterns, and focus on deals that need attention most.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Board Selector */}
          <select
            value={selectedBoardId}
            onChange={e => setSelectedBoardId(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', minWidth: 150, cursor: 'pointer', color: '#374151', fontWeight: 500 }}
          >
            {boards.map(b => (
              <option key={b.boardId} value={b.boardId}>{b.name}</option>
            ))}
          </select>

          {/* Period Selector */}
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', minWidth: 70, cursor: 'pointer', color: '#374151', fontWeight: 500 }}
          >
            <option value="Now">Now</option>
            <option value="LAST_7_DAYS">Last 7 days</option>
            <option value="LAST_30_DAYS">Last 30 days</option>
            <option value="LAST_90_DAYS">Last 90 days</option>
          </select>

          <RoleBadge role="sales_manager" />
        </div>
      </div>

      {/* ── Main Content ── */}
      {loading ? (
        <div className="loading" style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading deals data...</div>
      ) : (
        <>
          {/* Context Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ background: '#3b82f6', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={15} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: 14 }}>
                My Deals — {selectedBoardName} · {periodLabel}
              </div>
              <div style={{ color: '#2563eb', fontSize: 12 }}>
                Showing risk data across your {dealsWithWarnings.length} active deals on this board.
              </div>
            </div>
          </div>

          {/* KPI Cards Row */}
          {summaryData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
              {/* Total Active Deals */}
              <div className="kpi-card">
                <div className="kpi-label">Total Active Deals</div>
                <div className="kpi-value">{summaryData.totalActiveDeals.value}</div>
                <div className="kpi-delta" style={{ color: '#2563eb' }}>↑ {summaryData.totalActiveDeals.deltaVsLast30Days} vs last 30 days</div>
              </div>
              {/* Deals with Warnings */}
              <div className="kpi-card">
                <div className="kpi-label">Deals with Warnings</div>
                <div className="kpi-value">{summaryData.dealsWithWarnings.count}</div>
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{summaryData.dealsWithWarnings.pctOfTotal}% of your deals</div>
              </div>
              {/* Highest Risk Warning — with orange left border */}
              <div className="kpi-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                <div className="kpi-label">Highest Risk Warning</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginTop: 2 }}>{summaryData.highestRiskWarning.label}</div>
                <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>⚠ {summaryData.highestRiskWarning.priority === 'high' ? 'High' : 'Medium'} priority</div>
              </div>
              {/* Most Impacted Stage */}
              <div className="kpi-card">
                <div className="kpi-label">Most Impacted Stage</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginTop: 2 }}>{summaryData.mostImpactedStage.stage}</div>
                <div className="kpi-delta muted">{summaryData.mostImpactedStage.pctImpacted}% of impacted deals</div>
              </div>
              {/* Warning Trend */}
              <div className="kpi-card">
                <div className="kpi-label">Warning Trend</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626', lineHeight: 1.1 }}>↑ {summaryData.warningTrend.value}%</div>
                <div className="kpi-delta muted">Increase in risks</div>
              </div>
            </div>
          )}

          {/* Pill‑style Tabs Row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={tab === t.key ? pillActive : pillInactive}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'risk-matrix' && matrixData && atRiskDealsData && (
            <RiskMatrix
              reps={matrixData.reps}
              teamAvg={teamAverageRates}
              insight={dynamicInsightText}
              topDeals={atRiskDealsData.deals}
              onCellClick={handleCellClick}
              onExportCSV={handleExportRiskMatrix}
              onViewAllTopDeals={() => setTab('top-at-risk')}
            />
          )}
          {tab === 'compare-periods' && matrixData && (
            <ComparePeriods
              reps={matrixData.reps}
              boardName={selectedBoardName}
              boards={boards}
              selectedBoardId={selectedBoardId}
              onBoardChange={setSelectedBoardId}
            />
          )}
          {tab === 'top-at-risk' && atRiskDealsData && (
            <TopAtRiskDeals deals={atRiskDealsData.deals} />
          )}
          {tab === 'ai-insights' && aiInsightsData && (
            <AiInsights
              insights={aiInsightsData.insights}
              bannerText={`${trainingColumnsCount} of 5 columns affected team-wide. ${dynamicRevenueAtRisk} revenue at risk. Escalate enablement.`}
            />
          )}

          {/* Drilldown Drawer Panel */}
          {selectedDrilldown && drilldownMeta && (
            <DrilldownPanel
              data={selectedDrilldown}
              repName={drilldownMeta.repName}
              warningLabel={drilldownMeta.warningLabel}
              warningType={drilldownMeta.warningType}
              period={period}
              onClose={() => { setSelectedDrilldown(null); setDrilldownMeta(null); }}
              onExport={handleExportDrilldown}
            />
          )}
        </>
      )}

      {/* Floating Action Button for AI Insights */}
      <button
        onClick={() => setTab('ai-insights')}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 48, height: 48, background: '#7c3aed', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(124,58,237,0.4)', border: 'none', cursor: 'pointer', zIndex: 50, transition: 'all 0.2s' }}
        title="View AI Insights"
      >
        <Sparkles size={22} />
      </button>
    </div>
  );
}

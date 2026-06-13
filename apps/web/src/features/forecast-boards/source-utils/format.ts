export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined) return '-';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseCurrencyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function calculateTargetAttainment(closed: number, commit: number | null | undefined, quota: number | null | undefined): number | null {
  if (!quota || quota <= 0) return null;
  return Math.round(((closed + Math.max(0, commit ?? 0)) / quota) * 100);
}

export function formatAttainmentPct(pct: number | null): string {
  if (pct === null) return '-';
  return `${Math.round(pct)}%`;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  return error instanceof Error ? error.message : fallback;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function parseCustomMonth(periodName: string): { month: string; year: string } | null {
  const parts = periodName.trim().split(/\s+/);
  if (parts.length === 2) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    if (months.includes(parts[0].toLowerCase())) {
      const yearNum = parseInt(parts[1], 10);
      if (!isNaN(yearNum)) {
        return { month: parts[0], year: parts[1] };
      }
    }
  }
  return null;
}

export function mapMonthToQuarterId(monthStr: string, yearStr: string): string {
  const monthMap: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  const m = monthMap[monthStr.toLowerCase()];
  if (!m) return 'q2-fy26-demo'; // default fallback
  
  let quarter = 2;
  if (m >= 1 && m <= 3) quarter = 1;
  else if (m >= 4 && m <= 6) quarter = 2;
  else if (m >= 7 && m <= 9) quarter = 3;
  else if (m >= 10 && m <= 12) quarter = 4;
  
  const yy = yearStr.slice(-2);
  return `q${quarter}-fy${yy}-demo`;
}

export function formatPeriodId(periodName: string): string {
  if (!periodName) return '';
  const custom = parseCustomMonth(periodName);
  if (custom) {
    return mapMonthToQuarterId(custom.month, custom.year);
  }
  return resolvePeriodIdFromLabel(periodName);
}

// 2) Parse from string label like "Q2 FY26" into "00000000-0000-0000-0000-0000000000b2"
export function resolvePeriodIdFromLabel(label: string): string {
  const clean = label.trim().toLowerCase();
  if (clean === 'q2 fy26') return '00000000-0000-0000-0000-0000000000b2';
  if (clean === 'q1 fy26') return '00000000-0000-0000-0000-0000000000b1';
  if (clean === 'q4 fy25') return 'q4-fy25-demo';
  if (clean === 'q2 fy25') return 'q2-fy25-demo';
  return `period-${clean.replace(/\s+/g, '-')}`;
}

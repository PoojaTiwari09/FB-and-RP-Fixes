import type { ConfidenceLevel, RiskLevel } from '../types';

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);

export function fL(v = 0) {
  return `₹${(v / 100000).toFixed(0)}L`;
}

export function fCr(v = 0) {
  return `₹${(v / 10000000).toFixed(1)}Cr`;
}

export function getConfidenceColor(level: ConfidenceLevel) {
  if (level === 'High') return { bg: '#DCFCE7', text: '#16A34A' };
  if (level === 'Medium') return { bg: '#FEF3C7', text: '#D97706' };
  return { bg: '#FEE2E2', text: '#DC2626' };
}

export function getRiskColor(level: RiskLevel) {
  if (level === 'LOW') return { bg: '#DCFCE7', text: '#16A34A' };
  if (level === 'MEDIUM') return { bg: '#FEF3C7', text: '#D97706' };
  return { bg: '#FEE2E2', text: '#DC2626' };
}

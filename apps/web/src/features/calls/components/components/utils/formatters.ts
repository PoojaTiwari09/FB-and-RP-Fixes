// ============================================================
// Utility / formatter functions for the Calls module
// ============================================================

/**
 * Format an ISO date string to a readable date: "May 3"
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format an ISO date string to a readable time: "4:00 PM"
 */
export function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
}

/**
 * Format a full ISO date to "May 19, 2026 at 2:45 PM"
 */
export function formatFullDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${date} at ${time}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string like "2026-05-22" to "May 22, 2026"
 */
export function formatDueDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string to "May 22" (short)
 */
export function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string like "2026-05-24" to "Week of May 24" 
 */
export function formatWeekDate(dateStr: string): string {
  return `Week of ${formatShortDate(dateStr)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Get status color classes for badges
 */
export function getStatusStyles(status: string): { bg: string; text: string; icon: string } {
  switch (status) {
    case 'completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✓' };
    case 'processing':
      return { bg: 'bg-blue-50', text: 'text-blue-700', icon: '⟳' };
    case 'failed':
      return { bg: 'bg-red-50', text: 'text-red-700', icon: '✕' };
    case 'skipped':
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '—' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '' };
  }
}

/**
 * Get deal type badge color classes
 */
export function getDealTypeStyles(dealType: string): string {
  switch (dealType) {
    case 'New Business':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Renewal':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Expansion':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Get severity badge classes for risks
 */
export function getSeverityStyles(severity: string): { bg: string; text: string } {
  switch (severity) {
    case 'high':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'medium':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'low':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}

/**
 * Get activity type badge classes
 */
export function getActivityTypeStyles(type: string): { bg: string; text: string; border: string } {
  switch (type) {
    case 'email':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'call':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'meeting':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  }
}

/**
 * Avatar background color by initials
 */
export function getAvatarColor(initials: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-amber-500',
    'bg-cyan-500',
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Shared utility functions — single source of truth
 */
import { SEVERITY_LABELS } from '@/types';

// ── Date formatting ──────────────────────────────────────────────────────────

export function fmtDate(d?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', opts ?? {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return '—'; }
}

export function fmtDateShort(d?: string | null): string {
  return fmtDate(d, { day: 'numeric', month: 'short' });
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

// ── Badge helpers ────────────────────────────────────────────────────────────

export function priorityBadge(p?: string | null): string {
  if (p === 'urgent')   return 'badge badge-urgent';
  if (p === 'priority') return 'badge badge-priority';
  return 'badge badge-routine';
}

export function qualityBadge(q?: string | null): string {
  if (q === 'good')       return 'badge badge-good';
  if (q === 'acceptable') return 'badge badge-acceptable';
  return 'badge badge-poor';
}

export function severityClass(s: number): string {
  return (['sev-0', 'sev-1', 'sev-2', 'sev-3', 'sev-4'] as const)[s] ?? 'badge-neutral';
}

export function severityLabel(s?: number | null): string {
  if (s == null) return '—';
  return SEVERITY_LABELS[s] ?? '—';
}

// ── Confidence helpers ───────────────────────────────────────────────────────

export function confFill(c: number): string {
  if (c >= 0.80) return 'bg-emerald-400';
  if (c >= 0.60) return 'bg-amber-400';
  return 'bg-red-400';
}

export function confPct(c?: number | null): string {
  return `${((c ?? 0) * 100).toFixed(1)}%`;
}

// ── Result state helpers ─────────────────────────────────────────────────────

/** Returns true when the model detected a possible DR-related abnormality */
export function isDiabetic(severity?: number | null): boolean {
  return (severity ?? 0) > 0;
}

/** Determine high-level result state from severity */
export type ResultState = 'normal' | 'abnormal' | 'uncertain';
export function getResultState(
  severity?: number | null,
  statusIsQualityFailed?: boolean,
): ResultState {
  if (statusIsQualityFailed || severity == null) return 'uncertain';
  if (severity === 0) return 'normal';
  return 'abnormal';
}

/**
 * Primary screening message — safe clinical wording.
 * Uses STATE A / B / C terminology from project brief.
 */
export function getScreeningMessage(severity?: number | null): string {
  if (severity == null) return 'Unable to reliably analyse';
  if (severity === 0)   return 'No supported abnormality detected';
  const label = SEVERITY_LABELS[severity] ?? 'abnormality';
  return `Possible ${label} detected`;
}

/**
 * Legacy theme helper — kept for backwards compatibility with any
 * remaining components that still call getDiabetesTheme.
 */
export interface DiabetesStatusTheme {
  border:  string;
  bg:      string;
  iconBg:  string;
  heading: string;
  sub:     string;
  icon:    'alert' | 'check';
}

export function getDiabetesTheme(severity: number): DiabetesStatusTheme {
  if (severity === 0) {
    return {
      border: 'border-emerald-300', bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-600',
      heading: 'text-emerald-800', sub: 'text-emerald-600', icon: 'check',
    };
  }
  if (severity >= 3) {
    return {
      border: 'border-red-300', bg: 'bg-red-50',
      iconBg: 'bg-red-600',
      heading: 'text-red-800', sub: 'text-red-600', icon: 'alert',
    };
  }
  return {
    border: 'border-amber-300', bg: 'bg-amber-50',
    iconBg: 'bg-amber-600',
    heading: 'text-amber-800', sub: 'text-amber-600', icon: 'alert',
  };
}

// ── Number formatting ────────────────────────────────────────────────────────

export function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export function safeJson<T>(json?: string | null, fallback: T = [] as unknown as T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; }
  catch { return fallback; }
}

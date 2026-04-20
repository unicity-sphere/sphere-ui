import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  /** Short uppercase label above the value. */
  label:  string;
  /** Primary number to display. Formatted with toLocaleString() by default. */
  value:  number | string;
  /** Optional icon (lucide-react component). Rendered in accent color at 16px. */
  icon?:  ReactNode;
  /**
   * Previous-period value; when provided, renders a trend pill showing
   * percent delta (+23%) colored green/red/neutral accordingly.
   */
  previousValue?: number;
  /** Hint shown below the value (e.g. "vs previous 30 days"). */
  hint?:  string;
  /** Tooltip for the whole card — useful to explain derived metrics. */
  title?: string;
  /** Custom value formatter (e.g. percent "{v}%" or decimal formatting). */
  format?: (value: number | string) => string;
  /** Override accent — defaults to --accent CSS var. */
  accentColor?: string;
  className?: string;
}

function defaultFormat(value: number | string): string {
  if (typeof value === 'number') return value.toLocaleString();
  return value;
}

/**
 * Single KPI tile — title, value, optional delta-vs-previous badge.
 * Same shape as dev-portal's admin-card pattern so both frontends
 * render KPIs identically.
 */
export function KPICard({
  label,
  value,
  icon,
  previousValue,
  hint,
  title,
  format = defaultFormat,
  accentColor,
  className = '',
}: KPICardProps) {
  const trend = computeTrend(value, previousValue);

  return (
    <div
      title={title}
      className={`rounded-xl border border-[var(--border,rgba(255,255,255,0.08))] bg-[var(--surface,rgba(255,255,255,0.02))] p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="shrink-0" style={{ color: accentColor ?? 'var(--accent, #FF6F00)' }}>
              {icon}
            </span>
          )}
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted,rgba(255,255,255,0.6))] truncate">
            {label}
          </span>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${trend.className}`}
            aria-label={`${trend.direction} ${trend.absPercent}% vs previous period`}
          >
            {trend.Icon}
            {trend.sign}{trend.absPercent}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary,#fff)] font-mono tabular-nums">
        {format(value)}
      </div>
      {hint && (
        <div className="text-[10px] text-[var(--text-muted,rgba(255,255,255,0.4))] mt-1">
          {hint}
        </div>
      )}
    </div>
  );
}

interface TrendInfo {
  direction:  'up' | 'down' | 'flat';
  sign:       '+' | '-' | '';
  absPercent: number;
  className:  string;
  Icon:       ReactNode;
}

function computeTrend(value: number | string, previousValue?: number): TrendInfo | null {
  if (previousValue === undefined) return null;
  if (typeof value !== 'number')    return null;

  if (previousValue === 0) {
    if (value === 0) {
      return {
        direction: 'flat', sign: '', absPercent: 0,
        className: 'bg-[var(--surface-hover,rgba(255,255,255,0.04))] text-[var(--text-muted,rgba(255,255,255,0.5))]',
        Icon: <Minus className="w-2.5 h-2.5" />,
      };
    }
    // Can't compute percent vs 0 — show "new" indicator as an up-trend.
    return {
      direction: 'up', sign: '+', absPercent: 100,
      className: 'bg-emerald-500/10 text-emerald-400',
      Icon: <TrendingUp className="w-2.5 h-2.5" />,
    };
  }

  const delta = ((value - previousValue) / previousValue) * 100;
  const absPercent = Math.round(Math.abs(delta));

  if (absPercent === 0) {
    return {
      direction: 'flat', sign: '', absPercent: 0,
      className: 'bg-[var(--surface-hover,rgba(255,255,255,0.04))] text-[var(--text-muted,rgba(255,255,255,0.5))]',
      Icon: <Minus className="w-2.5 h-2.5" />,
    };
  }

  if (delta > 0) {
    return {
      direction: 'up', sign: '+', absPercent,
      className: 'bg-emerald-500/10 text-emerald-400',
      Icon: <TrendingUp className="w-2.5 h-2.5" />,
    };
  }
  return {
    direction: 'down', sign: '-', absPercent,
    className: 'bg-rose-500/10 text-rose-400',
    Icon: <TrendingDown className="w-2.5 h-2.5" />,
  };
}

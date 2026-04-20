import type { ReactNode } from 'react';

export interface TopEntity {
  id:       string;
  title:    string;
  /** Primary numeric value — drives the ranking and the bar fill. */
  value:    number;
  /** Optional secondary metric (e.g. points per quest). */
  secondary?: number;
  /** Optional prefix icon. */
  icon?:    ReactNode;
}

export interface TopEntitiesTableProps {
  entities: TopEntity[];
  /** Shown above the list. */
  title?:   string;
  /** Label for the primary value column. Default: "Value". */
  valueLabel?: string;
  /** Label for the secondary column (when any row has secondary). */
  secondaryLabel?: string;
  /** Hide the horizontal progress bars. */
  hideBars?: boolean;
  /** Empty-state content when entities is empty. */
  emptyState?: ReactNode;
  /** Override accent for bar fill. */
  accentColor?: string;
  className?: string;
}

/**
 * Ranked list with a horizontal bar fill per row. Used for "top quests",
 * "top installed projects", "top users", etc. — any cross-entity ranking.
 */
export function TopEntitiesTable({
  entities,
  title,
  valueLabel = 'Value',
  secondaryLabel,
  hideBars = false,
  emptyState,
  accentColor,
  className = '',
}: TopEntitiesTableProps) {
  const hasAnySecondary = entities.some(e => e.secondary !== undefined);
  const maxValue = entities.length > 0
    ? Math.max(...entities.map(e => e.value)) || 1
    : 1;

  return (
    <div className={`rounded-xl border border-[var(--border,rgba(255,255,255,0.08))] bg-[var(--surface,rgba(255,255,255,0.02))] p-5 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--text-primary,#fff)] mb-4">
          {title}
        </h3>
      )}

      {entities.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-muted,rgba(255,255,255,0.4))]">
          {emptyState ?? 'No entries'}
        </div>
      ) : (
        <ol className="space-y-2">
          {entities.map((e, i) => {
            const pct = hideBars ? 0 : Math.round((e.value / maxValue) * 100);
            return (
              <li key={e.id} className="group">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted,rgba(255,255,255,0.35))] w-5 shrink-0">
                      {i + 1}.
                    </span>
                    {e.icon && <span className="shrink-0">{e.icon}</span>}
                    <span className="text-xs font-medium text-[var(--text-primary,#fff)] truncate">
                      {e.title}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    {hasAnySecondary && e.secondary !== undefined && (
                      <span className="text-[10px] text-[var(--text-muted,rgba(255,255,255,0.5))] font-mono tabular-nums">
                        {e.secondary.toLocaleString()}{secondaryLabel ? ` ${secondaryLabel}` : ''}
                      </span>
                    )}
                    <span
                      className="text-xs font-bold font-mono tabular-nums"
                      style={{ color: accentColor ?? 'var(--accent, #FF6F00)' }}
                      aria-label={`${e.value} ${valueLabel}`}
                    >
                      {e.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                {!hideBars && (
                  <div className="h-1.5 rounded-full bg-[var(--surface-hover,rgba(255,255,255,0.04))] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: accentColor ?? 'var(--accent, #FF6F00)',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export type DateRangePreset = '1d' | '7d' | '30d' | '90d';
export type DateRangeLabel = DateRangePreset | 'custom';

export interface DateRangeValue {
  label: DateRangeLabel;
  /** ISO date string (YYYY-MM-DD). Only present when label === 'custom'. */
  from?: string;
  to?:   string;
}

export interface DateRangePickerProps {
  value:    DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  /**
   * Presets to show. Defaults to the full set the analytics API accepts.
   * Reduce if a particular view doesn't benefit from every preset.
   */
  presets?: DateRangePreset[];
  className?: string;
}

const DEFAULT_PRESETS: DateRangePreset[] = ['1d', '7d', '30d', '90d'];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  '1d':  '1 day',
  '7d':  '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Unified range selector used across admin and developer analytics.
 * Emits a normalized DateRangeValue that maps 1:1 to the backend
 * ?range=... query: presets pass the label, "custom" passes from+to.
 */
export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className = '',
}: DateRangePickerProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom]   = useState(value.from ?? daysAgoIso(30));
  const [draftTo,   setDraftTo]     = useState(value.to   ?? todayIso());
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside closes the custom panel without applying
  useEffect(() => {
    if (!customOpen) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setCustomOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [customOpen]);

  function selectPreset(preset: DateRangePreset) {
    setCustomOpen(false);
    onChange({ label: preset });
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    if (draftFrom >= draftTo) return;
    setCustomOpen(false);
    onChange({ label: 'custom', from: draftFrom, to: draftTo });
  }

  const customInvalid = !draftFrom || !draftTo || draftFrom >= draftTo;
  const isCustom = value.label === 'custom';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex items-center rounded-lg border border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--surface,rgba(255,255,255,0.02))] overflow-hidden"
      >
        {presets.map((preset) => {
          const active = value.label === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => selectPreset(preset)}
              aria-pressed={active}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[var(--accent,#FF6F00)] text-white'
                  : 'text-[var(--text-muted,rgba(255,255,255,0.6))] hover:text-[var(--text-primary,#fff)] hover:bg-[var(--surface-hover,rgba(255,255,255,0.04))]'
              }`}
            >
              {preset}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          aria-pressed={isCustom}
          aria-expanded={customOpen}
          aria-label="Custom date range"
          className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors border-l border-[var(--border,rgba(255,255,255,0.1))] ${
            isCustom
              ? 'bg-[var(--accent,#FF6F00)] text-white'
              : 'text-[var(--text-muted,rgba(255,255,255,0.6))] hover:text-[var(--text-primary,#fff)] hover:bg-[var(--surface-hover,rgba(255,255,255,0.04))]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isCustom && value.from && value.to
            ? `${value.from} — ${value.to}`
            : 'Custom'}
        </button>
      </div>

      {customOpen && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 p-3 rounded-lg border border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--surface,#0f0f13)] shadow-xl z-50 min-w-[260px]"
        >
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-[var(--text-muted,rgba(255,255,255,0.5))]">
              From
              <input
                type="date"
                value={draftFrom}
                max={draftTo}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm rounded border border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--input-bg,rgba(255,255,255,0.03))] text-[var(--text-primary,#fff)] focus:outline-none focus:border-[var(--accent,#FF6F00)]"
              />
            </label>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--text-muted,rgba(255,255,255,0.5))]">
              To
              <input
                type="date"
                value={draftTo}
                min={draftFrom}
                max={todayIso()}
                onChange={(e) => setDraftTo(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm rounded border border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--input-bg,rgba(255,255,255,0.03))] text-[var(--text-primary,#fff)] focus:outline-none focus:border-[var(--accent,#FF6F00)]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={applyCustom}
            disabled={customInvalid}
            className="mt-3 w-full py-1.5 text-xs font-semibold rounded bg-[var(--accent,#FF6F00)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export { PRESET_LABELS as dateRangePresetLabels };

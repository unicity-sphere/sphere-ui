import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CustomSelect({
  options, value, onChange, placeholder, className = '', size = 'md',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);
  const label = selected?.label ?? placeholder ?? 'Select...';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`admin-input w-full flex items-center justify-between gap-2 ${textSize} text-left`}
        style={{ color: selected ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <span className="truncate">{label}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 transition-transform"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-30 py-1 max-h-48 overflow-y-auto"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 ${textSize} transition-colors`}
              style={{
                color: opt.value === value ? 'var(--accent-text)' : 'var(--text-secondary)',
                background: opt.value === value ? 'var(--accent-glow)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (opt.value !== value) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = opt.value === value ? 'var(--accent-glow)' : 'transparent';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

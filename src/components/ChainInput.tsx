import { useState, useId } from 'react';

const TAG_PALETTES = [
  { bg: 'rgba(16, 185, 129, 0.12)',  color: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  { bg: 'rgba(59, 130, 246, 0.12)',  color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
  { bg: 'rgba(168, 85, 247, 0.12)',  color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' },
  { bg: 'rgba(6, 182, 212, 0.12)',   color: '#22d3ee', border: 'rgba(6, 182, 212, 0.2)' },
  { bg: 'rgba(245, 158, 11, 0.12)',  color: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' },
  { bg: 'rgba(244, 63, 94, 0.12)',   color: '#fb7185', border: 'rgba(244, 63, 94, 0.2)' },
  { bg: 'rgba(255, 111, 0, 0.12)',   color: '#FF6F00', border: 'rgba(255, 111, 0, 0.2)' },
  { bg: 'rgba(132, 204, 22, 0.12)',  color: '#a3e635', border: 'rgba(132, 204, 22, 0.2)' },
  { bg: 'rgba(236, 72, 153, 0.12)',  color: '#f472b6', border: 'rgba(236, 72, 153, 0.2)' },
  { bg: 'rgba(99, 102, 241, 0.12)',  color: '#818cf8', border: 'rgba(99, 102, 241, 0.2)' },
];

export function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  return TAG_PALETTES[Math.abs(hash) % TAG_PALETTES.length];
}

export function ChainInput({ chains, suggestions, onChange, size = 'md' }: {
  chains:      Record<string, number>;
  suggestions: string[];
  onChange:    (chains: Record<string, number>) => void;
  size?:       'sm' | 'md';
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputId = useId();

  const entries = Object.entries(chains);
  const available = suggestions.filter(s => !(s in chains) && (!input || s.toLowerCase().includes(input.toLowerCase())));
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, '_');
  const isNew = trimmed && !(trimmed in chains) && !available.includes(trimmed);

  const addChain = (name: string) => {
    const normalized = name.trim().toLowerCase().replace(/\s+/g, '_');
    if (normalized && !(normalized in chains)) {
      onChange({ ...chains, [normalized]: 0 });
    }
    setInput('');
    setOpen(false);
  };

  const removeChain = (name: string) => {
    const next = { ...chains };
    delete next[name];
    onChange(next);
  };

  const setOrder = (name: string, order: number) => {
    onChange({ ...chains, [name]: Math.max(0, order) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addChain(input);
    }
    if (e.key === 'Backspace' && !input && entries.length > 0) {
      removeChain(entries[entries.length - 1][0]);
    }
  };

  const isSm = size === 'sm';
  const textSize = isSm ? 'text-[0.6rem]' : 'text-[0.65rem]';
  const minH = isSm ? 'min-h-[32px]' : 'min-h-[38px]';

  return (
    <div className="relative">
      <div
        className={`admin-input flex flex-wrap gap-1.5 !p-1.5 ${minH} cursor-text`}
        onClick={() => (document.getElementById(inputId) as HTMLInputElement)?.focus()}
      >
        {entries.map(([name, order]) => {
          const c = tagColor(name);
          return (
            <span
              key={name}
              className={`inline-flex items-center gap-1 ${textSize} font-semibold px-2 py-0.5 rounded`}
              style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
            >
              {name}
              <input
                type="number"
                min={0}
                value={order}
                onChange={e => setOrder(name, Number(e.target.value))}
                className={`w-7 bg-transparent border-none outline-none text-center ${textSize} font-bold`}
                style={{ color: c.color }}
                onClick={e => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeChain(name); }}
                className="leading-none opacity-60 hover:opacity-100"
              >
                &times;
              </button>
            </span>
          );
        })}
        <input
          id={inputId}
          className={`flex-1 min-w-[60px] bg-transparent border-none outline-none ${isSm ? 'text-[11px]' : 'text-xs'}`}
          style={{ color: 'var(--text-primary)' }}
          placeholder={entries.length === 0 ? 'Add to chain...' : ''}
          value={input}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && (available.length > 0 || isNew) && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-20 py-1 max-h-40 overflow-y-auto"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
        >
          {isNew && (
            <button
              onMouseDown={() => addChain(trimmed)}
              className="block w-full text-left px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--accent-text)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              + Create "{trimmed}"
            </button>
          )}
          {available.map(s => {
            const c = tagColor(s);
            return (
              <button
                key={s}
                onMouseDown={() => addChain(s)}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

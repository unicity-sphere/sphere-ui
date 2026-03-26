import { useState, useEffect, useRef, useCallback } from 'react';

interface JsonPanelProps<T> {
  /** Current form state to display as JSON */
  value: T;
  /** Called when user edits JSON and it parses successfully */
  onChange: (parsed: T) => void;
  /** Fields to exclude from display (internal fields like _id, completionCount) */
  excludeKeys?: string[];
  /** Panel title */
  title?: string;
}

export function JsonPanel<T extends Record<string, unknown>>({
  value,
  onChange,
  excludeKeys = [],
  title = 'JSON',
}: JsonPanelProps<T>) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Serialize value -> text (only when not manually editing)
  useEffect(() => {
    if (isEditing) return;
    const filtered = { ...value };
    for (const key of excludeKeys) {
      delete filtered[key];
    }
    // Remove undefined values
    const clean = JSON.parse(JSON.stringify(filtered));
    setText(JSON.stringify(clean, null, 2));
    setParseError(null);
  }, [value, isEditing, excludeKeys]);

  const handleChange = useCallback((newText: string) => {
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setParseError(null);
      onChange(parsed as T);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [onChange]);

  const handleFocus = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => setIsEditing(false), []);

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  const lineCount = text.split('\n').length;

  return (
    <div className="flex flex-col h-full" style={{ minWidth: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
            {'{ }'} {title}
          </span>
          {parseError && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              Error
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] px-2 py-1 rounded transition-colors"
          style={{
            color: copied ? '#34d399' : 'var(--text-muted)',
            background: 'var(--bg-surface)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
          }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Copy JSON"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex overflow-auto">
          {/* Line numbers */}
          <div
            className="shrink-0 text-right pr-2 pt-3 select-none"
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              lineHeight: '1.35rem',
              color: 'var(--text-muted)',
              opacity: 0.4,
              width: 36,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border)',
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            spellCheck={false}
            className="flex-1 resize-none outline-none p-3"
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              lineHeight: '1.35rem',
              color: parseError ? '#f87171' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Error bar */}
      {parseError && (
        <div className="px-3 py-1.5 text-[10px]" style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          {parseError}
        </div>
      )}
    </div>
  );
}

// ─── Toggle button for modal header ─────────────────────────────────────────

export function JsonToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1 rounded transition-all"
      style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontWeight: active ? 600 : 400,
        color: active ? '#FF6F00' : 'var(--text-muted)',
        background: active ? 'rgba(255,111,0,0.08)' : 'var(--bg-surface)',
        border: `1px solid ${active ? 'rgba(255,111,0,0.2)' : 'var(--border)'}`,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'var(--text-muted)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
      title={active ? 'Hide JSON panel' : 'Show JSON panel'}
    >
      {'{ }'}
    </button>
  );
}

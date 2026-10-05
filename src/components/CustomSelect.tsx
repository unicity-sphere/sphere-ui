import { useState, useRef, useEffect, useCallback, useId, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

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
  /** Nothing can be picked, and the list cannot be opened. */
  disabled?: boolean;
  /**
   * What the control is for. Without one its accessible name is whatever it currently shows, so a
   * screen reader announces the VALUE and never the purpose — "testnet2, combo box", not
   * "Network". Give it one, or point `ariaLabelledBy` at a visible label.
   */
  ariaLabel?: string;
  /** Id of the element that labels this control. Wins over `ariaLabel`, as the HTML does. */
  ariaLabelledBy?: string;
  /** Id of the element that explains it — a hint or an error, read after the name. */
  ariaDescribedBy?: string;
}

/** How long a type-ahead buffer survives between keystrokes, as in a native `<select>`. */
const TYPEAHEAD_RESET_MS = 500;

/** A key that types a character, rather than one that commands (Enter, Tab, F3, ...). */
function isTypedCharacter(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }) {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

/**
 * A select whose list is drawn in the page rather than by the browser.
 *
 * It exists because a native `<select>` takes its dropdown colours from the control, which against
 * a dark theme leaves the rows unreadable. Everything a native select gives for free has to be
 * built back by hand, and this follows the ARIA select-only combobox pattern to do it: the trigger
 * is the combobox, the list is a listbox of options, and FOCUS NEVER LEAVES THE TRIGGER — the
 * active row is pointed at with `aria-activedescendant` instead.
 *
 * That last part is not a detail. The list is portalled to `document.body`, so focusable rows
 * would sit after everything else on the page: Tab from the trigger would walk through the rest of
 * the form before reaching the first option, and in a form whose next control submits, the obvious
 * keystroke would submit instead of choosing. Keeping focus on the trigger means Tab just leaves,
 * the way it does from a real select.
 */
export function CustomSelect({
  options, value, onChange, placeholder, className = '', size = 'md', disabled = false,
  ariaLabel, ariaLabelledBy, ariaDescribedBy,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: '', at: 0 });
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const selectedIndex = options.findIndex(o => o.value === value);
  const selected = selectedIndex === -1 ? undefined : options[selectedIndex];
  const label = selected?.label ?? placeholder ?? 'Select...';
  const lastIndex = options.length - 1;

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const openAt = useCallback((index: number) => {
    updatePos();
    setActiveIndex(Math.min(Math.max(index, 0), Math.max(lastIndex, 0)));
    setOpen(true);
    // A click does not focus a button in every browser, and the keyboard contract below only
    // works while the trigger has focus.
    btnRef.current?.focus();
  }, [updatePos, lastIndex]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  const commit = useCallback((index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  }, [options, onChange, close]);

  /** The option a buffer of typed characters points at, or the current one when nothing matches. */
  const matchTyped = useCallback((key: string, from: number) => {
    const now = Date.now();
    const fresh = now - typeahead.current.at < TYPEAHEAD_RESET_MS;
    // Repeating one character walks through the entries starting with it, as a native select does.
    const buffer = fresh ? typeahead.current.buffer + key : key;
    typeahead.current = { buffer, at: now };
    const needle = buffer.toLowerCase();
    const repeat = needle.length > 1 && needle.split('').every(c => c === needle[0]);
    const search = repeat ? needle[0] : needle;
    const start = repeat || !fresh ? from + 1 : from;
    for (let step = 0; step < options.length; step++) {
      const index = (start + step + options.length) % options.length;
      if (options[index].label.toLowerCase().startsWith(search)) return index;
    }
    return from;
  }, [options]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAt(selectedIndex === -1 ? 0 : selectedIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        openAt(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        openAt(lastIndex);
      } else if (isTypedCharacter(e)) {
        e.preventDefault();
        openAt(matchTyped(e.key, selectedIndex));
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex(i => Math.min(lastIndex, i + 1)); break;
      case 'ArrowUp': e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); break;
      case 'Home': e.preventDefault(); setActiveIndex(0); break;
      case 'End': e.preventDefault(); setActiveIndex(lastIndex); break;
      case 'Enter': case ' ': e.preventDefault(); commit(activeIndex); break;
      case 'Escape': e.preventDefault(); close(); break;
      // Leave, the way Tab leaves a real select: close and let focus move on untouched.
      case 'Tab': close(false); break;
      default:
        if (isTypedCharacter(e)) {
          e.preventDefault();
          setActiveIndex(matchTyped(e.key, activeIndex));
        }
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (dropRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape from anywhere. The trigger's own handler covers the normal case; this one is the
  // backstop for a browser that did not focus the button when it was clicked.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  // The list scrolls at max-h-48, and the active row is pointed at rather than focused, so nothing
  // brings it into view on its own.
  //
  // Found by position rather than by its id. The id comes from useId, whose values contain
  // colons, so an id selector needs CSS.escape — and CSS is not a given: it exists in some jsdom
  // environments and not others, so a consumer's test suite would crash here the moment the list
  // opened, with a TypeError from inside this package. The rows are rendered in order from the
  // same array activeIndex points into, so position is exact and needs nothing from the DOM API
  // beyond what every environment has.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const row = dropRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex];
    row?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={className}>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => (open ? close() : openAt(selectedIndex === -1 ? 0 : selectedIndex))}
        onKeyDown={onKeyDown}
        className={`admin-input w-full flex items-center justify-between gap-2 ${textSize} text-left`}
        style={{ color: selected ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <span className="truncate">{label}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 transition-transform"
          aria-hidden="true"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="py-1 max-h-48 overflow-y-auto"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            minWidth: 120,
            zIndex: 9999,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            return (
              <div
                key={opt.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                // Pointed at by aria-activedescendant, never focused — see the note above.
                tabIndex={-1}
                onClick={() => commit(index)}
                // Hover moves the same cursor the keyboard moves, so the two can never disagree
                // about which row Enter would take.
                onMouseEnter={() => setActiveIndex(index)}
                className={`block w-full cursor-pointer text-left px-3 py-1.5 ${textSize} transition-colors`}
                style={{
                  color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                  background: isSelected
                    ? 'var(--accent-glow)'
                    : isActive ? 'var(--bg-hover)' : 'transparent',
                  // The cursor has to be visible even when it sits on the selected row, which
                  // already carries the accent background.
                  boxShadow: isActive ? 'inset 0 0 0 1px var(--border-focus)' : undefined,
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

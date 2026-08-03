import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import type { ClientAnnouncement } from './types.js';
import { AnnouncementRow } from './AnnouncementRow.js';

export interface AnnouncementBellProps {
  items:       ClientAnnouncement[];
  unreadCount: number;
  prefs:       { autoOpenEnabled: boolean };
  onMarkRead:     (id: string, via: 'modal' | 'popover') => void;
  onMarkAllRead:  () => void;
  onSetAutoOpen:  (value: boolean) => void;
  onOpenItem:     (announcement: ClientAnnouncement) => void;
  /** Footer link to the full announcement centre. Footer is omitted when absent. */
  onViewAll?: () => void;
  /**
   * Which edge the popover hangs from. Defaults to 'right' (today's
   * behaviour, the bell's own right edge). Pass 'left' when the bell sits
   * near the left edge of a narrow container (e.g. a sidebar) and a
   * right-anchored `w-80` popover would render partly or entirely
   * off-screen. Both `left-0`/`right-0` below are complete literal class
   * names selected by a ternary, never built by interpolation — this
   * library ships class STRINGS the consumer's Tailwind build compiles, and
   * a scanner can only see whole names present verbatim in source.
   */
  align?: 'left' | 'right';
}

/**
 * The bell that sits in every portal's header, and the popover behind it.
 *
 * Purely prop-driven — this never calls `useAnnouncements` itself. That hook
 * keeps a module-level "one modal per session" flag built for exactly one
 * call per app; a header component that called it directly would risk a
 * second call (a remount on navigation, a second header on a wider layout)
 * silently breaking that invariant. Every value here — including the two
 * write actions the toggle needs — arrives through props instead, so the
 * host app owns the single hook call and this component just renders it.
 *
 * The popover always holds every announcement, read or not: it is a mailbox,
 * not a notification tray that empties itself. The auto-open toggle only
 * governs whether critical/major announcements interrupt the user with a
 * modal (Task 3) on load — it never hides anything from this list.
 */
export function AnnouncementBell({
  items, unreadCount, prefs, onMarkRead, onMarkAllRead, onSetAutoOpen, onOpenItem, onViewAll, align = 'right',
}: AnnouncementBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Escape and an outside click both close the popover — standard dropdown
  // behaviour, listened for only while it's actually open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const handleRowClick = (announcement: ClientAnnouncement) => {
    // One gesture: opening a row and dismissing its unread state are the
    // same click, not two.
    onOpenItem(announcement);
    onMarkRead(announcement.id, 'popover');
  };

  const badge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;
  const bellLabel = badge ? `Announcements, ${unreadCount} unread` : 'Announcements';

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        aria-label={bellLabel}
        onClick={() => setOpen(o => !o)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/5"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Bell className="w-5 h-5" />
        {/* A "0" badge is noise that trains people to ignore the bell — hide it entirely instead of showing a zero. */}
        {badge && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold leading-none text-white"
            style={{ background: 'var(--announcement-alert)' }}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden z-50`}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            {/* Anton only reads cleanly at 16px+ — 1.05rem clears that, matching FormModal's header treatment. */}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Announcements
            </span>
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium disabled:opacity-40"
              style={{ color: 'var(--accent-text)' }}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nothing new here yet.
              </div>
            ) : (
              items.map(item => (
                <AnnouncementRow key={item.id} announcement={item} onClick={handleRowClick} />
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Auto-open important announcements
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.autoOpenEnabled}
              aria-label="Auto-open important announcements"
              onClick={() => onSetAutoOpen(!prefs.autoOpenEnabled)}
              className="relative inline-flex items-center w-8 h-4 rounded-full p-0.5 transition-colors shrink-0"
              style={{ background: prefs.autoOpenEnabled ? 'var(--accent)' : 'var(--bg-hover)' }}
            >
              <span
                aria-hidden="true"
                className="block w-3 h-3 rounded-full transition-transform"
                style={{
                  background: 'var(--text-primary)',
                  transform: prefs.autoOpenEnabled ? 'translateX(16px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full text-center text-xs font-medium py-2.5"
              style={{ color: 'var(--accent-text)', borderTop: '1px solid var(--border)' }}
            >
              View all announcements
            </button>
          )}
        </div>
      )}
    </div>
  );
}

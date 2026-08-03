import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { ClientAnnouncement } from './types.js';
import { priorityTheme } from './theme.js';
import { Markdown } from './Markdown.js';

export interface AnnouncementModalProps {
  announcement: ClientAnnouncement;
  onDismiss:    () => void;
  onCtaClick:   (announcement: ClientAnnouncement) => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one surface in this library that interrupts a user rather than waiting
 * to be noticed. Two flavours, chosen by priority, not by a prop the host
 * could get wrong:
 *
 * - Editorial (major/normal): hero image, an Anton headline (22px+, the only
 *   size this library lets Anton run below its usual dashboard-heading size),
 *   the full markdown body, an accent CTA, "Later" as the quiet way out.
 * - Alert (critical): no image — a screenshot of a release is exciting, a
 *   screenshot of an outage is not, and the image would cost a beat of
 *   reading time an incident notice can't spend — a warning glyph, a short
 *   body, an alert-red CTA, "Got it".
 *
 * Both trap focus while open and hand it back to whatever had it before the
 * modal opened, on the theory that an announcement interrupts the page but
 * must not lose the user's place on it.
 */
export function AnnouncementModal({ announcement, onDismiss, onCtaClick }: AnnouncementModalProps) {
  const theme = priorityTheme(announcement.priority);
  const isAlert = announcement.priority === 'critical';

  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusTo.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables?.[0] ?? dialog)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;

      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !dialog.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !dialog.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      returnFocusTo.current?.focus?.();
    };
  }, [onDismiss]);

  const handleCta = () => {
    onCtaClick(announcement);
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={announcement.title}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl overflow-hidden outline-none"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
      >
        {!isAlert && announcement.heroUrl && (
          // A non-empty alt is required here, not just nice-to-have: an empty
          // alt gives an <img> the "presentation" accessibility role instead
          // of "img", which is also why an empty alt would fail this
          // component's own hero-image test.
          <img src={announcement.heroUrl} alt={announcement.title} className="w-full h-40 object-cover" />
        )}

        <div className="p-6">
          {isAlert ? (
            <div className="flex items-center gap-2 mb-3">
              <TriangleAlert className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
                {theme.label}
              </span>
            </div>
          ) : (
            <span
              className="inline-block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: theme.accent }}
            >
              {theme.label}
            </span>
          )}

          {isAlert ? (
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {announcement.title}
            </h2>
          ) : (
            // Anton reads cleanly at 16px+ only; this hero headline sits well
            // above that floor, unlike the smaller UI labels elsewhere that
            // stay on the body font instead.
            <h2
              className="mb-4"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}
            >
              {announcement.title}
            </h2>
          )}

          {isAlert ? (
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {announcement.summary}
            </p>
          ) : (
            <div className="mb-6">
              <Markdown>{announcement.body}</Markdown>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {announcement.cta ? 'Later' : 'Got it'}
            </button>
            {announcement.cta && (
              <button
                type="button"
                onClick={handleCta}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ background: isAlert ? theme.accent : 'var(--accent)' }}
              >
                {announcement.cta.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

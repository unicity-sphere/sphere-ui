import { useEffect, useRef } from 'react';
import type { ClientAnnouncement } from './types.js';
import { AnnouncementModalCard } from './AnnouncementModalCard.js';

export interface AnnouncementModalProps {
  announcement: ClientAnnouncement;
  onDismiss:    () => void;
  onCtaClick:   (announcement: ClientAnnouncement) => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one surface in this library that interrupts a user rather than waiting
 * to be noticed. Everything visible lives in `AnnouncementModalCard`, which
 * the admin composer's preview renders too — see that file for why the two are
 * one component. This one owns only what makes the card a dialog: the
 * backdrop, the dialog role, and a focus trap that hands focus back to
 * whatever had it before the modal opened, on the theory that an announcement
 * interrupts the page but must not lose the user's place on it.
 */
export function AnnouncementModal({ announcement, onDismiss, onCtaClick }: AnnouncementModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // `onDismiss` is read through a ref, not captured by the effect below.
  // Consumers overwhelmingly pass an inline arrow — that's the pattern
  // Tasks 4/5 use — which gets a new identity on every parent render. If
  // that identity were in the focus effect's dependency array, the whole
  // effect would tear down and re-run on every parent re-render while the
  // modal is open: cleanup yanks focus back to the pre-open element, then
  // setup immediately re-steals it into the dialog. Visible flicker and a
  // repeat screen-reader announcement, in the one component whose job is to
  // interrupt people. Keeping the callback in a ref means the effect below
  // never needs it in its dependency array, so its lifetime is the modal's
  // lifetime, not the callback's identity.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    returnFocusTo.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables?.[0] ?? dialog)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismissRef.current();
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
    // Deliberately empty: this effect's lifetime is the modal's mount
    // lifetime. It must run exactly once on mount and clean up exactly once
    // on unmount — see the comment above `onDismissRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        className="w-full flex justify-center outline-none"
      >
        <AnnouncementModalCard announcement={announcement} onDismiss={onDismiss} onCtaClick={onCtaClick} />
      </div>
    </div>
  );
}

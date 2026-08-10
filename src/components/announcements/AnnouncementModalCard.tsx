import { TriangleAlert } from 'lucide-react';
import type { ClientAnnouncement } from './types.js';
import { priorityTheme } from './theme.js';
import { Markdown } from './Markdown.js';

export interface AnnouncementModalCardProps {
  announcement: ClientAnnouncement;
  onDismiss:    () => void;
  onCtaClick:   (announcement: ClientAnnouncement) => void;
}

/**
 * The announcement modal's card — everything inside the backdrop, and nothing
 * about being a dialog. `AnnouncementModal` wraps this in the backdrop, the
 * `role="dialog"` element and the focus trap; the admin composer's preview
 * renders it bare.
 *
 * That split is the whole point of this file existing separately. The composer
 * used to hand-build its own approximation of the modal, and the two drifted:
 * the preview showed the full body for a critical announcement while the real
 * modal showed only the popover summary, so an author proof-read text their
 * readers never saw. A preview that re-implements the thing it previews is a
 * lie waiting to happen — there is now exactly one component, and "the preview
 * matches the modal" is true by construction rather than by review.
 *
 * Two flavours, chosen by priority, not by a prop the host could get wrong:
 *
 * - Editorial (major/normal): hero image, an Anton headline (22px+, the only
 *   size this library lets Anton run below its usual dashboard-heading size),
 *   the markdown body, an accent CTA, "Later" as the quiet way out.
 * - Alert (critical): no image — a screenshot of a release is exciting, a
 *   screenshot of an outage is not, and the image would cost a beat of
 *   reading time an incident notice can't spend — a warning glyph, the same
 *   markdown body, an alert-red CTA, "Got it".
 */
export function AnnouncementModalCard({ announcement, onDismiss, onCtaClick }: AnnouncementModalCardProps) {
  const theme = priorityTheme(announcement.priority);
  const isAlert = announcement.priority === 'critical';

  const handleCta = () => {
    onCtaClick(announcement);
    onDismiss();
  };

  return (
    <div
      className="w-full max-w-lg rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
    >
      {/* Only the read-me part scrolls. The actions below stay put, because a
          modal that blocks the page must never push its own dismiss button
          past the bottom of the viewport — a long critical body would
          otherwise leave the reader with no way out but Escape. */}
      <div data-testid="announcement-modal-body" className="overflow-y-auto">
        {!isAlert && announcement.heroUrl && (
          // A non-empty alt is required here, not just nice-to-have: an empty
          // alt gives an <img> the "presentation" accessibility role instead
          // of "img", which is also why an empty alt would fail this
          // component's own hero-image test.
          <img src={announcement.heroUrl} alt={announcement.title} className="w-full h-40 object-cover" />
        )}

        <div className="p-6 pb-4">
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

          {/* Both flavours render the body, never the summary: the summary is
              the two-line teaser the bell popover shows, and a modal that
              stopped at it dropped every instruction written below the first
              paragraph — the part a critical notice exists to deliver. */}
          <Markdown>{announcement.body}</Markdown>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {/* Flavour decides first, CTA presence second — not the other
              way around. Alert is "do something now": the acknowledgement
              is always "Got it", whether or not there's also a CTA to act
              on (a critical announcement with a CTA must not say "Later"
              to something urgent). Editorial is "look what we shipped":
              "Later" only makes sense when there's something to defer,
              i.e. a CTA — with none, this is the sole action and reads as
              "Got it" too. */}
          {isAlert ? 'Got it' : (announcement.cta ? 'Later' : 'Got it')}
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
  );
}

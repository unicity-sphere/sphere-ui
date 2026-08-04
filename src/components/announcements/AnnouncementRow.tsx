import type { ClientAnnouncement } from './types.js';
import { priorityTheme } from './theme.js';
import { iconForAnnouncement } from './icons.js';

export interface AnnouncementRowProps {
  announcement: ClientAnnouncement;
  /** Fires from any part of the row — opening and marking read are one gesture, not two. */
  onClick: (announcement: ClientAnnouncement) => void;
}

const MINUTE = 60_000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7 * DAY;
const MONTH  = 30 * DAY;

/** Coarse "time ago" — good enough for a mailbox row, not a precise countdown. */
function formatRelativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR)   return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY)    return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < WEEK)   return `${Math.floor(elapsed / DAY)}d ago`;
  if (elapsed < MONTH)  return `${Math.floor(elapsed / WEEK)}w ago`;
  return `${Math.floor(elapsed / MONTH)}mo ago`;
}

/**
 * One row in the bell's popover (and, later, the announcement centre).
 * Priority is read entirely from `priorityTheme()` (Task 1) for the pill and
 * the left edge — this file owns no colour map of its own. Read state is
 * this row's own concern: an unread row gets an accent dot and a tinted
 * background; the coloured left edge comes from the theme for every
 * priority, but only reads as an accent for critical/major since `normal`'s
 * `borderClass` is the same neutral token as the page border.
 *
 * The whole row is a single button: clicking anywhere on it both opens the
 * announcement and marks it read, since a mailbox row is scanned and acted
 * on in one gesture, not two.
 *
 * Every row renders the same small glyph tile, never the hero image: the
 * hero is authored as a 3:1 banner, and centre-cropping it into a square
 * here showed readers a different framing than the one the author picked,
 * with no way for them to control it. The banner keeps its job in
 * `AnnouncementModal`, which has the width to show it uncropped — this row
 * is a scannable list, not a second place to display it. Structurally
 * identical rows also mean the eye runs down one column of title/summary
 * text instead of a column of mismatched thumbnails.
 */
export function AnnouncementRow({ announcement, onClick }: AnnouncementRowProps) {
  const theme = priorityTheme(announcement.priority);
  const TypeIcon = iconForAnnouncement(announcement.type, announcement.icon);

  return (
    <button
      type="button"
      onClick={() => onClick(announcement)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-l-4 ${theme.borderClass}`}
      style={{ background: announcement.read ? 'transparent' : 'var(--accent-glow)' }}
    >
      {/* Smaller and quieter than the old 48px hero tile on purpose — this
          is a type indicator, not imagery, so it should read as secondary to
          the title/summary text next to it. */}
      <div
        data-testid="announcement-type-icon"
        className="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: 'var(--bg-hover)' }}
      >
        <TypeIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!announcement.read && (
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: theme.accent }} />
          )}
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {announcement.title}
          </span>
        </div>

        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {announcement.summary}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${theme.pillClass}`}>
            {theme.label}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatRelativeTime(announcement.publishAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

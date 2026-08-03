import type { AnnouncementPriority } from './types.js';

/**
 * Alert red — the brand palette (src/styles/tokens.css) defines no alert
 * colour, so `--announcement-alert` and `--announcement-alert-text` are
 * declared there purely for this one case. `ALERT` gives this module one
 * place to read the base tone for `accent`.
 *
 * Every class string below — `pillClass` and `borderClass` alike — is
 * written out as a literal, never built by interpolating a constant into a
 * template (e.g. `` text-[${SOME_CONST}] ``): Tailwind's build-time scanner
 * reads source text and does not execute code, so an interpolated class name
 * is invisible to it and never gets a rule generated. That is the exact bug
 * this map's counterpart in sphere-backoffice/src/lib/announcementTheme.ts
 * shipped once already.
 */
const ALERT = 'var(--announcement-alert)';

export interface PriorityTheme {
  label:       string;
  /** CSS colour value — a brand token where one exists, a literal only for the alert red. */
  accent:      string;
  pillClass:   string;
  /** Coloured left edge — the same theme read by the pill and the CTA, so a bell/modal border can't drift from them. */
  borderClass: string;
  /** Whether this priority interrupts the user with a modal. */
  opensModal:  boolean;
}

/**
 * Priority is the announcement's theme, not a badge on it: the same value
 * colours the pill, the row's left edge and the CTA across every surface
 * that reads it. Kept identical to sphere-backoffice's `announcementTheme.ts`
 * so the admin composer's preview and the real thing on wallet/quest/
 * dev-portal can never disagree.
 *
 * Orange means "needs your attention" product-wide, so `normal` deliberately
 * gets a neutral tone rather than a dimmer orange — otherwise everything
 * would end up orange and the signal would be lost.
 */
const THEMES: Record<AnnouncementPriority, PriorityTheme> = {
  critical: {
    label:       'Critical',
    accent:      ALERT,
    pillClass:   'bg-[rgba(229,72,77,0.15)] text-[var(--announcement-alert-text)]',
    // References the token directly (with a Tailwind v4 opacity modifier)
    // rather than a second raw rgba literal, so the one place this colour is
    // defined stays --announcement-alert in tokens.css, not that plus a
    // duplicated (229,72,77) triplet here.
    borderClass: 'border-[var(--announcement-alert)]/28',
    opensModal:  true,
  },
  major: {
    label:       'Major',
    accent:      'var(--accent)',
    pillClass:   'bg-[rgba(255,111,0,0.14)] text-[var(--accent)]',
    borderClass: 'border-[rgba(255,111,0,0.28)]',
    opensModal:  true,
  },
  normal: {
    label:       'Normal',
    accent:      'var(--text-secondary)',
    pillClass:   'bg-white/6 text-white/62',
    borderClass: 'border-[var(--border)]',
    opensModal:  false,
  },
};

export function priorityTheme(priority: AnnouncementPriority): PriorityTheme {
  return THEMES[priority];
}

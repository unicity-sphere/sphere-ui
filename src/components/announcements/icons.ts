import {
  Rocket, RefreshCw, Calendar, Wrench, ShieldAlert,
  Megaphone, Gift, Sparkles, AlertTriangle, Info, Key, Coins, PartyPopper,
} from 'lucide-react';
import type { AnnouncementType } from './types.js';

/**
 * The closed set of icon keys an announcement can be tagged with. A stored
 * `icon` is validated against exactly this list, never accepted as a
 * free-form string — a key outside it has nothing to look up in
 * `ANNOUNCEMENT_ICONS` and would otherwise render as an empty square.
 *
 * The first five keys double as `AnnouncementType` values on purpose: they
 * are every type's own default glyph, so `iconForAnnouncement` below reads
 * the default straight out of this one map (`ANNOUNCEMENT_ICONS[type]`)
 * instead of keeping a second type -> icon table that could drift from it.
 *
 * Mirrors sphere-api's `ANNOUNCEMENT_ICON_KEYS` in src/lib/announcements.ts —
 * the two must stay in step, since the value this picker writes is what that
 * server-side list validates on write. sphere-api owns its own copy rather
 * than importing this one (an API must never depend on a UI package), the
 * same split as `MEDIA_OWNER_TYPES` (src/components/media/types.ts) and
 * sphere-api's `OWNER_TYPES`.
 */
export const ANNOUNCEMENT_ICON_KEYS = [
  'release', 'update', 'event', 'maintenance', 'security',
  'megaphone', 'gift', 'sparkles', 'alert-triangle', 'info', 'key', 'coins', 'party',
] as const;

export type AnnouncementIconKey = typeof ANNOUNCEMENT_ICON_KEYS[number];

/**
 * One lucide-react component per key. Every consumer — this row, and
 * sphere-backoffice's icon picker — reads a glyph from this single map, so
 * there is exactly one place that decides what each key looks like.
 */
export const ANNOUNCEMENT_ICONS: Record<AnnouncementIconKey, typeof Rocket> = {
  release:          Rocket,
  update:           RefreshCw,
  event:            Calendar,
  maintenance:      Wrench,
  security:         ShieldAlert,
  megaphone:        Megaphone,
  gift:             Gift,
  sparkles:         Sparkles,
  'alert-triangle': AlertTriangle,
  info:             Info,
  key:              Key,
  coins:            Coins,
  party:            PartyPopper,
};

function isAnnouncementIconKey(value: string): value is AnnouncementIconKey {
  return (ANNOUNCEMENT_ICON_KEYS as readonly string[]).includes(value);
}

/**
 * The glyph to render for one announcement: the explicit override when it is
 * a recognised key, the type's own default otherwise. Applies the same
 * "unrecognised falls back, never renders nothing" rule to `icon` as it does
 * to an absent one — old data written before this existed, or a value that
 * somehow isn't in `ANNOUNCEMENT_ICON_KEYS`, still resolves to a real glyph
 * rather than an empty square.
 */
export function iconForAnnouncement(type: AnnouncementType, icon?: string | null): typeof Rocket {
  if (icon && isAnnouncementIconKey(icon)) return ANNOUNCEMENT_ICONS[icon];
  return ANNOUNCEMENT_ICONS[type];
}

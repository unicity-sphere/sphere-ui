import { describe, it, expect } from 'vitest';
import { ANNOUNCEMENT_ICON_KEYS, ANNOUNCEMENT_ICONS, iconForAnnouncement } from '../icons.js';
import { DiscordIcon } from '../DiscordIcon.js';
import type { AnnouncementType } from '../types.js';

// types.ts exports `AnnouncementType` as a union only, no runtime array — this
// literal must be kept in step with it, same as icons.ts's own comment on why
// the first five ANNOUNCEMENT_ICON_KEYS entries double as type values.
const ANNOUNCEMENT_TYPES: readonly AnnouncementType[] = ['release', 'update', 'event', 'maintenance', 'security'];

describe('ANNOUNCEMENT_ICON_KEYS / ANNOUNCEMENT_ICONS', () => {
  it('pins the closed set of keys exactly — a change here must be deliberate, since sphere-api mirrors this list', () => {
    expect([...ANNOUNCEMENT_ICON_KEYS]).toEqual([
      'release', 'update', 'event', 'maintenance', 'security',
      'megaphone', 'gift', 'sparkles', 'alert-triangle', 'info', 'key', 'coins', 'party',
      'discord',
    ]);
  });

  // The only key whose glyph is not a lucide icon — it is drawn in this
  // package (lucide ships no brand marks). Pinned so a refactor that loses
  // the local component and silently leaves the key mapped to nothing gets
  // caught here rather than as an empty square in three portals.
  it('maps the discord key to the locally drawn brand mark', () => {
    expect(ANNOUNCEMENT_ICONS.discord).toBe(DiscordIcon);
  });

  it('has exactly one glyph per key, with no gaps', () => {
    for (const key of ANNOUNCEMENT_ICON_KEYS) {
      expect(ANNOUNCEMENT_ICONS[key]).toBeTruthy();
    }
  });

  it('gives every announcement type its own icon key', () => {
    for (const type of ANNOUNCEMENT_TYPES) {
      expect((ANNOUNCEMENT_ICON_KEYS as readonly string[])).toContain(type);
    }
  });
});

describe('iconForAnnouncement', () => {
  it('falls back to the type default when no icon is set', () => {
    expect(iconForAnnouncement('security', null)).toBe(ANNOUNCEMENT_ICONS.security);
    expect(iconForAnnouncement('release', undefined)).toBe(ANNOUNCEMENT_ICONS.release);
  });

  it('uses the explicit override when it names a valid key', () => {
    expect(iconForAnnouncement('release', 'gift')).toBe(ANNOUNCEMENT_ICONS.gift);
  });

  it('falls back to the type default for an unrecognised key rather than rendering nothing', () => {
    expect(iconForAnnouncement('event', 'not-a-real-icon')).toBe(ANNOUNCEMENT_ICONS.event);
  });

  it('falls back to the type default for an empty-string icon', () => {
    expect(iconForAnnouncement('maintenance', '')).toBe(ANNOUNCEMENT_ICONS.maintenance);
  });
});

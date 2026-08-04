export const ANNOUNCEMENT_CLIENT_IDS = ['sphere', 'quest', 'developer'] as const;
export type AnnouncementClientId = typeof ANNOUNCEMENT_CLIENT_IDS[number];

export type AnnouncementPriority = 'critical' | 'major' | 'normal';
export type AnnouncementType = 'release' | 'update' | 'event' | 'maintenance' | 'security';

export interface ClientAnnouncement {
  id:        string;
  priority:  AnnouncementPriority;
  type:      AnnouncementType;
  title:     string;
  summary:   string;
  body:      string;
  heroUrl:   string | null;
  /** Explicit override of the type's default glyph, or null/undefined when
   *  the announcement never overrode it. Validated server-side against the
   *  same closed set `iconForAnnouncement` (./icons.ts) reads — see that
   *  file for why an unrecognised value still resolves to a real glyph. */
  icon?:     string | null;
  /** Already flattened to this portal by the server. */
  cta:       { label: string; url: string } | null;
  publishAt: string;
  expiresAt: string | null;
  read:      boolean;
}

export interface AnnouncementFeed {
  items:       ClientAnnouncement[];
  unreadCount: number;
  autoOpen:    string | null;
  prefs:       { autoOpenEnabled: boolean };
}

/**
 * The port each portal implements. This library never learns how any app
 * authenticates — it is handed six functions and nothing else.
 */
export interface AnnouncementsClient {
  getFeed():                                  Promise<AnnouncementFeed>;
  getArchive(cursor?: string):                Promise<{ items: ClientAnnouncement[]; nextCursor: string | null }>;
  markRead(id: string, via: 'modal' | 'popover'): Promise<void>;
  markAllRead():                              Promise<void>;
  recordClick(id: string):                    Promise<void>;
  setPrefs(autoOpenEnabled: boolean):         Promise<void>;
}

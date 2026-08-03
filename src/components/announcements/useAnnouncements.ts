import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnnouncementsClient, AnnouncementFeed, ClientAnnouncement } from './types.js';

/**
 * One modal per app session. Module-level rather than component state on
 * purpose: a portal may mount the bell in more than one place, or remount it
 * during navigation, and neither should earn the user a second interruption.
 */
let sessionModalShown = false;

/** Test-only escape hatch — a module-level flag would otherwise leak between cases. */
export function __resetSessionModalFlag(): void {
  sessionModalShown = false;
}

const DISMISSED_KEY = 'announcements:dismissed';

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function rememberDismissed(id: string): void {
  try {
    const next = readDismissed();
    next.add(id);
    // Bounded: the server is the real record, this only stops a flash on a
    // cold start before the feed arrives.
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next].slice(-100)));
  } catch {
    // A blocked or full localStorage must never break the portal.
  }
}

export interface UseAnnouncementsOptions {
  /** Pass false while the portal has no identity yet — before a wallet exists. */
  enabled?: boolean;
}

export function useAnnouncements(
  client: AnnouncementsClient,
  opts: UseAnnouncementsOptions = {},
) {
  const enabled = opts.enabled ?? true;

  const [feed, setFeed]       = useState<AnnouncementFeed | null>(null);
  const [isLoading, setLoad]  = useState<boolean>(enabled);
  const [error, setError]     = useState<Error | null>(null);
  const [autoOpenId, setAuto] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    if (!enabled) { setLoad(false); return; }
    try {
      const next = await client.getFeed();
      if (!alive.current) return;
      setFeed(next);
      setError(null);

      const dismissed = readDismissed();
      const candidate = next.autoOpen;
      if (candidate && !sessionModalShown && !dismissed.has(candidate)) {
        sessionModalShown = true;
        setAuto(candidate);
      }
    } catch (e) {
      if (!alive.current) return;
      // Announcements are never a reason a portal fails to render.
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (alive.current) setLoad(false);
    }
  }, [client, enabled]);

  useEffect(() => { void load(); }, [load]);

  const applyRead = useCallback((ids: string[]) => {
    setFeed(prev => {
      if (!prev) return prev;
      const set = new Set(ids);
      const items: ClientAnnouncement[] = prev.items.map(i => (set.has(i.id) ? { ...i, read: true } : i));
      return { ...prev, items, unreadCount: items.filter(i => !i.read).length };
    });
  }, []);

  const markRead = useCallback(async (id: string, via: 'modal' | 'popover') => {
    applyRead([id]);
    rememberDismissed(id);
    if (autoOpenId === id) setAuto(null);
    try {
      await client.markRead(id, via);
    } catch {
      // Deliberately swallowed: the optimistic state stands. A dismissal that
      // silently comes back is worse than one the server has not recorded yet.
    }
  }, [applyRead, autoOpenId, client]);

  const markAllRead = useCallback(async () => {
    setFeed(prev => prev && ({ ...prev, items: prev.items.map(i => ({ ...i, read: true })), unreadCount: 0 }));
    try { await client.markAllRead(); } catch { /* as above */ }
  }, [client]);

  const setAutoOpen = useCallback(async (value: boolean) => {
    setFeed(prev => prev && ({ ...prev, prefs: { autoOpenEnabled: value } }));
    try { await client.setPrefs(value); } catch { /* as above */ }
  }, [client]);

  const dismissModal = useCallback(() => { setAuto(null); }, []);

  return {
    items:       feed?.items ?? [],
    unreadCount: feed?.unreadCount ?? 0,
    prefs:       feed?.prefs ?? { autoOpenEnabled: true },
    autoOpenId,
    isLoading,
    error,
    markRead,
    markAllRead,
    setAutoOpen,
    dismissModal,
    refresh: load,
  };
}

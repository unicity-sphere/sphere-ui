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

/** How long a foreground tab is allowed to go without a background refresh. */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

/**
 * `'mount'` is the page-load path: it may open the modal, exactly as before.
 * `'refresh'` is everything that fires later on its own — tab-visible and the
 * interval — and it is not allowed to interrupt anyone. See `load` below.
 */
type LoadMode = 'mount' | 'refresh';

export interface UseAnnouncementsResult {
  items:        ClientAnnouncement[];
  unreadCount:  number;
  prefs:        { autoOpenEnabled: boolean };
  autoOpenId:   string | null;
  isLoading:    boolean;
  error:        Error | null;
  markRead:     (id: string, via: 'modal' | 'popover') => Promise<void>;
  markAllRead:  () => Promise<void>;
  setAutoOpen:  (value: boolean) => Promise<void>;
  dismissModal: () => void;
  refresh:      () => Promise<void>;
}

/** Call this hook once per app and pass its values down to the bell and the modal — see `sessionModalShown` above for why. */
export function useAnnouncements(
  client: AnnouncementsClient,
  opts: UseAnnouncementsOptions = {},
): UseAnnouncementsResult {
  const enabled = opts.enabled ?? true;

  const [feed, setFeed]       = useState<AnnouncementFeed | null>(null);
  const [isLoading, setLoad]  = useState<boolean>(enabled);
  const [error, setError]     = useState<Error | null>(null);
  const [autoOpenId, setAuto] = useState<string | null>(null);
  const alive = useRef(true);

  // Re-arm on every mount, not just on the initial one: React 18/19 dev-mode
  // StrictMode deliberately mounts, cleans up, then mounts again to surface
  // effects that don't tolerate it. A cleanup-only effect leaves `alive`
  // permanently false after that synthetic first cleanup, so the in-flight
  // `getFeed()` from the (also synthetic) first mount — and every load after
  // it — hits `if (!alive.current) return` before `setLoad(false)`, and
  // `isLoading` never leaves `true`. Setting it back to `true` on mount keeps
  // the ref in sync with the component's actual lifecycle instead of only
  // its first one.
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  // Single fetch path for both the initial page-load and every later
  // background refresh — the two only diverge on what they're allowed to do
  // with the auto-open candidate. `mode === 'mount'` is the sole path that
  // may claim `sessionModalShown` and set `autoOpenId`; a `'refresh'` call
  // updates `items` / `unreadCount` / `prefs` and otherwise leaves the modal
  // state exactly as it found it, on the product rule that a background
  // refresh must never open (or re-arm) a modal — the user may be mid-send.
  const load = useCallback(async (mode: LoadMode) => {
    if (!enabled) { if (mode === 'mount') setLoad(false); return; }
    try {
      const next = await client.getFeed();
      if (!alive.current) return;
      setFeed(next);
      setError(null);

      if (mode === 'mount') {
        const dismissed = readDismissed();
        const candidate = next.autoOpen;
        if (candidate && !sessionModalShown && !dismissed.has(candidate)) {
          sessionModalShown = true;
          setAuto(candidate);
        }
      }
    } catch (e) {
      if (!alive.current) return;
      // Announcements are never a reason a portal fails to render.
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      // Only the mount path drives `isLoading` — a background refresh must
      // stay invisible, not flip a spinner on for a tab nobody is watching.
      if (mode === 'mount' && alive.current) setLoad(false);
    }
  }, [client, enabled]);

  useEffect(() => { void load('mount'); }, [load]);

  // Background refresh: catches up a long-lived tab without ever surfacing a
  // modal (see `load` above). Two triggers, both gated on `enabled` so
  // neither the listener nor the interval is even installed while disabled:
  //   - the tab regaining visibility, for a user who switched away and back;
  //   - a 30-minute interval, for a tab that stays foregrounded all day and
  //     so never fires a visibilitychange on its own.
  // The interval tick itself is skipped while hidden — a background tab has
  // no one to show a badge to, and the listener above already refreshes the
  // moment it comes back.
  useEffect(() => {
    if (!enabled) return;

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') void load('refresh');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') void load('refresh');
    }, REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [enabled, load]);

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

  // A caller invoking `refresh()` explicitly is asking for fresh data, not to
  // be interrupted — it gets the same non-opening semantics as the automatic
  // triggers above, not the mount path's modal selection.
  const refresh = useCallback(() => load('refresh'), [load]);

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
    refresh,
  };
}

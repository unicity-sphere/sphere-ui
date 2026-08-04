import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnouncements, __resetSessionModalFlag } from '../useAnnouncements.js';
import type { AnnouncementsClient, AnnouncementFeed } from '../types.js';

function feed(over: Partial<AnnouncementFeed> = {}): AnnouncementFeed {
  return {
    items: [{
      id: 'a1', priority: 'major', type: 'release', title: 'T', summary: 'S', body: 'B',
      heroUrl: null, cta: null, publishAt: '2026-07-01T00:00:00.000Z', expiresAt: null, read: false,
    }],
    unreadCount: 1,
    autoOpen: 'a1',
    prefs: { autoOpenEnabled: true },
    ...over,
  };
}

function makeClient(over: Partial<AnnouncementsClient> = {}): AnnouncementsClient {
  return {
    getFeed:     vi.fn().mockResolvedValue(feed()),
    markRead:    vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    recordClick: vi.fn().mockResolvedValue(undefined),
    setPrefs:    vi.fn().mockResolvedValue(undefined),
    getArchive:  vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    ...over,
  };
}

/** 30 minutes, mirrored from the hook's own `REFRESH_INTERVAL_MS` rather than imported, so the test still pins the contract if that constant is ever renamed. */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

beforeEach(() => {
  localStorage.clear();
  __resetSessionModalFlag();
  setVisibility('visible');
});

describe('useAnnouncements', () => {
  it('loads the feed and exposes the unread count', async () => {
    const { result } = renderHook(() => useAnnouncements(makeClient()));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('surfaces the server\'s auto-open choice', async () => {
    const { result } = renderHook(() => useAnnouncements(makeClient()));
    await waitFor(() => expect(result.current.autoOpenId).toBe('a1'));
  });

  it('shows at most one modal per session even across remounts', async () => {
    const client = makeClient();
    const first = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(first.result.current.autoOpenId).toBe('a1'));
    act(() => { first.result.current.dismissModal(); });
    first.unmount();

    const second = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(second.result.current.autoOpenId).toBeNull();
  });

  it('does not re-open a modal the user already dismissed on this device', async () => {
    const client = makeClient();
    const first = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(first.result.current.autoOpenId).toBe('a1'));
    await act(async () => { await first.result.current.markRead('a1', 'modal'); });
    first.unmount();
    __resetSessionModalFlag();

    const second = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(second.result.current.autoOpenId).toBeNull();
  });

  it('marks read optimistically and tells the server', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.markRead('a1', 'popover'); });
    expect(client.markRead).toHaveBeenCalledWith('a1', 'popover');
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items[0].read).toBe(true);
  });

  it('keeps the optimistic read when the server call fails', async () => {
    const client = makeClient({ markRead: vi.fn().mockRejectedValue(new Error('offline')) });
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.markRead('a1', 'popover'); });
    // A read that silently comes back is worse than one that is lost — the
    // local mirror is what makes the dismissal stick.
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks everything read at once', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.markAllRead(); });
    expect(client.markAllRead).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
  });

  it('persists the auto-open preference and reflects it immediately', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.setAutoOpen(false); });
    expect(client.setPrefs).toHaveBeenCalledWith(false);
    expect(result.current.prefs.autoOpenEnabled).toBe(false);
  });

  it('never surfaces a modal when the feed offers none', async () => {
    const client = makeClient({ getFeed: vi.fn().mockResolvedValue(feed({ autoOpen: null })) });
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.autoOpenId).toBeNull();
  });

  it('reports an error without throwing, so a portal never fails to render', async () => {
    const client = makeClient({ getFeed: vi.fn().mockRejectedValue(new Error('500')) });
    const { result } = renderHook(() => useAnnouncements(client));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('does nothing at all when disabled', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useAnnouncements(client, { enabled: false }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(client.getFeed).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it('still loads under React StrictMode', async () => {
    // StrictMode's dev-only mount -> cleanup -> mount cycle is exactly what
    // regressed: a cleanup-only `alive` effect never re-arms after the
    // synthetic first cleanup, so `getFeed()`'s resolution finds
    // `alive.current === false` forever and `isLoading` never clears. Every
    // other test in this file renders unwrapped, which is how that hid.
    const client = makeClient();
    const { result } = renderHook(() => useAnnouncements(client), { wrapper: StrictMode });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  describe('background refresh', () => {
    afterEach(() => { vi.useRealTimers(); });

    it('refetches when the tab becomes visible again', async () => {
      const client = makeClient();
      const { result } = renderHook(() => useAnnouncements(client));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(client.getFeed).toHaveBeenCalledTimes(1);

      const refreshed = feed({
        items: [{ ...feed().items[0], id: 'a2', read: false }],
        unreadCount: 2,
        autoOpen: null,
      });
      (client.getFeed as ReturnType<typeof vi.fn>).mockResolvedValueOnce(refreshed);

      setVisibility('visible');
      act(() => { document.dispatchEvent(new Event('visibilitychange')); });

      await waitFor(() => expect(result.current.unreadCount).toBe(2));
      expect(result.current.items[0].id).toBe('a2');
      expect(client.getFeed).toHaveBeenCalledTimes(2);
    });

    it('a refresh with a fresh candidate does not open a modal or burn the session flag', async () => {
      // The mount call finds nothing to auto-open; only a later refresh sees
      // a candidate. This isolates the refresh path from the mount path's
      // own (already-covered) auto-open behaviour.
      const client = makeClient({ getFeed: vi.fn().mockResolvedValue(feed({ autoOpen: null })) });
      const first = renderHook(() => useAnnouncements(client));
      await waitFor(() => expect(first.result.current.isLoading).toBe(false));
      expect(first.result.current.autoOpenId).toBeNull();

      (client.getFeed as ReturnType<typeof vi.fn>).mockResolvedValue(feed({ autoOpen: 'a1' }));
      await act(async () => { await first.result.current.refresh(); });

      // Fresh data landed (unreadCount came from the new feed)...
      expect(first.result.current.unreadCount).toBe(1);
      // ...but the candidate it carried was never allowed to open.
      expect(first.result.current.autoOpenId).toBeNull();

      first.unmount();

      // A genuine remount (the mount path) still gets its modal for the same
      // still-unread candidate — proof the refresh above never spent the
      // one-modal-per-session flag.
      const second = renderHook(() => useAnnouncements(client));
      await waitFor(() => expect(second.result.current.autoOpenId).toBe('a1'));
    });

    it('refreshes on the 30-minute interval while the tab is visible', async () => {
      vi.useFakeTimers();
      const client = makeClient();
      const { result } = renderHook(() => useAnnouncements(client));
      // Flush the mount call's own microtasks only — do NOT run pending
      // timers here, since the interval itself is already a pending timer
      // (scheduled synchronously by the same mount effect) and would fire
      // early, defeating the point of the assertion below.
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });
      expect(result.current.isLoading).toBe(false);
      expect(client.getFeed).toHaveBeenCalledTimes(1);

      setVisibility('visible');
      await act(async () => { await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS); });

      expect(client.getFeed).toHaveBeenCalledTimes(2);
    });

    it('does not refresh on the interval while the tab is hidden', async () => {
      vi.useFakeTimers();
      const client = makeClient();
      const { result } = renderHook(() => useAnnouncements(client));
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });
      expect(result.current.isLoading).toBe(false);
      expect(client.getFeed).toHaveBeenCalledTimes(1);

      setVisibility('hidden');
      await act(async () => { await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS); });

      // The tick ran (the timer fired) but the hidden check inside it skipped
      // the fetch — still just the one call from mount.
      expect(client.getFeed).toHaveBeenCalledTimes(1);
    });

    it('removes the visibility listener and clears the interval on unmount', async () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const client = makeClient();
      const { result, unmount } = renderHook(() => useAnnouncements(client));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // With the listener really gone, a subsequent visibility change must not
      // reach a fetch — the strongest proof cleanup worked, not just that the
      // API was called.
      const callsBeforeDispatch = (client.getFeed as ReturnType<typeof vi.fn>).mock.calls.length;
      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(client.getFeed).toHaveBeenCalledTimes(callsBeforeDispatch);
    });

    it('installs neither the listener nor the interval, and never refetches, when disabled', async () => {
      vi.useFakeTimers();
      const client = makeClient();
      const { result } = renderHook(() => useAnnouncements(client, { enabled: false }));
      await act(async () => { await vi.runOnlyPendingTimersAsync(); });
      expect(result.current.isLoading).toBe(false);
      expect(client.getFeed).not.toHaveBeenCalled();

      setVisibility('visible');
      act(() => { document.dispatchEvent(new Event('visibilitychange')); });
      await act(async () => { await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS); });

      expect(client.getFeed).not.toHaveBeenCalled();
    });
  });
});

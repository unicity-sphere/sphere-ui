import { describe, it, expect, vi, beforeEach } from 'vitest';
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

beforeEach(() => { localStorage.clear(); __resetSessionModalFlag(); });

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
});

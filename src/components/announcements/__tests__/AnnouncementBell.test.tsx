import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementBell } from '../AnnouncementBell.js';
import type { ClientAnnouncement } from '../types.js';

function item(over: Partial<ClientAnnouncement> = {}): ClientAnnouncement {
  return {
    id: 'a1', priority: 'major', type: 'release', title: 'Season 3 quests are open',
    summary: 'Forty-two new quests went live.', body: 'Body', heroUrl: null, cta: null,
    publishAt: '2026-07-01T00:00:00.000Z', expiresAt: null, read: false, ...over,
  };
}

const noop = () => {};
function props(over: Record<string, unknown> = {}) {
  return {
    items: [item()], unreadCount: 1, prefs: { autoOpenEnabled: true },
    onMarkRead: noop, onMarkAllRead: noop, onSetAutoOpen: noop, onOpenItem: noop,
    ...over,
  };
}

describe('AnnouncementBell', () => {
  it('shows the unread count on the bell', () => {
    render(<AnnouncementBell {...props()} />);
    expect(screen.getByRole('button', { name: /announcements/i }).textContent).toContain('1');
  });

  it('hides the badge entirely when nothing is unread', () => {
    render(<AnnouncementBell {...props({ unreadCount: 0 })} />);
    expect(screen.getByRole('button', { name: /announcements/i }).textContent).not.toContain('0');
  });

  it('keeps the popover closed until the bell is clicked', async () => {
    render(<AnnouncementBell {...props()} />);
    expect(screen.queryByText('Season 3 quests are open')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    expect(screen.getByText('Season 3 quests are open')).toBeTruthy();
  });

  it('opens an announcement and marks it read in one click', async () => {
    const onOpenItem = vi.fn();
    const onMarkRead = vi.fn();
    render(<AnnouncementBell {...props({ onOpenItem, onMarkRead })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    await userEvent.click(screen.getByText('Season 3 quests are open'));
    expect(onOpenItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }));
    expect(onMarkRead).toHaveBeenCalledWith('a1', 'popover');
  });

  it('closes the popover when a row is clicked, not just when opening its modal', async () => {
    // A row click is inside rootRef, so the outside-click handler never
    // fires for it — without an explicit close, the popover is left open
    // behind whatever modal onOpenItem triggers, and dismissing that modal
    // reveals it still hanging over the page.
    render(<AnnouncementBell {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    await userEvent.click(screen.getByText('Season 3 quests are open'));
    expect(screen.queryByText('Season 3 quests are open')).toBeNull();
  });

  it('omits the View all footer entirely when no onViewAll is given', async () => {
    render(<AnnouncementBell {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    expect(screen.queryByRole('button', { name: /view all announcements/i })).toBeNull();
  });

  it('closes the popover when View all is clicked, not just when navigating away', async () => {
    // Same reasoning as the row-click case above, and the same blind spot: the
    // footer is inside rootRef, so neither the outside-click handler nor
    // Escape fires for it. Navigation does not save it either — the
    // announcement centre lives under the same layout route as the bell, so
    // the bell survives the navigation and the popover would hang over the
    // page the user just asked to see.
    const onViewAll = vi.fn();
    render(<AnnouncementBell {...props({ onViewAll })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    await userEvent.click(screen.getByRole('button', { name: /view all announcements/i }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Season 3 quests are open')).toBeNull();
  });

  it('marks everything read from the footer', async () => {
    const onMarkAllRead = vi.fn();
    render(<AnnouncementBell {...props({ onMarkAllRead })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    await userEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('exposes the auto-open toggle and reports changes', async () => {
    const onSetAutoOpen = vi.fn();
    render(<AnnouncementBell {...props({ onSetAutoOpen })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    const toggle = screen.getByRole('switch', { name: /auto-open/i });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await userEvent.click(toggle);
    expect(onSetAutoOpen).toHaveBeenCalledWith(false);
  });

  it('renders an empty state rather than a bare panel', async () => {
    render(<AnnouncementBell {...props({ items: [], unreadCount: 0 })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    expect(screen.getByText(/nothing new/i)).toBeTruthy();
  });

  it('always renders the type icon', async () => {
    render(<AnnouncementBell {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    expect(screen.getByTestId('announcement-type-icon')).toBeTruthy();
  });

  it('renders no <img> even when the announcement has a heroUrl — the row never shows the hero', async () => {
    render(<AnnouncementBell {...props({ items: [item({ heroUrl: 'https://cdn.example/hero.png' })] })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    expect(screen.getByTestId('announcement-type-icon')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('announces its popover state to assistive tech via aria-haspopup/aria-expanded', async () => {
    render(<AnnouncementBell {...props()} />);
    const trigger = screen.getByRole('button', { name: /announcements/i });
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on Escape', async () => {
    render(<AnnouncementBell {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Season 3 quests are open')).toBeNull();
  });

  it('hangs the popover from its right edge by default', async () => {
    render(<AnnouncementBell {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    const popover = screen.getByText('Season 3 quests are open').closest('[class*="absolute"]');
    expect(popover?.className).toContain('right-0');
    expect(popover?.className).not.toContain('left-0');
  });

  it('hangs the popover from its left edge when align="left"', async () => {
    render(<AnnouncementBell {...props({ align: 'left' })} />);
    await userEvent.click(screen.getByRole('button', { name: /announcements/i }));
    const popover = screen.getByText('Season 3 quests are open').closest('[class*="absolute"]');
    expect(popover?.className).toContain('left-0');
    expect(popover?.className).not.toContain('right-0');
  });
});

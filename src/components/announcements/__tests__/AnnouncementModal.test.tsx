import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementModal } from '../AnnouncementModal.js';
import type { ClientAnnouncement } from '../types.js';

function item(over: Partial<ClientAnnouncement> = {}): ClientAnnouncement {
  return {
    id: 'a1', priority: 'major', type: 'release', title: 'Season 3 quests are open',
    summary: 'S', body: 'Forty-two **new** quests.', heroUrl: 'https://cdn.example/hero.png',
    cta: { label: 'Browse quests', url: '/quests' },
    publishAt: '2026-07-01T00:00:00.000Z', expiresAt: null, read: false, ...over,
  };
}

describe('AnnouncementModal', () => {
  it('renders markdown rather than its syntax', () => {
    render(<AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(screen.getByText('new').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*new\*\*/)).toBeNull();
  });

  it('shows the hero image for an editorial announcement', () => {
    render(<AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('https://cdn.example/hero.png');
  });

  it('hides the hero image for a critical one, which must be read first', () => {
    render(<AnnouncementModal announcement={item({ priority: 'critical' })} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('reports a cta click and dismisses', async () => {
    const onCtaClick = vi.fn();
    const onDismiss = vi.fn();
    render(<AnnouncementModal announcement={item()} onDismiss={onDismiss} onCtaClick={onCtaClick} />);
    await userEvent.click(screen.getByRole('button', { name: /browse quests/i }));
    expect(onCtaClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('offers only a dismiss action when there is no cta', () => {
    render(<AnnouncementModal announcement={item({ cta: null })} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(screen.getByRole('button', { name: /got it/i })).toBeTruthy();
  });

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn();
    render(<AnnouncementModal announcement={item()} onDismiss={onDismiss} onCtaClick={() => {}} />);
    await userEvent.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalled();
  });

  it('never renders raw html from the body', () => {
    const evil = item({ body: 'before <img src=x onerror="alert(1)"> after' });
    const { container } = render(<AnnouncementModal announcement={evil} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(container.querySelector('img[onerror]')).toBeNull();
    expect(container.textContent).toContain('after');
  });
});

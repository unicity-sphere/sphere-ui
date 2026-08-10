import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders the body for a critical announcement, not the one-line popover summary', () => {
    // Regression: the alert flavour used to render `summary` — the two-line
    // string the bell popover shows — so everything the author wrote below
    // the first paragraph (the actual instructions a critical notice exists
    // to deliver) never reached the reader, even though the composer's own
    // preview showed the full body.
    const critical = item({
      priority: 'critical',
      summary:  'One line for the bell popover.',
      body:     'Update to **0.14.3** and redeploy.\n\n## Building a bot?\n\nThere is more to do than the version.',
    });
    render(<AnnouncementModal announcement={critical} onDismiss={() => {}} onCtaClick={() => {}} />);

    expect(screen.getByText('0.14.3').tagName).toBe('STRONG');
    expect(screen.getByRole('heading', { name: /building a bot/i })).toBeTruthy();
    expect(screen.getByText(/more to do than the version/)).toBeTruthy();
    // The summary is the popover's job; repeating it above a body derived
    // from the same first paragraph would read as a stutter.
    expect(screen.queryByText('One line for the bell popover.')).toBeNull();
  });

  it('keeps the actions reachable when the body is longer than the viewport', () => {
    // A blocking modal whose dismiss button has been pushed off-screen by a
    // long body is a trap: the body scrolls, the header and actions do not.
    const long = item({ priority: 'critical', body: Array.from({ length: 80 }, (_, i) => `Line ${i}.`).join('\n\n') });
    render(<AnnouncementModal announcement={long} onDismiss={() => {}} onCtaClick={() => {}} />);

    const scroller = screen.getByTestId('announcement-modal-body');
    expect(scroller.className).toContain('overflow-y-auto');
    // The dismiss button must live outside the scrolling region.
    expect(scroller.contains(screen.getByRole('button', { name: /got it/i }))).toBe(false);
  });

  it('always shows "Got it" for a critical announcement, even when it has a cta', () => {
    const critical = item({ priority: 'critical', cta: { label: 'View status', url: '/status' } });
    render(<AnnouncementModal announcement={critical} onDismiss={() => {}} onCtaClick={() => {}} />);
    expect(screen.getByRole('button', { name: /got it/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^later$/i })).toBeNull();
  });

  describe('focus management', () => {
    it('moves focus inside the dialog on mount', () => {
      render(<AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('traps focus: Tab from the last focusable wraps to the first, Shift+Tab from the first wraps to the last', async () => {
      render(<AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />);
      const later = screen.getByRole('button', { name: /^later$/i });
      const cta = screen.getByRole('button', { name: /browse quests/i });

      // Initial focus lands on the first focusable element in the dialog.
      expect(document.activeElement).toBe(later);

      await userEvent.tab();
      expect(document.activeElement).toBe(cta);

      // Tab from the last focusable wraps around to the first.
      await userEvent.tab();
      expect(document.activeElement).toBe(later);

      // Shift+Tab from the first focusable wraps around to the last.
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(cta);
    });

    it('returns focus to whatever opened it, once it closes', () => {
      const opener = document.createElement('button');
      opener.textContent = 'Open announcement';
      document.body.appendChild(opener);
      opener.focus();
      expect(document.activeElement).toBe(opener);

      const { unmount } = render(<AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />);
      expect(document.activeElement).not.toBe(opener);

      unmount();
      expect(document.activeElement).toBe(opener);

      opener.remove();
    });

    it('does not steal focus back to the first element when the parent re-renders with a fresh onDismiss', async () => {
      // Regression test: the focus/Escape effect used to depend on
      // `onDismiss`, so a parent passing a new inline arrow on every render
      // (the common case, and what Tasks 4/5 do) tore the effect down and
      // rebuilt it while the modal stayed open — snapping focus back to the
      // first focusable element even though the user had moved it elsewhere.
      function Host() {
        const [tick, setTick] = useState(0);
        return (
          <>
            <button onClick={() => setTick(t => t + 1)}>bump</button>
            {/* A fresh arrow every render, on purpose: this is the shape a
                consumer almost always writes, not a contrived worst case. */}
            <AnnouncementModal announcement={item()} onDismiss={() => {}} onCtaClick={() => {}} />
            <span data-testid="tick">{tick}</span>
          </>
        );
      }

      render(<Host />);
      const cta = screen.getByRole('button', { name: /browse quests/i });
      cta.focus();
      expect(document.activeElement).toBe(cta);

      // `fireEvent.click`, not `userEvent.click`: userEvent's click also
      // focuses the clicked element as part of simulating a real user
      // interaction, which would move focus to the "bump" button itself and
      // defeat the point of this test. `fireEvent` only dispatches the click
      // event and runs the handler, isolating the re-render this test cares
      // about from an unrelated focus change.
      fireEvent.click(screen.getByRole('button', { name: /^bump$/i }));
      expect(screen.getByTestId('tick').textContent).toBe('1');

      // Focus must still be exactly where the user left it.
      expect(document.activeElement).toBe(cta);
    });
  });
});

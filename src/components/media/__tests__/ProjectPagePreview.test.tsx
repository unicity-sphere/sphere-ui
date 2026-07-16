import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectPagePreview } from '../ProjectPagePreview.js';

describe('<ProjectPagePreview>', () => {
  it('renders project name and tagline', () => {
    render(<ProjectPagePreview name="Sphere Demo" slug="sphere-demo" tagline="A demo" />);
    expect(screen.getByText('Sphere Demo')).toBeInTheDocument();
    expect(screen.getByText('A demo')).toBeInTheDocument();
  });

  it('renders About description', () => {
    render(<ProjectPagePreview name="X" slug="x" description="Lorem ipsum dolor sit amet" />);
    expect(screen.getByText(/Lorem ipsum/i)).toBeInTheDocument();
  });

  it('renders quests preview when provided', () => {
    render(<ProjectPagePreview
      name="X" slug="x"
      quests={[
        { slug: 'q1', title: 'First quest', points: 100 },
        { slug: 'q2', title: 'Second quest', points: 200 },
      ]}
    />);
    expect(screen.getByText('First quest')).toBeInTheDocument();
    expect(screen.getByText('Second quest')).toBeInTheDocument();
  });

  it('renders YouTube thumbnail for video media items', () => {
    render(<ProjectPagePreview
      name="X" slug="x"
      media={[{ type: 'video', url: 'https://youtube.com/watch?v=abc123' }]}
    />);
    const img = screen.getByRole('img', { name: /video/i });
    expect(img).toHaveAttribute('src', 'https://img.youtube.com/vi/abc123/hqdefault.jpg');
  });

  it('pins the banner box to 3:1 and caps its width', () => {
    render(<ProjectPagePreview name="X" slug="x" bannerUrl="https://cdn/banner.png" />);
    const box = screen.getByTestId('banner').parentElement!;
    expect(box.className).toContain('aspect-[3/1]');
    expect(box.className).not.toMatch(/\bh-48\b|\bsm:h-64\b/);
    // Height is bounded via max-width on the wrapper, never max-height on the
    // box: max-height clamps after the ratio resolves and would float AR_box
    // again, restoring the very bug this fixes. max-w-5xl + mx-auto is the same
    // container every other section uses, so the banner lines up with them.
    expect(box.parentElement!.className).toContain('max-w-5xl');
    expect(box.parentElement!.className).toContain('mx-auto');
  });

  it('renders first 3 tags when provided', () => {
    render(<ProjectPagePreview name="X" slug="x" tags={['pvp', 'arena', 'rpg', 'multiplayer']} />);
    expect(screen.getByText(/pvp/i)).toBeInTheDocument();
    expect(screen.getByText(/arena/i)).toBeInTheDocument();
    expect(screen.getByText(/rpg/i)).toBeInTheDocument();
    expect(screen.queryByText(/multiplayer/i)).not.toBeInTheDocument();
  });
});

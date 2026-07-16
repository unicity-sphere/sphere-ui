import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturedProjectCard } from '../FeaturedProjectCard.js';

describe('<FeaturedProjectCard>', () => {
  it('renders name and tagline', () => {
    render(<FeaturedProjectCard name="Sphere Quest" tagline="Earn rewards" logoUrl={null} bannerUrl={null} />);
    expect(screen.getByText('Sphere Quest')).toBeInTheDocument();
    expect(screen.getByText('Earn rewards')).toBeInTheDocument();
  });

  it('renders Featured star badge', () => {
    render(<FeaturedProjectCard name="X" logoUrl={null} bannerUrl={null} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('renders stats when provided', () => {
    render(<FeaturedProjectCard name="X" logoUrl={null} bannerUrl={null} users={1234} quests={5} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('frames the banner exactly like the marketplace card — a pinned 3:1 strip', () => {
    render(<FeaturedProjectCard name="X" logoUrl={null} bannerUrl="https://cdn/banner.png" />);
    const banner = screen.getByTestId('banner');
    // The banner used to be the card's full-bleed background at 1.818:1, which
    // under `cover` cropped ~40% off the sides of a 3:1 master — the same asset
    // read as a tighter picture here than in the grid. A 3:1 strip matches both
    // the master and the marketplace card, so the frame is identical in both.
    expect(banner.className).toContain('aspect-[3/1]');
    // A fixed height would make AR_box track the viewport and re-crop per screen.
    expect(banner.className).not.toMatch(/\bh-44\b/);
    expect(screen.getByTestId('card').className).not.toMatch(/\bh-44\b|aspect-\[20\/11\]/);
  });

  it('renders the logo tile square and frameless', () => {
    render(<FeaturedProjectCard name="X" logoUrl="https://cdn/logo.svg" bannerUrl={null} />);
    const tile = screen.getByAltText('X').parentElement!;
    expect(tile.className).toContain('shrink-0');
    expect(tile.className).not.toContain('border-2');
  });

  it('leaves the plate uninterrupted — the logo sits in the caption, not over the art', () => {
    render(<FeaturedProjectCard name="X" logoUrl="https://cdn/logo.svg" bannerUrl="https://cdn/b.png" />);
    const banner = screen.getByTestId('banner');
    const tile = screen.getByAltText('X').parentElement!;
    // This is what separates an editorial placement from a catalogue tile: the
    // marketplace card punches its logo through the banner (-mt-8), this one
    // does not. If the logo ever lands inside the plate, the two cards have
    // collapsed into the same object again.
    expect(banner.contains(tile)).toBe(false);
    expect(tile.parentElement!.className).not.toMatch(/-mt-/);
  });

  it('omits the catalogue metadata the grid card carries', () => {
    render(
      <FeaturedProjectCard name="X" tagline="T" logoUrl={null} bannerUrl="https://cdn/b.png" users={5} quests={2} />,
    );
    // No category chip and no divider rule — the plate made the pitch.
    expect(screen.queryByText(/^GAME$/i)).not.toBeInTheDocument();
    expect(document.querySelector('.border-t')).toBeNull();
  });
});

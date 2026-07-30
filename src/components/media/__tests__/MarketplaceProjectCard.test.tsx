import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketplaceProjectCard } from '../MarketplaceProjectCard.js';

describe('<MarketplaceProjectCard>', () => {
  it('renders project name and tagline', () => {
    render(<MarketplaceProjectCard name="Sphere Demo" tagline="Lorem ipsum" logoUrl={null} bannerUrl={null} />);
    expect(screen.getByText('Sphere Demo')).toBeInTheDocument();
    expect(screen.getByText(/Lorem ipsum/i)).toBeInTheDocument();
  });

  it('renders logo when logoUrl provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl="https://cdn/logo.png" bannerUrl={null} />);
    expect(screen.getByAltText('X')).toHaveAttribute('src', 'https://cdn/logo.png');
  });

  it('renders banner when bannerUrl provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl="https://cdn/banner.png" />);
    const banner = screen.getByTestId('banner');
    // The banner div has an inner div with backgroundImage style
    expect(banner.innerHTML).toContain('https://cdn/banner.png');
  });

  it('falls back to initials when no logo', () => {
    render(<MarketplaceProjectCard name="Sphere Demo" logoUrl={null} bannerUrl={null} />);
    // No logo → ProjectLogo renders the name's monogram, not an <img>.
    expect(screen.getByText('SD')).toBeInTheDocument();
    expect(screen.queryByAltText('Sphere Demo')).not.toBeInTheDocument();
  });

  it('renders rating and user count when provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl={null} users={1234} ratingCount={10} positivePercent={80} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('renders the logo tile frameless (no ring or border wrapper)', () => {
    render(<MarketplaceProjectCard name="X" logoUrl="https://cdn/logo.png" bannerUrl={null} />);
    const tile = screen.getByAltText('X').parentElement!;
    const wrapper = tile.parentElement!;
    expect(tile.className).not.toMatch(/border/);
    expect(wrapper.className).not.toMatch(/ring-|border/);
  });

  it('pins the banner box to a fixed 3:1 ratio, not a fixed height', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl="https://cdn/banner.png" />);
    const banner = screen.getByTestId('banner');
    // A fixed height with a fluid width makes AR_box track the viewport, so the
    // same banner crops differently on a laptop and a 2K monitor. Pinning the
    // ratio is what makes the crop viewport-independent.
    expect(banner.className).toContain('aspect-[3/1]');
    expect(banner.className).not.toMatch(/\bh-24\b/);
  });

  it('renders the quests stat when a value is provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl={null} quests={5} />);
    expect(screen.getByTitle('Active quests')).toHaveTextContent('5');
  });

  it('renders the quests stat as 0 when explicitly passed 0', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl={null} quests={0} />);
    expect(screen.getByTitle('Active quests')).toHaveTextContent('0');
  });

  it('omits the quests stat entirely when quests is not provided (standalone SDK projects have no quests)', () => {
    const { container } = render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl={null} />);
    expect(screen.queryByTitle('Active quests')).not.toBeInTheDocument();
    // No dangling Target icon left behind either.
    expect(container.querySelector('svg.lucide-target')).toBeNull();
  });

  it('renders the category chip neutral, never accent-tinted', () => {
    render(
      <MarketplaceProjectCard
        name="X"
        logoUrl={null}
        bannerUrl={null}
        category="game"
        accentColor="#000000"
      />,
    );
    const chip = screen.getByText('Game');
    // No inline style — chip must stay readable regardless of project accentColor
    expect(chip.getAttribute('style')).toBeNull();
    expect(chip.className).toContain('text-neutral-600');
  });
});

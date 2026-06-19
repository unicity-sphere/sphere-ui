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
});

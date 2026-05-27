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
    expect(screen.getByAltText(/logo/i)).toHaveAttribute('src', 'https://cdn/logo.png');
  });

  it('renders banner when bannerUrl provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl="https://cdn/banner.png" />);
    expect(screen.getByAltText(/banner/i)).toHaveAttribute('src', 'https://cdn/banner.png');
  });

  it('falls back to initials when no logo', () => {
    render(<MarketplaceProjectCard name="Sphere Demo" logoUrl={null} bannerUrl={null} />);
    expect(screen.getByText('SD')).toBeInTheDocument();
  });

  it('renders rating and user count when provided', () => {
    render(<MarketplaceProjectCard name="X" logoUrl={null} bannerUrl={null} rating={4.8} userCount={1234} />);
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    expect(screen.getByText(/1.2k/)).toBeInTheDocument();
  });
});

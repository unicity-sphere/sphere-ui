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

  it('renders the logo tile square and frameless', () => {
    render(<FeaturedProjectCard name="X" logoUrl="https://cdn/logo.svg" bannerUrl={null} />);
    const tile = screen.getByAltText('X').parentElement!;
    expect(tile.className).toContain('shrink-0');
    expect(tile.className).not.toContain('border-2');
  });
});

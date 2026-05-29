import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstalledProjectIcon } from '../InstalledProjectIcon.js';

describe('<InstalledProjectIcon>', () => {
  it('renders logo image with alt = name when logoUrl provided', () => {
    render(<InstalledProjectIcon name="Sphere Quest" logoUrl="https://cdn/logo.png" />);
    const img = screen.getByAltText('Sphere Quest') as HTMLImageElement;
    expect(img.src).toBe('https://cdn/logo.png');
  });

  it('renders name as label when showLabel is true', () => {
    render(<InstalledProjectIcon name="Sphere Quest" logoUrl={null} showLabel />);
    expect(screen.getByText('Sphere Quest')).toBeInTheDocument();
  });
});

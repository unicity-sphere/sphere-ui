import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectLogo } from '../ProjectLogo.js';

describe('<ProjectLogo>', () => {
  it('renders the logo un-cropped (object-contain, not object-cover)', () => {
    render(<ProjectLogo name="Sphere Quests" logoUrl="https://cdn/logo.svg" />);
    const img = screen.getByAltText('Sphere Quests');
    expect(img.className).toContain('object-contain');
    expect(img.className).not.toContain('object-cover');
  });

  it('keeps the tile a fixed square in flex rows (shrink-0)', () => {
    render(<ProjectLogo name="Sphere Quests" logoUrl="https://cdn/logo.svg" />);
    const tile = screen.getByAltText('Sphere Quests').parentElement!;
    expect(tile.className).toContain('shrink-0');
  });

  it('renders no gloss overlays when a real logo is shown', () => {
    const { queryByTestId } = render(
      <ProjectLogo name="Sphere Quests" logoUrl="https://cdn/logo.svg" />,
    );
    expect(queryByTestId('logo-gloss')).toBeNull();
  });

  it('renders monogram + gloss when no logo is available', () => {
    const { getByTestId } = render(<ProjectLogo name="Sphere Quests" logoUrl={null} />);
    expect(screen.getByText('SQ')).toBeInTheDocument();
    expect(getByTestId('logo-gloss')).toBeInTheDocument();
  });

  it('falls back to monogram + gloss for placeholder logo URLs', () => {
    const { getByTestId } = render(
      <ProjectLogo name="Sphere Quests" logoUrl="https://placehold.co/128x128" />,
    );
    expect(screen.getByText('SQ')).toBeInTheDocument();
    expect(getByTestId('logo-gloss')).toBeInTheDocument();
  });
});

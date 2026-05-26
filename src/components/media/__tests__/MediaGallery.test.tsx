import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaGallery } from '../MediaGallery.js';

const noopUpload = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/x.png', assetId: 'ast_x' });

describe('<MediaGallery>', () => {
  it('renders current items as thumbnails', () => {
    render(
      <MediaGallery
        ownerType="project"
        ownerId="65f0"
        items={[
          { type: 'screenshot', url: 'https://x/1.png' },
          { type: 'screenshot', url: 'https://x/2.png' },
        ]}
        onChange={() => {}}
        uploadFn={noopUpload}
      />
    );
    expect(screen.getAllByAltText(/screenshot/i)).toHaveLength(2);
  });

  it('renders add tile when items < 10', () => {
    render(<MediaGallery ownerType="project" ownerId="65f0" items={[]} onChange={() => {}} uploadFn={noopUpload} />);
    expect(screen.getByLabelText(/add screenshot/i)).toBeInTheDocument();
  });

  it('hides add tile when items = 10', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ type: 'screenshot' as const, url: `https://x/${i}.png` }));
    render(<MediaGallery ownerType="project" ownerId="65f0" items={items} onChange={() => {}} uploadFn={noopUpload} />);
    expect(screen.queryByLabelText(/add screenshot/i)).not.toBeInTheDocument();
  });

  it('calls onChange when removing an item', () => {
    const onChange = vi.fn();
    render(
      <MediaGallery
        ownerType="project" ownerId="65f0"
        items={[
          { type: 'screenshot', url: 'https://x/1.png' },
          { type: 'screenshot', url: 'https://x/2.png' },
        ]}
        onChange={onChange}
        uploadFn={noopUpload}
      />
    );
    fireEvent.click(screen.getAllByLabelText(/remove/i)[0]);
    expect(onChange).toHaveBeenCalledWith([{ type: 'screenshot', url: 'https://x/2.png' }]);
  });
});

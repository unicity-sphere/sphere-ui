import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaGallery } from '../MediaGallery.js';

const noopUpload = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/x.png', assetId: 'ast_x' });

// jsdom has no URL.createObjectURL / revokeObjectURL — stub for blob previews.
const origCreate = URL.createObjectURL;
const origRevoke = URL.revokeObjectURL;
beforeAll(() => {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:shot') as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
});
afterAll(() => {
  URL.createObjectURL = origCreate;
  URL.revokeObjectURL = origRevoke;
});

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

  it('deferUpload: collects the File via onFilesChange without uploading', async () => {
    const onFilesChange = vi.fn();
    render(
      <MediaGallery
        ownerType="project"
        ownerId="pending"
        items={[]}
        onChange={() => {}}
        uploadFn={noopUpload}
        deferUpload
        onFilesChange={onFilesChange}
      />,
    );
    // open the inline uploader, then choose a file
    fireEvent.click(screen.getByLabelText(/add screenshot/i));
    const file = new File([new Uint8Array(8)], 'shot.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/file/i, { selector: 'input' }), { target: { files: [file] } });

    // File is collected (not uploaded) and surfaced to the parent
    await waitFor(() => expect(onFilesChange).toHaveBeenCalledWith([file]));
    expect(noopUpload).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaUploader } from '../MediaUploader.js';

const noopUpload = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/x.png', assetId: 'ast_x' });

// JSDOM does not implement URL.createObjectURL / revokeObjectURL by default;
// stub them globally so MediaUploader's blob preview path (and its unmount
// cleanup) does not crash. Individual tests can replace the stub if they need
// to assert on calls.
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;

beforeAll(() => {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:default') as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
});

afterAll(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});

/**
 * Make the environment look crop-capable: MediaUploader gates the editor on a
 * REAL canvas probe (getContext('2d') != null), which jsdom fails by design.
 * Returns a restore fn.
 */
function stubCropCapableEnv(width = 1920, height = 640): () => void {
  const prevBitmap = globalThis.createImageBitmap;
  const prevGetContext = HTMLCanvasElement.prototype.getContext;
  globalThis.createImageBitmap = vi
    .fn()
    .mockResolvedValue({ width, height, close: vi.fn() }) as unknown as typeof createImageBitmap;
  HTMLCanvasElement.prototype.getContext = vi
    .fn()
    .mockReturnValue({ drawImage: vi.fn() }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  return () => {
    globalThis.createImageBitmap = prevBitmap;
    HTMLCanvasElement.prototype.getContext = prevGetContext;
  };
}

describe('<MediaUploader> banner crop editor', () => {
  it('offers the frame editor for a banner before anything is uploaded', async () => {
    const restore = stubCropCapableEnv();
    try {
      const uploadFn = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/b.png', assetId: 'ast_b' });
      render(<MediaUploader kind="banner" ownerType="project" ownerId="65f0" uploadFn={uploadFn} onChange={vi.fn()} />);
      const file = new File([new Uint8Array(8)], 'b.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText(/file/i, { selector: 'input' }), { target: { files: [file] } });

      expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom')).toBeInTheDocument();
      // The author frames it first — nothing is sent until they commit.
      expect(uploadFn).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it('does not offer the frame editor for a logo', async () => {
    // 512x512 is already within the logo limit and already 1:1, so fitImage is
    // a no-op and the upload proceeds straight through.
    const restore = stubCropCapableEnv(512, 512);
    try {
      const uploadFn = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/l.png', assetId: 'ast_l' });
      render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={uploadFn} onChange={vi.fn()} />);
      const file = new File([new Uint8Array(8)], 'l.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText(/file/i, { selector: 'input' }), { target: { files: [file] } });

      // Logos render object-contain everywhere, so their framing is not an
      // authoring decision — the implicit centre crop only fixes a near-miss ratio.
      await vi.waitFor(() => expect(uploadFn).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });
});

describe('<MediaUploader>', () => {
  it('renders idle state with format/size hint', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={() => {}} />);
    expect(screen.getByText(/Drop image here/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
  });

  it('shows the URL input when the URL source tab is selected', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={() => {}} />);
    // Defaults to the Upload tab — URL input is not shown until you switch.
    expect(screen.queryByPlaceholderText(/https/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^url$/i }));
    expect(screen.getByPlaceholderText(/https/i)).toBeInTheDocument();
  });

  it('calls onChange when URL is pasted', () => {
    const onChange = vi.fn();
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /^url$/i }));
    fireEvent.change(screen.getByPlaceholderText(/https/i), { target: { value: 'https://external/x.png' } });
    fireEvent.blur(screen.getByPlaceholderText(/https/i));
    expect(onChange).toHaveBeenCalledWith('https://external/x.png');
  });

  it('shows current value preview when value is set', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" value="https://cdn/exist.png" uploadFn={noopUpload} onChange={() => {}} />);
    const preview = screen.getByAltText(/uploaded/i) as HTMLImageElement;
    expect(preview).toBeInTheDocument();
    expect(preview.src).toContain('https://cdn/exist.png');
  });

  it('rejects file over size limit (client-side)', async () => {
    const onChange = vi.fn();
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={onChange} />);
    const file = new File([new Uint8Array(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const input = screen.getByLabelText(/file/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/File too large/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects image whose dimensions exceed the limit (client-side)', async () => {
    // jsdom has no createImageBitmap; mock it to report oversized dimensions.
    const prev = globalThis.createImageBitmap;
    globalThis.createImageBitmap = vi
      .fn()
      .mockResolvedValue({ width: 3840, height: 1080, close: vi.fn() }) as unknown as typeof createImageBitmap;
    try {
      const onChange = vi.fn();
      // banner limit is 1920×640 — 3840×1080 exceeds it
      render(<MediaUploader kind="banner" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={onChange} />);
      const file = new File([new Uint8Array(8)], 'huge.png', { type: 'image/png' });
      const input = screen.getByLabelText(/file/i, { selector: 'input' });
      fireEvent.change(input, { target: { files: [file] } });
      expect(await screen.findByText(/Image too large/i)).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      globalThis.createImageBitmap = prev;
    }
  });

  it('calls onFileSelected (not uploadFn) when deferUpload=true', async () => {
    const uploadFn = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/x.png', assetId: 'ast_x' });
    const onFileSelected = vi.fn();
    const onChange = vi.fn();
    render(
      <MediaUploader
        kind="logo"
        ownerType="project"
        ownerId="pending"
        uploadFn={uploadFn}
        onChange={onChange}
        deferUpload
        onFileSelected={onFileSelected}
      />,
    );
    const file = new File([new Uint8Array(8)], 'logo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/file/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the pending state to render
    expect(await screen.findByText(/Uploads when you save/i)).toBeInTheDocument();
    expect(screen.getByText(/^Selected$/i)).toBeInTheDocument();

    // onFileSelected fires with the File, uploadFn never called, onChange clears any stale URL
    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(uploadFn).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(null);

    // URL paste fallback is hidden in defer mode
    expect(screen.queryByPlaceholderText(/https/i)).not.toBeInTheDocument();
  });

  it('shows pending state with blob preview when deferUpload=true', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const prevCreate = URL.createObjectURL;
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;

    try {
      const onFileSelected = vi.fn();
      render(
        <MediaUploader
          kind="logo"
          ownerType="project"
          ownerId="pending"
          uploadFn={noopUpload}
          onChange={() => {}}
          deferUpload
          onFileSelected={onFileSelected}
        />,
      );
      const file = new File([new Uint8Array(8)], 'logo.png', { type: 'image/png' });
      const input = screen.getByLabelText(/file/i, { selector: 'input' });
      fireEvent.change(input, { target: { files: [file] } });

      // Pending banner is visible
      expect(await screen.findByText(/Uploads when you save/i)).toBeInTheDocument();
      // Filename is shown
      expect(screen.getByText('logo.png')).toBeInTheDocument();
      // Blob preview img rendered from createObjectURL (now in-dropzone, alt="uploaded")
      const preview = screen.getByAltText(/uploaded/i) as HTMLImageElement;
      expect(preview.src).toBe('blob:fake');
      expect(createObjectURL).toHaveBeenCalledWith(file);
    } finally {
      URL.createObjectURL = prevCreate;
    }
  });
});

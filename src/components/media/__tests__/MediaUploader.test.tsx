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

describe('<MediaUploader>', () => {
  it('renders idle state with format/size hint', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={() => {}} />);
    expect(screen.getByText(/Drop image here/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
  });

  it('renders URL input as fallback', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/https/i)).toBeInTheDocument();
  });

  it('calls onChange when URL is pasted', () => {
    const onChange = vi.fn();
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" uploadFn={noopUpload} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(/https/i), { target: { value: 'https://external/x.png' } });
    fireEvent.blur(screen.getByPlaceholderText(/https/i));
    expect(onChange).toHaveBeenCalledWith('https://external/x.png');
  });

  it('shows current value preview when value is set', () => {
    render(<MediaUploader kind="logo" ownerType="project" ownerId="65f0" value="https://cdn/exist.png" uploadFn={noopUpload} onChange={() => {}} />);
    expect(screen.getByAltText(/current/i)).toBeInTheDocument();
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
    expect(await screen.findByText(/Selected \(uploads when you save\)/i)).toBeInTheDocument();

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
      expect(await screen.findByText(/Selected \(uploads when you save\)/i)).toBeInTheDocument();
      // Filename is shown
      expect(screen.getByText('logo.png')).toBeInTheDocument();
      // Blob preview img rendered from createObjectURL
      const preview = screen.getByAltText(/selected file preview/i) as HTMLImageElement;
      expect(preview.src).toBe('blob:fake');
      expect(createObjectURL).toHaveBeenCalledWith(file);
    } finally {
      URL.createObjectURL = prevCreate;
    }
  });
});

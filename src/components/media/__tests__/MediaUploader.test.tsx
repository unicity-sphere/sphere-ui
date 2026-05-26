import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaUploader } from '../MediaUploader.js';

const noopUpload = vi.fn().mockResolvedValue({ publicUrl: 'https://cdn/x.png', assetId: 'ast_x' });

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
});

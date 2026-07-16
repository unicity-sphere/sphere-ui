import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BannerCropEditor } from '../BannerCropEditor.js';

// react-easy-crop measures real layout, which jsdom does not do. Stub it and
// drive onCropComplete directly so these tests cover OUR contract: percentage
// -> fraction normalisation, and the zoom/reset controls.
vi.mock('react-easy-crop', () => ({
  default: ({
    zoom,
    onCropComplete,
  }: {
    zoom: number;
    onCropComplete: (area: { x: number; y: number; width: number; height: number }) => void;
  }) => (
    <button
      type="button"
      data-testid="fake-cropper"
      data-zoom={zoom}
      onClick={() => onCropComplete({ x: 12.5, y: 0, width: 75, height: 100 })}
    >
      cropper
    </button>
  ),
}));

describe('<BannerCropEditor>', () => {
  it('normalises the cropper percentages to 0..1 fractions', () => {
    const onCropChange = vi.fn();
    render(<BannerCropEditor src="blob:x" aspect={3} onCropChange={onCropChange} />);
    fireEvent.click(screen.getByTestId('fake-cropper'));
    expect(onCropChange).toHaveBeenCalledWith({ x: 0.125, y: 0, width: 0.75, height: 1 });
  });

  it('exposes a zoom control that starts fully zoomed out', () => {
    render(<BannerCropEditor src="blob:x" aspect={3} onCropChange={vi.fn()} />);
    const zoom = screen.getByLabelText('Zoom') as HTMLInputElement;
    expect(zoom.value).toBe('1');
    expect(zoom.min).toBe('1');
  });

  it('Reset returns the frame to the default without committing anything', () => {
    const onCropChange = vi.fn();
    render(<BannerCropEditor src="blob:x" aspect={3} onCropChange={onCropChange} />);

    // Reset is a no-op at the default frame, so it stays disabled until the
    // author actually changes something.
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '2.5' } });
    expect((screen.getByLabelText('Zoom') as HTMLInputElement).value).toBe('2.5');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    // Back to the default frame, and still in the editor — Reset re-centres,
    // it does not apply and close.
    expect((screen.getByLabelText('Zoom') as HTMLInputElement).value).toBe('1');
    expect(screen.getByTestId('fake-cropper')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom')).toBeInTheDocument();
  });
});

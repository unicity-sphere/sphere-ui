import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateRangePicker, type DateRangeValue } from '../DateRangePicker';

function setup(initial: DateRangeValue = { label: '30d' }) {
  const onChange = vi.fn();
  const view = render(<DateRangePicker value={initial} onChange={onChange} />);
  return { onChange, ...view };
}

describe('DateRangePicker', () => {
  it('renders all four default presets + Custom button', () => {
    setup();
    expect(screen.getByRole('button', { name: '1d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument();
  });

  it('renders only the requested presets when `presets` prop is provided', () => {
    render(<DateRangePicker value={{ label: '7d' }} onChange={vi.fn()} presets={['7d', '30d']} />);
    expect(screen.queryByRole('button', { name: '1d' })).toBeNull();
    expect(screen.queryByRole('button', { name: '90d' })).toBeNull();
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
  });

  it('marks the active preset with aria-pressed=true', () => {
    setup({ label: '7d' });
    expect(screen.getByRole('button', { name: '7d' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('emits a new value on preset click', () => {
    const { onChange } = setup({ label: '30d' });
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    expect(onChange).toHaveBeenCalledWith({ label: '7d' });
  });

  it('opens the custom panel when Custom is clicked', () => {
    setup();
    expect(screen.queryByLabelText(/from/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /custom/i }));
    expect(screen.getByText(/^from$/i)).toBeInTheDocument();
    expect(screen.getByText(/^to$/i)).toBeInTheDocument();
  });

  it('emits a custom range when user selects dates and clicks Apply', () => {
    const { container, onChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: /custom/i }));

    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(inputs.length).toBe(2);
    const [fromInput, toInput] = inputs;

    // Order matters: setting "from" to a value after the current "to" would be blocked
    // by the max attribute, so set `to` first to expand the allowed window.
    fireEvent.change(toInput,   { target: { value: '2026-02-01' } });
    fireEvent.change(fromInput, { target: { value: '2026-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onChange).toHaveBeenCalledWith({
      label: 'custom',
      from:  '2026-01-01',
      to:    '2026-02-01',
    });
  });

  it('shows "from — to" dates inside the Custom button when value is custom', () => {
    setup({ label: 'custom', from: '2026-01-01', to: '2026-02-01' });
    // The Custom button carries the selected dates in its visible text
    const customBtn = screen.getByLabelText(/custom date range/i);
    expect(customBtn.textContent).toContain('2026-01-01');
    expect(customBtn.textContent).toContain('2026-02-01');
  });
});

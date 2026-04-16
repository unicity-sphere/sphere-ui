import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders a block with default dimensions', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('animate-skeleton-pulse');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1rem');
  });

  it('accepts custom width, height, and radius', () => {
    const { container } = render(<Skeleton width="120px" height="32px" radius="4px" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
    expect(el.style.borderRadius).toBe('4px');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="my-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('my-class');
    expect(el).toHaveClass('animate-skeleton-pulse');
  });

  it('exposes aria-busy for accessibility', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-busy', 'true');
  });
});

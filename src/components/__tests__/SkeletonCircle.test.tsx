import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCircle } from '../SkeletonCircle';

describe('SkeletonCircle', () => {
  it('renders a round element with medium size by default', () => {
    const { container } = render(<SkeletonCircle />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-skeleton-pulse');
    expect(el.style.borderRadius).toBe('50%');
    expect(el.style.width).toBe('2.5rem');
    expect(el.style.height).toBe('2.5rem');
  });

  it('accepts size="sm" (1.5rem)', () => {
    const { container } = render(<SkeletonCircle size="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('1.5rem');
    expect(el.style.height).toBe('1.5rem');
  });

  it('accepts size="lg" (4rem)', () => {
    const { container } = render(<SkeletonCircle size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('4rem');
    expect(el.style.height).toBe('4rem');
  });

  it('accepts custom numeric size via size prop (string)', () => {
    const { container } = render(<SkeletonCircle size="3rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('3rem');
    expect(el.style.height).toBe('3rem');
  });

  it('merges custom className', () => {
    const { container } = render(<SkeletonCircle className="avatar-slot" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('avatar-slot');
  });
});

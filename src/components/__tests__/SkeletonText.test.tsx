import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonText } from '../SkeletonText';

describe('SkeletonText', () => {
  it('renders a single line by default', () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll('.animate-skeleton-pulse');
    expect(lines).toHaveLength(1);
  });

  it('renders the requested number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const lines = container.querySelectorAll('.animate-skeleton-pulse');
    expect(lines).toHaveLength(4);
  });

  it('last line is shorter than the rest (truncated paragraph effect)', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('.animate-skeleton-pulse');
    const last = lines[2] as HTMLElement;
    expect(last.style.width).toBe('70%');
  });

  it('single line renders at full width', () => {
    const { container } = render(<SkeletonText lines={1} />);
    const line = container.querySelector('.animate-skeleton-pulse') as HTMLElement;
    expect(line.style.width).toBe('100%');
  });

  it('merges custom className on the wrapper', () => {
    const { container } = render(<SkeletonText className="my-wrapper" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('my-wrapper');
  });
});

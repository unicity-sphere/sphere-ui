import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonText } from '../SkeletonText';

const SKELETON_LINE_SELECTOR = '[role="status"] > [aria-busy="true"]';

describe('SkeletonText', () => {
  it('renders a single line by default', () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll(SKELETON_LINE_SELECTOR);
    expect(lines).toHaveLength(1);
  });

  it('renders the requested number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const lines = container.querySelectorAll(SKELETON_LINE_SELECTOR);
    expect(lines).toHaveLength(4);
  });

  it('last line is shorter than the rest (truncated paragraph effect)', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll(SKELETON_LINE_SELECTOR);
    const last = lines[2] as HTMLElement;
    expect(last.style.width).toBe('70%');
  });

  it('single line renders at full width', () => {
    const { container } = render(<SkeletonText lines={1} />);
    const line = container.querySelector(SKELETON_LINE_SELECTOR) as HTMLElement;
    expect(line.style.width).toBe('100%');
  });

  it('wrapper has role=status and aria-busy=true', () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('role', 'status');
    expect(wrapper).toHaveAttribute('aria-busy', 'true');
  });

  it('merges custom className on the wrapper', () => {
    const { container } = render(<SkeletonText className="my-wrapper" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('my-wrapper');
  });
});

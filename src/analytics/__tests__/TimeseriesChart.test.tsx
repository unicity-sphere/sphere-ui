import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimeseriesChart } from '../TimeseriesChart';

// ResponsiveContainer needs a real size to render children; jsdom has no
// layout so we mock its measurement.
HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    width: 600, height: 240, top: 0, left: 0, bottom: 240, right: 600,
    x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect;
};

describe('TimeseriesChart', () => {
  it('renders empty-state when data is empty', () => {
    render(
      <TimeseriesChart
        data={[]}
        series={[{ dataKey: 'total', name: 'Total' }]}
      />,
    );
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('renders custom empty-state node when provided', () => {
    render(
      <TimeseriesChart
        data={[]}
        series={[{ dataKey: 'x', name: 'X' }]}
        emptyState={<span>Nothing yet</span>}
      />,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('respects custom height', () => {
    const { container } = render(
      <TimeseriesChart
        data={[]}
        series={[{ dataKey: 'x', name: 'X' }]}
        height={400}
      />,
    );
    expect((container.firstChild as HTMLElement).style.height).toBe('400px');
  });
});

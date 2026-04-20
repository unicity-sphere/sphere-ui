import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopEntitiesTable, type TopEntity } from '../TopEntitiesTable';

const ENTITIES: TopEntity[] = [
  { id: 'a', title: 'Alpha',  value: 100 },
  { id: 'b', title: 'Beta',   value: 50  },
  { id: 'c', title: 'Gamma',  value: 25  },
];

describe('TopEntitiesTable', () => {
  it('renders title when provided', () => {
    render(<TopEntitiesTable entities={ENTITIES} title="Top Quests" />);
    expect(screen.getByText('Top Quests')).toBeInTheDocument();
  });

  it('renders every entity with its rank, title, and formatted value', () => {
    render(<TopEntitiesTable entities={ENTITIES} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('3.')).toBeInTheDocument();
  });

  it('shows empty state when entities is empty', () => {
    render(<TopEntitiesTable entities={[]} emptyState="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows default empty message when no emptyState provided', () => {
    render(<TopEntitiesTable entities={[]} />);
    expect(screen.getByText('No entries')).toBeInTheDocument();
  });

  it('renders secondary metric when provided on any entity', () => {
    const withSecondary: TopEntity[] = [
      { id: 'a', title: 'Alpha', value: 100, secondary: 10 },
    ];
    render(<TopEntitiesTable entities={withSecondary} secondaryLabel="XP" />);
    expect(screen.getByText(/10 XP/)).toBeInTheDocument();
  });

  it('bar widths are proportional (100% for max)', () => {
    const { container } = render(<TopEntitiesTable entities={ENTITIES} />);
    const bars = container.querySelectorAll('li > div:last-child > div');
    expect((bars[0] as HTMLElement).style.width).toBe('100%');  // 100/100
    expect((bars[1] as HTMLElement).style.width).toBe('50%');   // 50/100
    expect((bars[2] as HTMLElement).style.width).toBe('25%');   // 25/100
  });

  it('omits bars when hideBars is true', () => {
    const { container } = render(<TopEntitiesTable entities={ENTITIES} hideBars />);
    const bars = container.querySelectorAll('li .h-1\\.5');
    expect(bars.length).toBe(0);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Zap } from 'lucide-react';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  it('renders label and numeric value with toLocaleString()', () => {
    render(<KPICard label="Total" value={12345} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  it('renders string values verbatim', () => {
    render(<KPICard label="Rate" value="85%" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('calls custom format when provided', () => {
    render(<KPICard label="X" value={0.42} format={(v) => `${Math.round((v as number) * 100)}%`} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('renders hint text below the value', () => {
    render(<KPICard label="Users" value={100} hint="vs previous 30 days" />);
    expect(screen.getByText('vs previous 30 days')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<KPICard label="X" value={1} icon={<Zap data-testid="zap-icon" />} />);
    expect(container.querySelector('[data-testid="zap-icon"]')).toBeInTheDocument();
  });

  describe('trend indicator', () => {
    it('shows no trend pill when previousValue is undefined', () => {
      render(<KPICard label="X" value={100} />);
      expect(screen.queryByText('+')).toBeNull();
      expect(screen.queryByText(/%/)).toBeNull();
    });

    it('shows +23% when value grew from 100 to 123', () => {
      render(<KPICard label="X" value={123} previousValue={100} />);
      expect(screen.getByText(/\+23%/)).toBeInTheDocument();
    });

    it('shows -25% when value dropped from 100 to 75', () => {
      render(<KPICard label="X" value={75} previousValue={100} />);
      expect(screen.getByText(/-25%/)).toBeInTheDocument();
    });

    it('shows 0% when value unchanged', () => {
      render(<KPICard label="X" value={100} previousValue={100} />);
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('shows up-trend when previous was 0 and now > 0', () => {
      render(<KPICard label="X" value={10} previousValue={0} />);
      expect(screen.getByText(/\+100%/)).toBeInTheDocument();
    });

    it('does not render trend for string values', () => {
      render(<KPICard label="X" value="85%" previousValue={100} />);
      expect(screen.queryByText(/\+\d+%/)).toBeNull();
    });
  });
});

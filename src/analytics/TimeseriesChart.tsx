import {
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

export interface TimeseriesSeries {
  /** Key inside each data point (e.g. 'installs'). */
  dataKey: string;
  /** Human label shown in legend and tooltip. */
  name:    string;
  /** Hex color; defaults are applied when omitted. */
  color?:  string;
}

export interface TimeseriesChartProps {
  /** Array of points. Each entry must include a 'date' field (YYYY-MM-DD). */
  data:       Array<Record<string, string | number>>;
  series:     TimeseriesSeries[];
  /** Visual style. 'area' stacks series with translucent fill, 'line' draws plain lines. */
  variant?:   'line' | 'area';
  /** px height. Defaults to 240 to match dev-portal cards. */
  height?:    number;
  stacked?:   boolean;
  showLegend?: boolean;
  showGrid?:   boolean;
  className?: string;
  /** Empty-state content when data is length 0. Defaults to a subtle placeholder. */
  emptyState?: React.ReactNode;
}

const DEFAULT_COLORS = ['#10b981', '#f43f5e', '#60a5fa', '#a78bfa', '#fbbf24', '#ec4899'];

/**
 * Shared timeseries chart used for completions, installs, achievements,
 * etc. Encapsulates the Recharts wiring so both admin and developer
 * views render charts identically.
 */
export function TimeseriesChart({
  data,
  series,
  variant = 'area',
  height = 240,
  stacked = false,
  showLegend = true,
  showGrid = true,
  className = '',
  emptyState,
}: TimeseriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-[var(--text-muted,rgba(255,255,255,0.4))] ${className}`}
        style={{ height }}
      >
        {emptyState ?? 'No data for this period'}
      </div>
    );
  }

  const Chart = variant === 'area' ? AreaChart : LineChart;
  const gridStroke = 'rgba(255,255,255,0.06)';
  const axisColor  = 'rgba(255,255,255,0.4)';

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <Chart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />}
          <XAxis
            dataKey="date"
            stroke={axisColor}
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface, #0f0f13)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-muted, rgba(255,255,255,0.6))' }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: axisColor }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            if (variant === 'area') {
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.18}
                  stackId={stacked ? 'stack' : undefined}
                />
              );
            }
            return (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

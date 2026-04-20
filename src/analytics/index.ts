/**
 * Shared analytics components. Import from `@unicitylabs/sphere-ui/analytics`
 * to keep `recharts` out of the bundle of consumers that don't render charts.
 *
 * All components are design-system-aware (accept `accentColor`, follow
 * --surface / --text-* CSS vars) so the same render looks consistent
 * inside both sphere-backoffice and sphere-dev-portal shells.
 */
export { DateRangePicker, dateRangePresetLabels } from './DateRangePicker.js';
export type {
  DateRangePickerProps,
  DateRangeValue,
  DateRangeLabel,
  DateRangePreset,
} from './DateRangePicker.js';

export { TimeseriesChart } from './TimeseriesChart.js';
export type { TimeseriesChartProps, TimeseriesSeries } from './TimeseriesChart.js';

export { KPICard } from './KPICard.js';
export type { KPICardProps } from './KPICard.js';

export { TopEntitiesTable } from './TopEntitiesTable.js';
export type { TopEntitiesTableProps, TopEntity } from './TopEntitiesTable.js';

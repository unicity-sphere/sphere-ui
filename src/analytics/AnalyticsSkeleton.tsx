import { Skeleton } from '../components/Skeleton.js';
import { SkeletonText } from '../components/SkeletonText.js';
import { SkeletonCircle } from '../components/SkeletonCircle.js';

export interface AnalyticsSkeletonProps {
  /** Rendered above the grid — usually the existing page header (title + DateRangePicker). */
  header?: React.ReactNode;
  /** Hide KPI rows — useful if the consumer already renders its own. */
  showKpiRows?: boolean;
  /** Hide chart blocks. */
  showCharts?: boolean;
  /** Hide the split bottom row (top quests + platform breakdown). */
  showBottomTables?: boolean;
  className?: string;
}

/**
 * Skeleton state for the shared Analytics page layout. Mirrors the
 * structure AdminProjectAnalyticsPage / ProjectAnalyticsPage render
 * after data arrives: two rows of four KPI cards, two chart blocks,
 * and a split row of two table cards. Consumers pass the same
 * `header` they render in the real state so the date-range picker
 * stays interactive while data loads.
 */
export function AnalyticsSkeleton({
  header,
  showKpiRows = true,
  showCharts = true,
  showBottomTables = true,
  className = '',
}: AnalyticsSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`} aria-busy="true" aria-label="Loading analytics">
      {header}

      {showKpiRows && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {showCharts && (
        <>
          <ChartBlockSkeleton />
          <ChartBlockSkeleton />
        </>
      )}

      {showBottomTables && (
        <div className="grid lg:grid-cols-2 gap-4">
          <TableBlockSkeleton rows={5} />
          <TableBlockSkeleton rows={5} />
        </div>
      )}
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-(--border,rgba(255,255,255,0.08)) bg-(--surface,rgba(255,255,255,0.02)) p-5">
      <div className="flex items-center gap-2 mb-3">
        <SkeletonCircle size="sm" />
        <Skeleton width="60%" height="10px" />
      </div>
      <Skeleton width="40%" height="28px" />
    </div>
  );
}

function ChartBlockSkeleton() {
  return (
    <div className="rounded-xl border border-(--border,rgba(255,255,255,0.08)) bg-(--surface,rgba(255,255,255,0.02)) p-5">
      <Skeleton width="30%" height="14px" className="mb-4" />
      <Skeleton width="100%" height="240px" radius="8px" />
    </div>
  );
}

function TableBlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-(--border,rgba(255,255,255,0.08)) bg-(--surface,rgba(255,255,255,0.02)) p-5">
      <Skeleton width="40%" height="14px" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div style={{ width: '55%' }}>
                <SkeletonText lines={1} />
              </div>
              <Skeleton width="40px" height="12px" />
            </div>
            <Skeleton width="100%" height="6px" radius="3px" />
          </div>
        ))}
      </div>
    </div>
  );
}

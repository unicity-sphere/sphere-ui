import { Skeleton } from './Skeleton';

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: string;
  gap?: string;
  className?: string;
}

export function SkeletonText({
  lines = 1,
  lineHeight = '0.875rem',
  gap = '0.5rem',
  className = '',
}: SkeletonTextProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1 && lines > 1;
        return (
          <Skeleton
            key={i}
            width={isLast ? '70%' : '100%'}
            height={lineHeight}
            radius="var(--radius-sm, 6px)"
          />
        );
      })}
    </div>
  );
}

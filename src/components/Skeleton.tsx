export interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-md)',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`animate-skeleton-pulse ${className}`.trim()}
      aria-busy="true"
      aria-live="polite"
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
      }}
    />
  );
}

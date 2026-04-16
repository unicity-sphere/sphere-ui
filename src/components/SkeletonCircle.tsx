import { Skeleton } from './Skeleton';

export type SkeletonCircleSize = 'sm' | 'md' | 'lg' | (string & {});

export interface SkeletonCircleProps {
  size?: SkeletonCircleSize;
  className?: string;
}

const NAMED_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: '1.5rem',
  md: '2.5rem',
  lg: '4rem',
};

function resolveSize(size: SkeletonCircleSize): string {
  if (size === 'sm' || size === 'md' || size === 'lg') return NAMED_SIZES[size as 'sm' | 'md' | 'lg'];
  return size;
}

export function SkeletonCircle({ size = 'md', className = '' }: SkeletonCircleProps) {
  const dim = resolveSize(size);
  return <Skeleton width={dim} height={dim} radius="50%" className={className} />;
}

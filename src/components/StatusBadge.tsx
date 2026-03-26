const STATUS_COLORS: Record<string, string> = {
  ACTIVE:  'badge-green',
  DRAFT:   'badge-gray',
  PAUSED:  'badge-yellow',
  EXPIRED: 'badge-red',
  ENDED:   'badge-red',
  AWARDED: 'badge-green',
  REJECTED:'badge-red',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_COLORS[status] ?? 'badge-gray'} ${className}`}>
      {status}
    </span>
  );
}

export interface MarketplaceProjectCardProps {
  name: string;
  tagline?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  rating?: number;
  userCount?: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatUsers(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * MarketplaceProjectCard — preview of a project card in sphere wallet marketplace style.
 *
 * Used by dev-portal & backoffice as a live preview while editing a project,
 * so authors can see roughly how their card will look in the marketplace.
 *
 * Adapted to sphere-ui design tokens (dark-tier admin palette).
 * Visually adjacent to sphere wallet's ProjectCard but not a 1:1 copy.
 */
export function MarketplaceProjectCard({
  name,
  tagline,
  logoUrl,
  bannerUrl,
  rating,
  userCount,
}: MarketplaceProjectCardProps) {
  const hasBanner = !!bannerUrl;
  const showStats = rating !== undefined || userCount !== undefined;

  return (
    <div className="w-[280px] rounded-[--radius-lg] overflow-hidden bg-[--bg-elevated] border border-[--border] font-[--font-body] shadow-[--shadow-md]">
      {/* Banner */}
      <div className="relative h-20 bg-[--bg-surface] overflow-hidden">
        {hasBanner ? (
          <img
            src={bannerUrl!}
            alt={`${name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,111,0,0.35) 0%, rgba(255,111,0,0.05) 100%)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className={`w-12 h-12 rounded-[--radius-md] object-cover bg-[--bg-surface] border border-[--border] shrink-0 ${
                hasBanner ? '-mt-8 ring-2 ring-[--bg-elevated] relative z-10' : ''
              }`}
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-[--radius-md] flex items-center justify-center bg-[--accent-glow] text-[--accent] font-bold text-sm shrink-0 ${
                hasBanner ? '-mt-8 ring-2 ring-[--bg-elevated] relative z-10' : ''
              }`}
            >
              {initials(name)}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-[--text-primary] font-medium text-sm truncate">{name}</div>
            {tagline && (
              <div className="text-xs text-[--text-muted] mt-0.5 truncate">{tagline}</div>
            )}
          </div>
        </div>

        {showStats && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[--border-subtle] text-[11px] text-[--text-muted]">
            {rating !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-[--accent]">★</span> {rating.toFixed(1)}
              </span>
            )}
            {userCount !== undefined && (
              <span>· {formatUsers(userCount)} users</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Users, Target, ThumbsUp, Plus, Check } from 'lucide-react';
import { ProjectLogo } from './ProjectLogo';

export interface MarketplaceProjectCardProps {
  name: string;
  tagline?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  /** Hex like "#FF6F00". Defaults to brand orange. */
  accentColor?: string;
  category?: 'game' | 'defi' | 'social' | 'tool' | 'nft' | 'other' | string;
  users?: number;
  /** Active quest count. Omit entirely for standalone (SDK) projects that have no quests — a `0` renders as `0`, absent renders nothing. */
  quests?: number;
  positivePercent?: number;
  ratingCount?: number;
  /** Show install button overlay. Pass `'installed'` or `'available'` to render the right state. Pass `'none'` (default) to hide it (used in preview mode). */
  installState?: 'none' | 'available' | 'installed';
  /** Only fires when `installState !== 'none'`. */
  onInstallClick?: () => void;
  /** Optional click handler for the whole card (apps wrapping with router Link externally should leave this undefined). */
  onClick?: () => void;
}

const categoryLabels: Record<string, string> = {
  game: 'Game', defi: 'DeFi', social: 'Social', tool: 'Tool', nft: 'NFT', other: 'Other',
};

/**
 * MarketplaceProjectCard — 1:1 visual copy of sphere wallet's ProjectCard.
 *
 * Used by dev-portal & backoffice as a live preview while editing a project,
 * so authors can see exactly how their card will look in the marketplace.
 *
 * No `<Link>` dependency — wrap externally if router navigation is needed.
 */
export function MarketplaceProjectCard({
  name,
  tagline,
  logoUrl,
  bannerUrl,
  accentColor = '#FF6F00',
  category,
  users = 0,
  quests,
  positivePercent = 0,
  ratingCount = 0,
  installState = 'none',
  onInstallClick,
  onClick,
}: MarketplaceProjectCardProps) {
  const hasBanner = !!bannerUrl;
  const installed = installState === 'installed';
  const showInstall = installState !== 'none';

  const handleInstall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInstallClick?.();
  };

  const card = (
    <motion.div
      whileHover={{ y: -4 }}
      className="no-text-shadow group rounded-2xl border border-neutral-200 dark:border-white/8 hover:border-orange-500/60 dark:hover:border-brand-orange/60 hover:shadow-lg hover:shadow-orange-500/10 dark:hover:shadow-brand-orange/15 transition-all duration-200 cursor-pointer relative overflow-hidden"
    >
      {/* Banner background — ratio is pinned (never a fixed height) so the crop
          is identical on every screen: under `cover` the visible crop depends
          only on AR_box / AR_image. 3:1 matches MEDIA_LIMITS.banner, so a
          correctly authored banner crops to zero. Cards stay uniform because
          the grid column width is uniform. */}
      <div className="relative aspect-[3/1] overflow-hidden" data-testid="banner">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundColor: accentColor,
            backgroundImage: hasBanner ? `url(${bannerUrl})` : undefined,
          }}
        />
        <div className="absolute inset-0" style={{
          background: hasBanner
            ? `linear-gradient(to bottom, transparent 0%, ${accentColor}66 100%)`
            : `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}44 100%)`,
        }} />

        {/* Install button */}
        {showInstall && (
          <button
            onClick={handleInstall}
            title={installed ? 'Remove from Desktop' : 'Add to Desktop'}
            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all ${
              installed
                ? 'bg-green-500/30 text-white border border-green-400/40'
                : 'bg-black/30 text-white/70 border border-white/15 hover:bg-orange-500/40 hover:text-white hover:border-orange-400/40'
            }`}
          >
            {installed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-white/4 dark:backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* No ring/border around the tile — logo tiles are frameless everywhere */}
          <div className="shrink-0 -mt-8 relative z-10">
            <ProjectLogo
              name={name}
              logoUrl={logoUrl}
              accentColor={accentColor}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{name}</h3>
            <p className="text-neutral-500 dark:text-white/45 text-xs mt-0.5 h-8 line-clamp-2">{tagline}</p>
          </div>
        </div>

        {/* Category + Stats — fixed layout */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-white/5">
          {category ? (
            // Neutral chip on purpose — accent-tinted text turns unreadable
            // with dark/low-contrast project accent colors.
            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-white/6 text-neutral-600 dark:text-white/60 border border-neutral-200 dark:border-white/10">
              {categoryLabels[category] ?? category}
            </span>
          ) : <span />}
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-white/35">
            <span className="flex items-center gap-1" title="Users"><Users className="w-3 h-3" />{users.toLocaleString()}</span>
            {quests !== undefined && (
              <span className="flex items-center gap-1" title="Active quests"><Target className="w-3 h-3" />{quests.toLocaleString()}</span>
            )}
            {ratingCount > 0 && (
              <span className="flex items-center gap-1" title={`${ratingCount} reviews`}>
                <ThumbsUp className="w-3 h-3" />{positivePercent}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {card}
      </button>
    );
  }
  return card;
}

import { motion } from 'framer-motion';
import { Star, Users, Target, ThumbsUp } from 'lucide-react';
import { ProjectLogo } from './ProjectLogo';

export interface FeaturedProjectCardProps {
  name: string;
  tagline?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  /** Hex like "#FF6F00". Defaults to brand orange. */
  accentColor?: string;
  users?: number;
  /** Active quest count. Omit entirely for standalone (SDK) projects that have no quests — a `0` renders as `0`, absent renders nothing. */
  quests?: number;
  positivePercent?: number;
  ratingCount?: number;
  onClick?: () => void;
}

/**
 * FeaturedProjectCard — 1:1 visual copy of sphere wallet's FeaturedProjectCard.
 *
 * Wide hero-style card used in marketplace featured rails.
 * No `<Link>` dependency — wrap externally if router navigation is needed.
 */
export function FeaturedProjectCard({
  name,
  tagline,
  logoUrl,
  bannerUrl,
  accentColor = '#FF6F00',
  users = 0,
  quests,
  positivePercent = 0,
  ratingCount = 0,
  onClick,
}: FeaturedProjectCardProps) {
  const card = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      data-testid="card"
      className="no-text-shadow relative w-80 sm:w-96 rounded-2xl overflow-hidden shrink-0 cursor-pointer group border border-neutral-200 dark:border-white/8 hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-colors duration-200"
    >
      {/* The plate — an uninterrupted 3:1 plate of the project's own artwork.
          Nothing overlaps it: the marketplace card punches its logo through the
          banner because it is a catalogue tile optimised for comparison; this is
          an editorial placement, so the artwork is left whole and the caption
          sits under it. That contrast, not size, is what separates the two.

          3:1 is also the ratio the banner is authored at and the ratio the grid
          card renders, so the same asset shows the same frame in both. It used
          to be this card's full-bleed background at 1.818:1, which under `cover`
          scaled the master to the box HEIGHT and cropped ~40% off the sides —
          the same banner read as a tighter, more zoomed-in picture here than in
          the grid. Ratio, never a fixed height, keeps the frame identical on
          every screen. */}
      <div className="relative aspect-[3/1] overflow-hidden" data-testid="banner">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundColor: accentColor,
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          }}
        />
        <div className="absolute inset-0" style={{
          background: bannerUrl
            ? `linear-gradient(to bottom, transparent 0%, ${accentColor}66 100%)`
            : `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}44 100%)`,
        }} />

        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
          <Star className="w-3 h-3" fill="currentColor" />
          Featured
        </div>
      </div>

      {/* The caption — one quiet line of identity. No category chip, no divider,
          no second tagline row: the plate above already made the pitch, and the
          full metadata is the grid card's job. */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-white/4 dark:backdrop-blur-2xl">
        <ProjectLogo
          name={name}
          logoUrl={logoUrl}
          accentColor={accentColor}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{name}</h3>
          <p className="text-neutral-500 dark:text-white/45 text-xs truncate">{tagline}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5 text-[11px] text-neutral-400 dark:text-white/35">
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
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block text-left" draggable={false}>
        {card}
      </button>
    );
  }
  return card;
}

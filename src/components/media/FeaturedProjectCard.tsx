import { motion } from 'framer-motion';
import { Star, Users, Target, ThumbsUp } from 'lucide-react';

export interface FeaturedProjectCardProps {
  name: string;
  tagline?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  /** Hex like "#FF6F00". Defaults to brand orange. */
  accentColor?: string;
  users?: number;
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
  quests = 0,
  positivePercent = 0,
  ratingCount = 0,
  onClick,
}: FeaturedProjectCardProps) {
  const placeholderLogo = `https://placehold.co/40x40/${accentColor.slice(1)}/white?text=${name[0] ?? '?'}`;

  const card = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-72 sm:w-80 h-44 rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
    >
      {/* Banner background — use bannerUrl image if available, fallback to accent gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        data-testid="banner"
        style={{
          backgroundColor: accentColor,
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
        }}
      />
      {/* Color overlay — lighter when banner image is present */}
      <div className="absolute inset-0" style={{
        background: bannerUrl
          ? `linear-gradient(135deg, ${accentColor}66 0%, transparent 60%)`
          : `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}44 100%)`,
      }} />

      {/* Gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Featured badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
        <Star className="w-3 h-3" fill="currentColor" />
        Featured
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl ?? placeholderLogo}
            alt={name}
            className="w-10 h-10 rounded-xl object-cover border-2 border-white/20 shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderLogo; }}
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{name}</h3>
            <p className="text-white/70 text-xs truncate">{tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/60">
          <span className="flex items-center gap-1" title="Users"><Users className="w-3 h-3" />{users.toLocaleString()}</span>
          <span className="flex items-center gap-1" title="Active quests"><Target className="w-3 h-3" />{quests.toLocaleString()}</span>
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

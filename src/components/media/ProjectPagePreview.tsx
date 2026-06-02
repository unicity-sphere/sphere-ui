import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Target,
  ThumbsUp,
  Globe,
  Plus,
  Star,
  Trophy,
  MessageCircle,
  Twitter,
  Zap,
} from 'lucide-react';
import type { MediaItem } from './MediaGallery.js';

export interface QuestPreviewSummary {
  slug: string;
  title: string;
  description?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface AchievementPreviewSummary {
  slug: string;
  title: string;
  imageUrl?: string | null;
  points?: number;
}

export interface ProjectPagePreviewProps {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  accentColor?: string;
  category?: string;
  websiteUrl?: string;
  discordUrl?: string;
  twitterUrl?: string;
  /** All media (screenshots + videos) for the strip */
  media?: MediaItem[];
  /** Live or static metrics — preview just shows what's passed */
  users?: number;
  activeQuests?: number;
  positivePercent?: number;
  ratingCount?: number;
  /** Sample quests to show in the "Quests" section */
  quests?: QuestPreviewSummary[];
  /** Sample achievements */
  achievements?: AchievementPreviewSummary[];
  /** Project tags — first 3 are rendered as chips next to the category badge */
  tags?: string[];
}

const categoryLabels: Record<string, string> = {
  game: 'Game', defi: 'DeFi', social: 'Social', tool: 'Tool', nft: 'NFT', other: 'Other',
};

const difficultyStyles: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/25',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
};

/** Extract YouTube thumbnail URL for video items, otherwise return the original URL. */
function getMediaThumb(m: MediaItem): string {
  if (m.type !== 'video') return m.url;
  const ytMatch = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : m.url;
}

/**
 * ProjectPagePreview — stateless 1:1 visual copy of sphere wallet's `/apps/:slug` page.
 *
 * Used by dev-portal & backoffice as a live preview while editing a project.
 * No router / hooks / data fetching — every value comes via props.
 */
export function ProjectPagePreview({
  name,
  tagline,
  description,
  logoUrl,
  bannerUrl,
  accentColor = '#FF6F00',
  category,
  websiteUrl,
  discordUrl,
  twitterUrl,
  media = [],
  users = 0,
  activeQuests = 0,
  positivePercent = 0,
  ratingCount = 0,
  quests = [],
  achievements = [],
  tags = [],
}: ProjectPagePreviewProps) {
  const placeholderLogo = `https://placehold.co/80x80/${accentColor.slice(1)}/white?text=${name[0] ?? '?'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-neutral-900 dark:text-white pb-12"
    >
      {/* Banner */}
      <div className="relative mx-4 sm:mx-6 mt-2">
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            data-testid="banner"
            style={{
              backgroundColor: accentColor,
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Decorative back button (mimic sphere wallet's link to /explore) */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/80 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Explore
          </div>
        </div>

        {/* Logo — outside overflow-hidden container */}
        <div className="absolute -bottom-6 left-6 sm:left-8 z-10">
          <img
            src={logoUrl ?? placeholderLogo}
            alt={name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white dark:border-[#060606] shadow-xl"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderLogo; }}
          />
        </div>
      </div>

      {/* Info Header + Stats card */}
      <section className="px-4 sm:px-6 pt-10 pb-6">
        <div className="no-text-shadow max-w-5xl mx-auto bg-neutral-50 dark:bg-white/4 dark:backdrop-blur-2xl rounded-2xl border border-neutral-200 dark:border-white/8 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{name}</h1>
              {tagline && (
                <p className="text-neutral-500 dark:text-white/55 mt-1">{tagline}</p>
              )}
              {(category || tags.length > 0) && (
                <div className="flex items-center gap-2 mt-3">
                  {category && (
                    <span
                      className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                        border: `1px solid ${accentColor}30`,
                      }}
                    >
                      {categoryLabels[category] ?? category}
                    </span>
                  )}
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/6 text-neutral-500 dark:text-white/40 text-[10px] font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer bg-orange-500 dark:bg-brand-orange hover:bg-orange-600 dark:hover:bg-brand-orange-dark text-white shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Add to Desktop
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-white/8 text-neutral-600 dark:text-white/55 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/15 transition-colors cursor-pointer"
              >
                Open <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-white/8 text-neutral-600 dark:text-white/55 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/15 transition-colors"
                >
                  Website <Globe className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-10 border-t border-neutral-200 dark:border-white/8 mt-6 pt-5">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Users className="w-4 h-4 text-neutral-400 dark:text-white/30" />
                <span className="text-xl sm:text-2xl font-bold font-mono">{users.toLocaleString()}</span>
              </div>
              <span className="text-xs text-neutral-400 dark:text-white/35 uppercase tracking-wider">Users</span>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Target className="w-4 h-4 text-neutral-400 dark:text-white/30" />
                <span className="text-xl sm:text-2xl font-bold font-mono">{activeQuests.toLocaleString()}</span>
              </div>
              <span className="text-xs text-neutral-400 dark:text-white/35 uppercase tracking-wider">Active Quests</span>
            </div>
            {ratingCount > 0 && (
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <ThumbsUp className="w-4 h-4 text-neutral-400 dark:text-white/30" />
                  <span className="text-xl sm:text-2xl font-bold font-mono">{positivePercent}%</span>
                </div>
                <span className="text-xs text-neutral-400 dark:text-white/35 uppercase tracking-wider">
                  {ratingCount.toLocaleString()} {ratingCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Media strip */}
      {media.length > 0 && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Media</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {media.map((item, i) => {
                const isVideo = item.type === 'video';
                return (
                  <div
                    key={i}
                    className="shrink-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/8 relative"
                  >
                    <img
                      src={getMediaThumb(item)}
                      alt={isVideo ? `Video ${i + 1}` : `Screenshot ${i + 1}`}
                      draggable={false}
                      className="h-44 sm:h-52 w-72 sm:w-80 object-cover"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {description && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <div className="no-text-shadow bg-neutral-50 dark:bg-white/4 dark:backdrop-blur-2xl rounded-2xl border border-neutral-200 dark:border-white/8 p-6">
              <p className="text-neutral-600 dark:text-white/55 text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Quests */}
      {quests.length > 0 && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">
              Quests <span className="text-neutral-400 dark:text-white/35 font-normal">({quests.length})</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {quests.map((quest) => (
                <div
                  key={quest.slug}
                  className="no-text-shadow bg-white dark:bg-white/4 dark:backdrop-blur-2xl rounded-xl border border-neutral-200 dark:border-white/8 p-4 relative overflow-hidden"
                >
                  {/* Accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: accentColor }} />

                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-neutral-900 dark:text-white">{quest.title}</h4>
                      {quest.description && (
                        <p className="text-xs text-neutral-500 dark:text-white/40 mt-0.5 line-clamp-2">{quest.description}</p>
                      )}
                      {quest.difficulty && (
                        <span className={`inline-flex mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${difficultyStyles[quest.difficulty]}`}>
                          {quest.difficulty}
                        </span>
                      )}
                    </div>

                    {typeof quest.points === 'number' && (
                      <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 dark:bg-brand-orange-dim text-orange-600 dark:text-brand-orange text-xs font-semibold">
                        <Zap className="w-3 h-3" />
                        {quest.points}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">
              Achievements <span className="text-neutral-400 dark:text-white/35 font-normal">({achievements.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.slug}
                  className="no-text-shadow bg-white dark:bg-white/4 dark:backdrop-blur-2xl rounded-xl border border-neutral-200 dark:border-white/8 p-4 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mb-3" style={{
                    backgroundColor: `${accentColor}15`,
                    border: `1px solid ${accentColor}30`,
                  }}>
                    {ach.imageUrl ? (
                      <img src={ach.imageUrl} alt={ach.title} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-8 h-8" style={{ color: accentColor }} />
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2">{ach.title}</h4>
                  {typeof ach.points === 'number' && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-brand-orange">
                      <Zap className="w-3 h-3" />
                      {ach.points}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews placeholder */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          <div className="no-text-shadow bg-neutral-50 dark:bg-white/4 dark:backdrop-blur-2xl rounded-2xl border border-neutral-200 dark:border-white/8 p-6 flex flex-col items-center text-center">
            <Star className="w-8 h-8 text-neutral-300 dark:text-white/20 mb-2" />
            <p className="text-sm text-neutral-500 dark:text-white/40">Reviews coming soon</p>
          </div>
        </div>
      </section>

      {/* Social links */}
      {(websiteUrl || discordUrl || twitterUrl) && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="text-neutral-400 dark:text-white/35 hover:text-orange-500 dark:hover:text-brand-orange transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="text-neutral-400 dark:text-white/35 hover:text-orange-500 dark:hover:text-brand-orange transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {discordUrl && (
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="text-neutral-400 dark:text-white/35 hover:text-orange-500 dark:hover:text-brand-orange transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
}

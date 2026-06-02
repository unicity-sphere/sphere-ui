import { useState, type ReactNode } from 'react';

export type ProjectLogoSize = 'sm' | 'md' | 'lg';

export interface ProjectLogoProps {
  name: string;
  logoUrl?: string | null;
  /** Hex like "#FF6F00". Drives the gradient + fallback letter background. */
  accentColor?: string;
  /** Tile size — sm 36px / md 44px / lg 56–64px (desktop dock). */
  size?: ProjectLogoSize;
  /** Extra classes on the outer tile (e.g. ring, border). */
  className?: string;
  /** Absolute-positioned overlay slot (e.g. context-menu trigger, install badge). */
  children?: ReactNode;
}

const SIZE_CLASSES: Record<ProjectLogoSize, string> = {
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
};

const FALLBACK_TEXT_CLASSES: Record<ProjectLogoSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg sm:text-xl',
};

/**
 * Two-letter monogram from the project name:
 *  - "Sphere Quests"  → "SQ"
 *  - "asfsdfsdfsdf"   → "AS"
 *  - "X"              → "X"
 *  - "" / undefined   → "?"
 */
function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Some upstream tooling (seed scripts, preview pages, the legacy
 * MarketplaceProjectCard placeholder fallback) writes synthetic placeholder
 * URLs into `logoUrl`. They render as flat coloured tiles with a server-
 * baked text mark, which defeats the gradient + blik + monogram pipeline.
 * Treat them as "no logo" so the canonical fallback wins.
 */
function isPlaceholderUrl(url: string): boolean {
  return /^https?:\/\/(?:placehold\.co|placeholder\.com|via\.placeholder\.com|ui-avatars\.com|placekitten\.com|dummyimage\.com)\b/i.test(url);
}

/**
 * ProjectLogo — the canonical "app icon" visual: gradient tile +
 * mesh overlay + corner accent + edge-to-edge logo image. Pure
 * presentation, no behavior — wrap it in a button/link if interactive.
 *
 * Used everywhere a project logo appears (desktop dock, marketplace
 * cards, install previews) so the icon looks the same regardless of
 * surrounding chrome.
 */
export function ProjectLogo({
  name,
  logoUrl,
  accentColor = '#FF6F00',
  size = 'lg',
  className,
  children,
}: ProjectLogoProps) {
  const [imgError, setImgError] = useState(false);
  const isReal = !!logoUrl && !isPlaceholderUrl(logoUrl);
  const showImage = isReal && !imgError;

  // Match DesktopIcon's vivid two-tone gradient (`from-X-500 to-Y-500`)
  // by mixing accent with white at the bottom-right stop — accent stays
  // saturated at top-left, gets lighter towards bottom-right, mirroring
  // the blue→cyan / indigo→violet of built-in icons.
  const tileBackground =
    `linear-gradient(to bottom right, ${accentColor}, color-mix(in srgb, ${accentColor} 60%, white))`;

  return (
    <div
      className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 overflow-hidden${className ? ' ' + className : ''}`}
      style={{ background: tileBackground }}
    >
      {/* Mesh overlay — soft directional highlights (matches DesktopIcon 1:1) */}
      <div
        className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(at 27% 37%, rgba(255,255,255,0.15) 0px, transparent 50%),' +
            'radial-gradient(at 97% 21%, rgba(255,255,255,0.10) 0px, transparent 50%)',
        }}
      />
      {/* Top-half soft lighting — works across any accentColor including
          warm/bright orange/yellow tones where a single white/10 corner blik
          (DesktopIcon's pattern) blends in. Gives the tile an iOS-style
          "lit from above" feel. */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 to-transparent pointer-events-none" />
      {/* Sharp corner blik — concentrated highlight in the top-right, same
          shape as DesktopIcon's. Sits UNDER the logo image so a real square
          logo covers it (no random gloss on photo logos). */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/30 rounded-bl-full pointer-events-none" />

      {showImage ? (
        <img
          src={logoUrl ?? undefined}
          alt={name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      ) : (
        <span className={`text-white font-bold relative z-10 tracking-tight drop-shadow-sm ${FALLBACK_TEXT_CLASSES[size]}`}>
          {getInitials(name)}
        </span>
      )}

      {children}
    </div>
  );
}

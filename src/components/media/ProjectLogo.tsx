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
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl sm:text-3xl',
};

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
  const showImage = logoUrl && !imgError;

  return (
    <div
      className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center shadow-lg overflow-hidden${className ? ' ' + className : ''}`}
      style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
    >
      {/* Mesh overlay — soft directional highlights */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(at 27% 37%, rgba(255,255,255,0.15) 0px, transparent 50%),' +
            'radial-gradient(at 97% 21%, rgba(255,255,255,0.1) 0px, transparent 50%)',
        }}
      />
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-bl-full pointer-events-none" />

      {showImage ? (
        <img
          src={logoUrl ?? undefined}
          alt={name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      ) : (
        <span className={`text-white font-bold relative z-10 ${FALLBACK_TEXT_CLASSES[size]}`}>
          {name[0] ?? '?'}
        </span>
      )}

      {children}
    </div>
  );
}

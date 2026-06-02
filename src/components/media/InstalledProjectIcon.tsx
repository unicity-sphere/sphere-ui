import { useState } from 'react';
import { motion } from 'framer-motion';

export interface InstalledProjectIconProps {
  name: string;
  logoUrl?: string | null;
  /** Hex like "#FF6F00". Defaults to brand orange. */
  accentColor?: string;
  onClick?: () => void;
  /** When true, render the name label under the icon (dock vs grid layout). Default true. */
  showLabel?: boolean;
}

/**
 * InstalledProjectIcon — 1:1 visual copy of sphere wallet's desktop installed-project icon.
 *
 * Stripped of context menu / install state / router navigation logic.
 * Drop-in preview component for design tooling.
 */
export function InstalledProjectIcon({
  name,
  logoUrl,
  accentColor = '#FF6F00',
  onClick,
  showLabel = true,
}: InstalledProjectIconProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.08, y: -4 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.05 }}
        className="flex flex-col items-center gap-2 p-3 rounded-2xl group cursor-pointer relative"
      >
        {/* Icon */}
        <div className="relative">
          {/* Glow */}
          <div
            className="absolute -inset-1 blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300 rounded-2xl"
            style={{ backgroundColor: accentColor }}
          />

          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            {/* Mesh overlay */}
            <div
              className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500"
              style={{
                backgroundImage: `radial-gradient(at 27% 37%, rgba(255,255,255,0.15) 0px, transparent 50%),
                                 radial-gradient(at 97% 21%, rgba(255,255,255,0.1) 0px, transparent 50%)`,
              }}
            />
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-full group-hover:w-10 group-hover:h-10 transition-all duration-300" />

            {logoUrl && !imgError ? (
              <img
                src={logoUrl}
                alt={name}
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            ) : (
              <span className="text-white font-bold text-2xl sm:text-3xl relative z-10">{name[0] ?? '?'}</span>
            )}
          </div>
        </div>

        {/* Label */}
        {showLabel && (
          <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-[rgba(255,255,255,0.45)] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors truncate max-w-20 sm:max-w-24 text-center leading-tight">
            {name}
          </span>
        )}
      </motion.button>
    </div>
  );
}

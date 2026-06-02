import { type ReactNode, type MouseEvent, type Ref } from 'react';
import { motion } from 'framer-motion';
import { ProjectLogo } from './ProjectLogo';

/** Loose typing — dnd-kit listeners/attributes don't fit React's HTMLButtonAttributes due to motion.button overrides. */
type ButtonExtraProps = {
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>;

export interface InstalledProjectIconProps {
  name: string;
  logoUrl?: string | null;
  /** Hex like "#FF6F00". Defaults to brand orange. */
  accentColor?: string;
  onClick?: () => void;
  /** Right-click handler. Wallet uses it to toggle a context menu. */
  onContextMenu?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Slot overlaid on the icon tile (absolute top/right). Wallet uses it for the MoreVertical menu button. */
  topRightAction?: ReactNode;
  /** When true, render the name label under the icon (dock vs grid layout). Default true. */
  showLabel?: boolean;
  /** Ref attached to the inner button. Use for dnd-kit `setActivatorNodeRef`. */
  buttonRef?: Ref<HTMLButtonElement>;
  /** Extra props spread on the inner button (e.g. dnd-kit `attributes` + `listeners`). */
  buttonProps?: ButtonExtraProps;
}

/**
 * InstalledProjectIcon — desktop tile for an installed app/skill.
 *
 * Composes the shared ProjectLogo visual with a button wrapper that
 * adds hover/tap animation, a glow halo, and a name label underneath.
 * Behavior is driven entirely by props: pass `onClick` for the
 * primary action, `onContextMenu` for right-click, and
 * `topRightAction` to overlay a small action button on the tile.
 */
export function InstalledProjectIcon({
  name,
  logoUrl,
  accentColor = '#FF6F00',
  onClick,
  onContextMenu,
  topRightAction,
  showLabel = true,
  buttonRef,
  buttonProps,
}: InstalledProjectIconProps) {
  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        whileHover={{ scale: 1.08, y: -4 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.05 }}
        {...buttonProps}
        className={`flex flex-col items-center gap-2 p-3 rounded-2xl group cursor-pointer relative${buttonProps?.className ? ' ' + buttonProps.className : ''}`}
        style={{ touchAction: 'none', ...buttonProps?.style }}
      >
        <div className="relative">
          {/* Glow halo — outside the tile so it bleeds past the rounded edges */}
          <div
            className="absolute -inset-1 blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300 rounded-2xl pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
          <ProjectLogo
            name={name}
            logoUrl={logoUrl}
            accentColor={accentColor}
            size="lg"
            className="group-hover:shadow-xl transition-all duration-200"
          >
            {topRightAction}
          </ProjectLogo>
        </div>

        {showLabel && (
          <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-[rgba(255,255,255,0.45)] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors truncate max-w-20 sm:max-w-24 text-center leading-tight">
            {name}
          </span>
        )}
      </motion.button>
    </div>
  );
}

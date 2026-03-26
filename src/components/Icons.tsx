/**
 * Consistent SVG icon set for the admin panel.
 * Same style as sidebar icons in App.tsx: strokeWidth 1.5, single-path, 24x24 viewBox.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function I({ d, size = 16, className, style }: IconProps & { d: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}
    >
      <path d={d} />
    </svg>
  );
}

// Path data — same format as ICONS in App.tsx
const P = {
  // Navigation
  back:          'M19 12H5 M12 19l-7-7 7-7',
  undo:          'M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13',

  // Tabs (matching sidebar style)
  quests:        'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  tracks:        'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  settings:      'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  chain:         'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  plus:          'M12 5v14 M5 12h14',

  // Actions
  edit:          'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  trash:         'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  x:             'M18 6L6 18 M6 6l12 12',
  check:         'M20 6L9 17l-5-5',
  search:        'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',

  // Arrows
  chevronUp:     'M18 15l-6-6-6 6',
  chevronDown:   'M6 9l6 6 6-6',
  chevronsDown:  'M7 13l5 5 5-5 M7 6l5 5 5-5',
  chevronsRight: 'M13 17l5-5-5-5 M6 17l5-5-5-5',
  arrowRight:    'M5 12h14 M12 5l7 7-7 7',

  // Shapes
  play:          'M5 3l14 9-14 9V3z',
  star:          'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z',
  diamond:       'M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0L2.7 10.3z',
  circle:        'M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
} as const;

// ─── Exports ──────────────────────────────────────────────────────────────────

export const IconBack          = (p: IconProps) => <I d={P.back} {...p} />;
export const IconUndo          = (p: IconProps) => <I d={P.undo} {...p} />;

export const IconQuests        = (p: IconProps) => <I d={P.quests} {...p} />;
export const IconTracks        = (p: IconProps) => <I d={P.tracks} {...p} />;
export const IconSettings      = (p: IconProps) => <I d={P.settings} {...p} />;
export const IconChain         = (p: IconProps) => <I d={P.chain} {...p} />;
export const IconPlus          = (p: IconProps) => <I d={P.plus} {...p} />;

export const IconEdit          = (p: IconProps) => <I d={P.edit} {...p} />;
export const IconTrash         = (p: IconProps) => <I d={P.trash} {...p} />;
export const IconX             = (p: IconProps) => <I d={P.x} {...p} />;
export const IconCheck         = (p: IconProps) => <I d={P.check} {...p} />;
export const IconSearch        = (p: IconProps) => <I d={P.search} {...p} />;

export const IconChevronUp     = (p: IconProps) => <I d={P.chevronUp} {...p} />;
export const IconChevronDown   = (p: IconProps) => <I d={P.chevronDown} {...p} />;
export const IconChevronsDown  = (p: IconProps) => <I d={P.chevronsDown} {...p} />;
export const IconChevronsRight = (p: IconProps) => <I d={P.chevronsRight} {...p} />;
export const IconArrowRight    = (p: IconProps) => <I d={P.arrowRight} {...p} />;

export const IconPlay          = (p: IconProps) => <I d={P.play} {...p} />;
export const IconStar          = (p: IconProps) => <I d={P.star} {...p} />;
export const IconDiamond       = (p: IconProps) => <I d={P.diamond} {...p} />;
export const IconCircle        = (p: IconProps) => <I d={P.circle} {...p} />;

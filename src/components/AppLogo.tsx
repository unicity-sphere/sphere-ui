import type { ReactNode } from 'react';

interface AppLogoProps {
  /** Short code displayed in the icon (e.g. "SQ", "SD") */
  icon?: string | ReactNode;
  /** App title (e.g. "SPHERE QUESTS") */
  title: string;
  /** Subtitle (e.g. "ADMIN", "DEVELOPER") */
  subtitle?: string;
  /** Click handler (e.g. navigate to dashboard) */
  onClick?: () => void;
}

/**
 * App logo for dashboard sidebar.
 * Orange icon + Anton title + Geist subtitle.
 */
export function AppLogo({ icon, title, subtitle, onClick }: AppLogoProps) {
  const content = (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs relative"
        style={{
          background: 'var(--accent)',
          boxShadow: '0 0 16px rgba(255, 111, 0, 0.2)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.04em',
        }}
      >
        {icon ?? title.slice(0, 2)}
      </div>
      <div>
        <div
          className="text-sm"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="text-[10px] tracking-widest uppercase"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="cursor-pointer text-left">
        {content}
      </button>
    );
  }

  return content;
}

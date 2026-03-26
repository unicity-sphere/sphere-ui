import type { ReactNode } from 'react';

interface AlertBannerProps {
  type: 'warning' | 'info';
  title: string;
  children: ReactNode;
}

const STYLES: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
  warning: {
    bg:         'rgba(251,191,36,0.06)',
    border:     'rgba(251,191,36,0.18)',
    icon:       '\u26A0\uFE0F',
    titleColor: '#fbbf24',
  },
  info: {
    bg:         'rgba(96,165,250,0.06)',
    border:     'rgba(96,165,250,0.18)',
    icon:       '\u2139\uFE0F',
    titleColor: '#60a5fa',
  },
};

export function AlertBanner({ type, title, children }: AlertBannerProps) {
  const s = STYLES[type];
  return (
    <div
      className="rounded-lg p-3 text-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 text-sm leading-5">{s.icon}</span>
        <div>
          <div className="font-medium text-xs mb-0.5" style={{ color: s.titleColor }}>{title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

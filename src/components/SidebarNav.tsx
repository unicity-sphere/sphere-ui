import type { ReactNode } from 'react';

export interface NavItem {
  to: string;
  label: string;
  /** SVG path data for the icon (24x24 viewBox) */
  icon?: string;
  /** Custom icon element (overrides icon path) */
  iconElement?: ReactNode;
  /** Badge count (e.g. pending reviews) */
  badge?: number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  groups: NavGroup[];
  /** Current path for active state detection */
  currentPath: string;
  /** Called when a nav item is clicked */
  onNavigate: (to: string) => void;
}

function SvgIcon({ d }: { d: string }) {
  return (
    <svg
      width="16" height="16"
      className="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Sidebar navigation with grouped items, icons, and badges.
 * Matches the admin panel sidebar style exactly.
 */
export function SidebarNav({ groups, currentPath, onNavigate }: SidebarNavProps) {
  const isActive = (to: string) => {
    if (to === '/') return currentPath === '/';
    return currentPath === to || currentPath.startsWith(to + '/');
  };

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div
              className="px-3 pt-5 pb-1.5"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {group.label}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map(item => {
              const active = isActive(item.to);
              return (
                <button
                  key={item.to}
                  onClick={() => onNavigate(item.to)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[0.8125rem] transition-all w-full text-left"
                  style={active ? {
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    boxShadow: 'inset 2px 0 0 var(--accent)',
                  } : {
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {item.iconElement ?? (item.icon && <SvgIcon d={item.icon} />)}
                  {item.label}
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="ml-auto min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5"
                      style={{ background: 'var(--accent)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

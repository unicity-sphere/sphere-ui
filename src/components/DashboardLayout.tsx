import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  /** Sidebar header — logo + app name */
  logo: ReactNode;
  /** Navigation content */
  nav: ReactNode;
  /** Footer content (e.g. sign out button) */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Dashboard shell with sidebar + main content area.
 * Used by sphere-backoffice and sphere-dev.
 */
export function DashboardLayout({ logo, nav, footer, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex sphere-dashboard" style={{ background: 'var(--bg-root)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 shrink-0 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-root)',
          borderRight: '1px solid var(--border)',
        }}
        onClick={(e) => {
          // Close sidebar when any button/link inside is clicked (mobile only)
          if ((e.target as HTMLElement).closest('button, a')) {
            setMobileOpen(false);
          }
        }}
      >
        {/* Accent top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
        />
        {/* Subtle orange gradient overlay (cosmetic) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,111,0,0.03) 0%, transparent 40%)' }}
        />

        {/* Logo + mobile close button */}
        <div className="px-5 py-5 relative" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            className="lg:hidden absolute top-4 right-4 p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(false)}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X className="w-4 h-4" />
          </button>
          {logo}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 flex flex-col overflow-y-auto">
          {nav}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            {footer}
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

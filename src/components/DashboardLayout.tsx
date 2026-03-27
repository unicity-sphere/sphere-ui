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
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 shrink-0 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,111,0,0.03) 0%, var(--bg-root) 40%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Accent top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
        />

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
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

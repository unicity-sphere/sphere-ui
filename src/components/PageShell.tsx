import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, action, maxWidth, children }: PageShellProps) {
  return (
    <div className={`p-6 lg:p-8 ${maxWidth ?? ''}`}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
}

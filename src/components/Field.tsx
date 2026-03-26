import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3 pb-2 border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

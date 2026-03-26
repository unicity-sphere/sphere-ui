import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface FormModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function FormModal({ title, isOpen, onClose, children, maxWidth = 'max-w-lg' }: FormModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className={`w-full ${maxWidth} mt-12 mb-12 animate-fade-in`}
        style={{
          background: '#111111',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none px-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

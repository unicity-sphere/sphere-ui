import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';

// ── Input ─────────────────────────────────────────────────────────────

const inputBase = 'w-full px-4 py-2.5 bg-neutral-100 dark:bg-white/6 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/25 rounded-xl border border-neutral-200 dark:border-white/8 focus:outline-none focus:border-orange-500 dark:focus:border-brand-orange transition-colors disabled:opacity-50';
const inputError = 'border-red-400 dark:border-red-500/50 focus:border-red-500';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => (
    <input
      ref={ref}
      className={`${inputBase} ${error ? inputError : ''} ${className}`}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${inputBase} min-h-20 resize-y ${error ? inputError : ''} ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${inputBase} cursor-pointer appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat ${error ? inputError : ''} ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.28)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        paddingRight: '2rem',
      }}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

// ── Button ────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-orange-500 dark:bg-brand-orange hover:bg-orange-600 dark:hover:bg-brand-orange-dark text-white shadow-md shadow-orange-500/15 hover:shadow-lg hover:shadow-orange-500/20 active:translate-y-0 hover:-translate-y-px',
  secondary: 'bg-neutral-100 dark:bg-white/6 text-neutral-700 dark:text-white/70 border border-neutral-200 dark:border-white/8 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white',
  danger: 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20',
  ghost: 'text-neutral-500 dark:text-white/45 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/6',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', icon, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

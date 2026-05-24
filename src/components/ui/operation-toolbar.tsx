'use client';

import type { ReactNode } from 'react';

export interface OperationButton {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  disabled?: boolean;
}

interface OperationToolbarProps {
  buttons?: OperationButton[];
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary:
    'border border-border bg-surface text-zinc-700 dark:text-zinc-300 hover:bg-surface-secondary',
  outline:
    'border border-border text-zinc-700 dark:text-zinc-300 hover:bg-surface-secondary',
  danger:
    'bg-danger text-white hover:bg-red-700 dark:hover:bg-red-500 shadow-sm',
  ghost:
    'text-muted hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-surface-secondary',
};

export function OperationToolbar({ buttons, children, className = '' }: OperationToolbarProps) {
  if (!buttons?.length && !children) return null;

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 ${className}`}>
      {buttons?.map((btn) => (
        <button
          key={btn.key}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
            variantStyles[btn.variant ?? 'secondary']
          } ${btn.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          {btn.icon && <span className="h-4 w-4 shrink-0">{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
      {children}
    </div>
  );
}

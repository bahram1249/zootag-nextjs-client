import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  outline?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { solid: string; outline: string }> = {
  default: {
    solid: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    outline: 'border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400',
  },
  primary: {
    solid: 'bg-primary-light text-primary dark:bg-primary-light dark:text-primary',
    outline: 'border-primary text-primary dark:border-primary dark:text-primary',
  },
  success: {
    solid: 'bg-success-light text-success dark:bg-success-light dark:text-success',
    outline: 'border-success text-success dark:border-success dark:text-success',
  },
  warning: {
    solid: 'bg-warning-light text-warning dark:bg-warning-light dark:text-warning',
    outline: 'border-warning text-warning dark:border-warning dark:text-warning',
  },
  danger: {
    solid: 'bg-danger-light text-danger dark:bg-danger-light dark:text-danger',
    outline: 'border-danger text-danger dark:border-danger dark:text-danger',
  },
  info: {
    solid: 'bg-info-light text-info dark:bg-info-light dark:text-info',
    outline: 'border-info text-info dark:border-info dark:text-info',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] leading-4 gap-1',
  md: 'px-2.5 py-0.5 text-xs leading-5 gap-1.5',
  lg: 'px-3 py-1 text-sm leading-5 gap-1.5',
};

const iconSize: Record<BadgeSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  outline = false,
  className = '',
}: BadgeProps) {
  const mode = outline ? 'outline' : 'solid';
  const base = outline ? 'border' : '';

  return (
    <span
      className={`
        inline-flex items-center rounded-[var(--radius-badge)] font-medium
        whitespace-nowrap
        ${base}
        ${variantStyles[variant][mode]}
        ${sizeStyles[size]}
        ${outline ? 'border' : ''}
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && (
        <span className={iconSize[size]}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={iconSize[size]}>{icon}</span>
      )}
    </span>
  );
}

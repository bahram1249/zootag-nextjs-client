import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              flex h-10 w-full rounded-[var(--radius-input)] border bg-white px-3 py-2
              text-sm text-zinc-900 placeholder:text-zinc-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary
              disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50
              dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
              dark:focus:ring-primary/30
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20 dark:focus:ring-danger/30' : 'border-border hover:border-border-hover dark:border-zinc-600 dark:hover:border-zinc-500'}
              ${leftIcon ? 'pl-10 rtl:pl-3 rtl:pr-10' : ''}
              ${rightIcon ? 'pr-10 rtl:pr-3 rtl:pl-10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

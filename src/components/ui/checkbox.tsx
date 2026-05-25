import { type InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, checked, onChange, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
        >
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            checked={checked}
            onChange={onChange}
            className={`
              h-4 w-4 rounded border-border text-primary
              focus:ring-2 focus:ring-primary/20 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              dark:border-zinc-600
              ${className}
            `}
            {...props}
          />
          {label}
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

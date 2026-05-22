import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            flex min-h-[80px] w-full rounded-[var(--radius-input)] border bg-white px-3 py-2
            text-sm text-zinc-900 placeholder:text-zinc-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50
            resize-y
            dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
            dark:focus:ring-primary/30
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20 dark:focus:ring-danger/30' : 'border-border hover:border-border-hover dark:border-zinc-600 dark:hover:border-zinc-500'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

'use client';

import { useState, useEffect, type InputHTMLAttributes } from 'react';
import { formatPrice, parsePrice } from '@/lib/format';

interface PriceInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number | null;
  onChange?: (value: number | null) => void;
}

export function PriceInput({ label, error, helperText, value, onChange, className = '', id, ...props }: PriceInputProps) {
  const [display, setDisplay] = useState('');
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    setDisplay(value != null ? formatPrice(value) : '');
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9,\d]/g, '');
    const numeric = parsePrice(raw);
    setDisplay(formatPrice(numeric) || raw);
    if (onChange) {
      onChange(isNaN(numeric) ? null : numeric);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Home' && e.key !== 'End') {
      e.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`
          flex h-10 w-full rounded-[var(--radius-input)] border bg-white px-3 py-2
          text-sm text-zinc-900 placeholder:text-zinc-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary
          disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-800
          dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
          dark:focus:ring-primary/30
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20 dark:focus:ring-danger/30' : 'border-border hover:border-border-hover dark:border-zinc-600 dark:hover:border-zinc-500'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}

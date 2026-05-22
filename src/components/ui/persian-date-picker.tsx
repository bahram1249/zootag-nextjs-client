'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import persianDate from 'persian-date';

interface PersianDatePickerValue {
  persianDate: string;
  gregorianDate: string;
  isoDate: string;
}

interface PersianDatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (value: PersianDatePickerValue) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const persianMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function toPersianDigits(num: number | string): string {
  const persianDigits: Record<string, string> = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
  };
  return String(num).replace(/\d/g, (d) => persianDigits[d] || d);
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

type PersianDateInstance = ReturnType<typeof persianDate>;

export function PersianDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  className = '',
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(1403);
  const [viewMonth, setViewMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [displayText, setDisplayText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pDate = value ? new persianDate(value) : new persianDate();
    setViewYear(pDate.year());
    setViewMonth(pDate.month());
    if (value) {
      setSelectedDate(value);
      setDisplayText(toPersianDigits(pDate.format('YYYY-MM-DD')));
    } else {
      setSelectedDate(null);
      setDisplayText('');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const buildCalendarGrid = useCallback((): (number | null)[][] => {
    const firstOfMonth = new persianDate([viewYear, viewMonth, 1]) as unknown as PersianDateInstance;
    const startDay = firstOfMonth.day();
    const daysInMonth = firstOfMonth.daysInMonth();
    const grid: (number | null)[][] = [];
    let row: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      row.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      row.push(day);
      if (row.length === 7) {
        grid.push(row);
        row = [];
      }
    }

    if (row.length > 0) {
      while (row.length < 7) {
        row.push(null);
      }
      grid.push(row);
    }

    return grid;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new persianDate();
    setViewYear(now.year());
    setViewMonth(now.month());
  };

  const handleSelectDay = useCallback(
    (day: number) => {
      const pDate = new persianDate([viewYear, viewMonth, day]) as unknown as PersianDateInstance;
      const jsDate = pDate.toDate();
      setSelectedDate(jsDate);
      setDisplayText(toPersianDigits(pDate.format('YYYY-MM-DD')));
      setOpen(false);

      if (onChange) {
        const pDateStr = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
        const gDate = new persianDate(pDateStr).toCalendar('gregorian') as unknown as PersianDateInstance;
        const gYear = gDate.year();
        const gMonth = pad(gDate.month());
        const gDay = pad(gDate.date());
        const gregorianStr = `${gYear}-${gMonth}-${gDay}`;
        onChange({
          persianDate: `${viewYear}-${pad(viewMonth)}-${pad(day)}`,
          gregorianDate: gregorianStr,
          isoDate: jsDate.toISOString(),
        });
      }
    },
    [viewYear, viewMonth, onChange],
  );

  const isToday = (day: number) => {
    const today = new persianDate();
    return today.year() === viewYear && today.month() === viewMonth && today.date() === day;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const pDate = new persianDate(selectedDate);
    return pDate.year() === viewYear && pDate.month() === viewMonth && pDate.date() === day;
  };

  const grid = buildCalendarGrid();

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          value={displayText}
          onFocus={() => !disabled && setOpen(true)}
          className={`
            flex h-10 w-full rounded-[var(--radius-input)] border bg-white px-3 py-2 pr-10
            text-sm text-zinc-900 placeholder:text-zinc-400
            transition-all duration-200 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50
            dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
            dark:focus:ring-primary/30
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20 dark:focus:ring-danger/30' : 'border-border hover:border-border-hover dark:border-zinc-600 dark:hover:border-zinc-500'}
          `}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {open && (
        <div
          className="absolute top-full mt-1 z-50 w-[280px] rounded-xl border border-border bg-white p-3 shadow-lg
                     dark:bg-zinc-900 dark:border-zinc-700"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => { setViewYear((y) => y - 1); }}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                         dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m11 17-5-5 5-5" />
                <path d="m18 17-5-5 5-5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                         dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
              {toPersianDigits(viewYear)}{' '}
              {persianMonthNames[viewMonth - 1]}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                         dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setViewYear((y) => y + 1); }}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100
                         dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m13 17 5-5-5-5" />
                <path d="m6 17 5-5-5-5" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {persianWeekDays.map((d) => (
              <div
                key={d}
                className="flex h-8 items-center justify-center text-xs font-medium text-zinc-400 dark:text-zinc-500"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((row, ri) =>
              row.map((day, ci) => {
                if (day === null) {
                  return <div key={`${ri}-${ci}`} className="h-8" />;
                }
                const selected = isSelected(day);
                const today = isToday(day);
                return (
                  <button
                    key={`${ri}-${ci}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`
                      flex h-8 w-full items-center justify-center rounded-lg text-sm transition-all duration-150
                      ${selected
                        ? 'bg-primary text-white font-medium shadow-sm'
                        : today
                          ? 'text-primary font-medium hover:bg-primary-light'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}
                    `}
                  >
                    {toPersianDigits(day)}
                  </button>
                );
              }),
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-border dark:border-zinc-700 flex justify-center">
            <button
              type="button"
              onClick={handleGoToday}
              className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
            >
              امروز
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}

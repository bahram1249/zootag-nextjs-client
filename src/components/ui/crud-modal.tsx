'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select } from './select';
import { Checkbox } from './checkbox';
import { PersianDatePicker } from './persian-date-picker';
import { PriceInput } from './price-input';

function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'price';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  optionsEndpoint?: string;
  optionsLabelKey?: string;
  optionsValueKey?: string;
  minLength?: number;
  maxLength?: number;
}

interface CrudModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  fields: FieldDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?: Record<string, any>;
  loading?: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onClose: () => void;
  renderCustomField?: (field: FieldDef, value: unknown, onChange: (v: unknown) => void, error?: string) => ReactNode;
  children?: ReactNode;
}

export function CrudModal({
  open,
  mode,
  title,
  fields,
  initialValues = {},
  loading = false,
  onSave,
  onClose,
  renderCustomField,
  children,
}: CrudModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(
        mode === 'edit'
          ? { ...initialValues }
          : Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? false : ''])),
      );
      setErrors({});
    }
  }, [open, mode, fields]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required) {
        const v = values[field.name];
        if (v === undefined || v === null || v === '') {
          newErrors[field.name] = 'این فیلد الزامی است';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(values);
  };

  const renderField = (field: FieldDef): ReactNode => {
    const value = values[field.name] ?? '';
    const error = errors[field.name];

    if (renderCustomField) {
      const custom = renderCustomField(field, value, (v) => setValue(field.name, v), error);
      if (custom != null) return <div key={field.name}>{custom}</div>;
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            key={field.name}
            label={field.label}
            value={String(value)}
            onChange={(e) => setValue(field.name, e.target.value)}
            error={error}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'boolean':
        return (
          <Checkbox
            key={field.name}
            label={field.label}
            checked={Boolean(value)}
            onChange={(e) => setValue(field.name, e.target.checked)}
          />
        );

      case 'select':
        return (
          <Select
            key={field.name}
            label={field.label}
            value={String(value ?? '')}
            onChange={(e) =>
              setValue(field.name, field.options?.[0]?.value === 'number' ? Number(e.target.value) : e.target.value)
            }
            options={(field.options ?? []).map((o) => ({ value: String(o.value), label: o.label }))}
            error={error}
            placeholder={field.placeholder || `انتخاب ${field.label}...`}
          />
        );

      case 'number':
        return (
          <Input
            key={field.name}
            label={field.label}
            type="number"
            value={String(value ?? '')}
            onChange={(e) => setValue(field.name, e.target.value === '' ? '' : Number(e.target.value))}
            error={error}
            placeholder={field.placeholder}
          />
        );

      case 'price':
        return (
          <PriceInput
            key={field.name}
            label={field.label}
            value={value as number | null | undefined}
            onChange={(v) => setValue(field.name, v)}
            error={error}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <PersianDatePicker
            key={field.name}
            label={field.label}
            value={toDate(value)}
            onChange={(v) => setValue(field.name, v.isoDate)}
            error={error}
            placeholder={field.placeholder}
          />
        );

      default:
        return (
          <Input
            key={field.name}
            label={field.label}
            value={String(value ?? '')}
            onChange={(e) => setValue(field.name, e.target.value)}
            error={error}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4 max-h-[60vh]">
          {fields.map(renderField)}
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mode === 'create' ? 'ایجاد...' : 'ذخیره...'}
              </span>
            ) : mode === 'create' ? (
              'ایجاد'
            ) : (
              'ذخیره'
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Column } from './data-table';
import { ConfirmDialog } from './confirm-dialog';
import { CrudModal } from './crud-modal';
import type { FieldDef } from './crud-modal';

export interface LookupConfig {
  endpoint: string;
  labelKey: string;
  valueKey: string;
  columns: Column<Record<string, unknown>>[];
  formFields: FieldDef[];
  title: string;
}

interface LookupDialogProps {
  open: boolean;
  config: LookupConfig;
  selectedValue: string | number | null;
  onSelect: (value: string | number, label: string, row: Record<string, unknown>) => void;
  onClose: () => void;
  defaultLimit?: number;
}

export function LookupDialog({
  open,
  config,
  selectedValue,
  onSelect,
  onClose,
  defaultLimit = 10,
}: LookupDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = defaultLimit;

  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [crudItem, setCrudItem] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoading(true);

    const params: Record<string, unknown> = {
      limit,
      offset,
    };
    if (debouncedSearch) params.search = debouncedSearch;

    apiClient
      .get<Record<string, unknown>[]>(config.endpoint, params)
      .then(({ result, total: count }) => {
        if (!cancelled) {
          setData(result);
          setTotal(count ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, config.endpoint, limit, offset, debouncedSearch, refreshKey]);

  const handleCrudSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (crudMode === 'create') {
        await apiClient.post(config.endpoint, values);
      } else {
        await apiClient.put(`${config.endpoint}/${crudItem!.id}`, values);
      }
      setCrudOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCrudDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`${config.endpoint}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const currentPage = totalPages > 0 ? Math.floor(offset / limit) + 1 : 0;

  if (!open) return null;

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={onClose}
        className="fixed inset-0 z-50 m-auto w-full max-w-2xl rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">انتخاب {config.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCrudMode('create'); setCrudItem(null); setCrudOpen(true); }}
              className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              افزودن
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="h-9 w-full rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-zinc-900 placeholder-muted outline-none transition-colors focus:border-primary dark:text-zinc-100"
            />
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto p-6 pt-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">موردی یافت نشد</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  {config.columns.map((col) => (
                    <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-muted">
                      {col.header}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/50 ${
                      String(row[config.valueKey]) === String(selectedValue)
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    {config.columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-zinc-900 dark:text-zinc-100">
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] != null
                            ? String(row[col.key])
                            : '—'}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <button
                        onClick={() => {
                          onSelect(row[config.valueKey] as string | number, row[config.labelKey] as string, row);
                          onClose();
                        }}
                        className="flex h-7 items-center rounded bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        انتخاب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm">
            <p className="text-muted">
              {`${Math.min(offset + 1, total)}-${Math.min(offset + limit, total)} از ${total}`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOffset((p) => Math.max(0, p - limit))}
                disabled={currentPage <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted">...</span>
                    )}
                    <button
                      onClick={() => setOffset((p - 1) * limit)}
                      className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-primary text-white'
                          : 'text-muted hover:bg-surface-secondary'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}

              <button
                onClick={() => setOffset((p) => p + limit)}
                disabled={currentPage >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </dialog>

      <CrudModal
        open={crudOpen}
        mode={crudMode}
        title={crudMode === 'create' ? `افزودن ${config.title}` : `ویرایش ${config.title}`}
        fields={config.formFields}
        initialValues={crudItem ?? {}}
        loading={saving}
        onSave={handleCrudSave}
        onClose={() => setCrudOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این آیتم اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleCrudDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

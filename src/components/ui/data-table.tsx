'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  apiEndpoint: string;
  title: string;
  description?: string;
  defaultLimit?: number;
  ignorePaging?: boolean;
  hideHeader?: boolean;
  extraParams?: Record<string, unknown>;
}

export function DataTable<T>({
  columns,
  apiEndpoint,
  title,
  description,
  defaultLimit = 10,
  ignorePaging = false,
  hideHeader = false,
  extraParams,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = defaultLimit;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const params: Record<string, unknown> = { ...extraParams };
    if (ignorePaging) {
      params.ignorePaging = true;
    } else {
      params.limit = limit;
      params.offset = offset;
      if (debouncedSearch) params.search = debouncedSearch;
    }

    apiClient
      .get<T[]>(apiEndpoint, params)
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
  }, [apiEndpoint, limit, offset, debouncedSearch, ignorePaging, extraParams]);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const currentPage = totalPages > 0 ? Math.floor(offset / limit) + 1 : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      {!hideHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
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
              className="h-9 w-56 rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-zinc-900 placeholder-muted outline-none transition-colors focus:border-primary dark:text-zinc-100"
            />
          </div>
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted">نتیجه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/50"
                  >
                    {columns.map((col) => {
                      const cellValue = (row as Record<string, unknown>)[col.key];
                      return (
                        <td key={col.key} className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                          {col.render
                            ? col.render(cellValue, row)
                            : cellValue != null
                              ? String(cellValue)
                              : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>

      {/* pagination — only when paging is enabled and there's data */}
      {!ignorePaging && totalPages > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="text-muted">
            {`${Math.min(offset + 1, total)}-${Math.min(offset + limit, total)} از ${total}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOffset((p) => Math.max(0, p - limit))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
